import config from './config';
import FREE_KEY from './free-key';

export type BPQLMessageHandler = (message: unknown, event: MessageEvent) => void;
export type BPQLConnectHandler = (socket: WebSocket) => void;

/** The bound `send` function returned by `$.bpql.socket` / `BPQLSocket.open`. */
export interface BPQLSend {
  (data: unknown, onSend?: () => void): boolean;
  socket: BPQLSocket;
  close(): void;
}

/**
 * Thin, self-healing wrapper around the realtime BPQL WebSocket. It
 * authenticates on connect, queues messages sent while offline, and
 * transparently reconnects after `config.reconnectAfter` milliseconds.
 */
export default class BPQLSocket {
  apiKey: string;

  private onMessage: BPQLMessageHandler | null;

  private onConnect: BPQLConnectHandler | null;

  private queue: Array<[unknown, (() => void) | undefined]> = [];

  private ws: WebSocket | null = null;

  private closedByUser = false;

  /**
   * Open a socket and return a `send` function bound to it. The returned
   * function also exposes `.socket` (the instance) and `.close()`.
   */
  static open(
    apiKey?: string,
    onMessage?: BPQLMessageHandler,
    onConnect?: BPQLConnectHandler,
  ): BPQLSend {
    const socket = new BPQLSocket(apiKey, onMessage, onConnect);
    const send = ((data: unknown, onSend?: () => void) => socket.send(data, onSend)) as BPQLSend;
    send.socket = socket;
    send.close = () => socket.close();
    return send;
  }

  constructor(
    apiKey: string = FREE_KEY,
    onMessage: BPQLMessageHandler | null = null,
    onConnect: BPQLConnectHandler | null = null,
  ) {
    this.apiKey = apiKey;
    this.onMessage = onMessage;
    this.onConnect = onConnect;
    this.connect();
  }

  private connect(): void {
    const ws = new WebSocket(config.websocketAddress);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify(this.apiKey));
      while (this.queue.length) {
        const next = this.queue.shift();
        if (next) {
          this.send(next[0], next[1]);
        }
      }
      if (this.onConnect) {
        this.onConnect(ws);
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!this.onMessage || !event.data) {
        return;
      }
      let payload: unknown;
      try {
        payload = JSON.parse(event.data as string);
      } catch {
        payload = event.data;
      }
      this.onMessage(payload, event);
    };

    ws.onerror = () => ws.close();
    ws.onclose = () => {
      if (this.closedByUser) {
        return;
      }
      setTimeout(() => this.connect(), config.reconnectAfter);
    };
  }

  /**
   * Send a payload. Buffered until the socket is open. Passing a string swaps
   * the API key used for (re)authentication.
   *
   * @returns `true` if sent immediately, `false` if queued.
   */
  send(data: unknown, onSend?: () => void): boolean {
    if (typeof data === 'string') {
      this.apiKey = data;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      if (onSend) {
        onSend();
      }
      return true;
    }
    this.queue.push([data, onSend]);
    return false;
  }

  /** Close the socket and stop the auto-reconnect loop. */
  close(): void {
    this.closedByUser = true;
    if (this.ws) {
      this.ws.close();
    }
  }
}
