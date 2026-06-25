import config from './config';
import FREE_KEY from './free-key';

/**
 * Thin, self-healing wrapper around the BIPBOP realtime WebSocket. It
 * authenticates on connect, queues messages sent while offline, and
 * transparently reconnects after `config.reconnectAfter` milliseconds.
 *
 * Prefer the {@link BPQLSocket.open} helper over `new BPQLSocket()` for the
 * common case.
 */
export default class BPQLSocket {
  /**
   * Open a socket and return a `send` function bound to it. The returned
   * function also exposes `.socket` (the instance) and `.close()`.
   *
   * ```js
   * const send = $.bpql.socket('YOUR_API_KEY', (message) => console.log(message));
   * send({ query: "SELECT FROM 'INFO'.'INFO'" });
   * // later: send.close();
   * ```
   *
   * @param {string} [apiKey] API key.
   * @param {function(*, MessageEvent): void} [onMessage] Message handler.
   * @param {function(WebSocket): void} [onConnect] Connection handler.
   * @returns {function(*, function=): boolean} Bound `send` function.
   */
  static open(apiKey, onMessage, onConnect) {
    const socket = new BPQLSocket(apiKey, onMessage, onConnect);
    const send = (...args) => socket.send(...args);
    send.socket = socket;
    send.close = () => socket.close();
    return send;
  }

  constructor(apiKey = FREE_KEY, onMessage = null, onConnect = null) {
    this.apiKey = apiKey;
    this.onMessage = onMessage;
    this.onConnect = onConnect;
    this.queue = [];
    this.ws = null;
    this.closedByUser = false;
    this.connect();
  }

  connect() {
    const ws = new WebSocket(config.websocketAddress);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify(this.apiKey));
      while (this.queue.length) {
        this.send(...this.queue.shift());
      }
      if (this.onConnect) {
        this.onConnect(ws);
      }
    };

    ws.onmessage = (event) => {
      if (!this.onMessage || !event.data) {
        return;
      }
      let payload;
      try {
        payload = JSON.parse(event.data);
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
   * @param {*} data Payload to send (serialized as JSON).
   * @param {Function} [onSend] Invoked once the payload is flushed.
   * @returns {boolean} `true` if sent immediately, `false` if queued.
   */
  send(data, onSend) {
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
  close() {
    this.closedByUser = true;
    if (this.ws) {
      this.ws.close();
    }
  }
}
