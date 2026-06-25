// Type definitions for jquery-bpql 2.0
// Project: https://github.com/icheques/jquery-bpql
//
// These types augment the global `JQueryStatic` interface (so `$.bpql` is typed
// when jQuery types are present) and also expose every member as a named export.

/** Anything that can be handed to the parsers: a BPQL XML document or markup. */
export type BPQLSource = Document | XMLDocument | Element | string;

/** Parsed representation of a BPQL `<exception>` node. */
export interface BPQLException {
  /** Database/table that raised the error (e.g. `"PLACA.CONSULTA"`). */
  source?: string;
  /** Human readable error message. */
  message: string;
  /** Numeric error code (`NaN` when the server omits it). */
  code: number;
  /** Whether the error came from a PUSH stream. */
  push: boolean;
  /** The raw document the exception was parsed from. */
  document: BPQLSource;
}

export type BPQLExceptionCallback = (
  source: string | undefined,
  message: string,
  code: number,
  push: boolean,
  document: BPQLSource,
) => void;

/** Mutable endpoint configuration shared by every transport. */
export interface BPQLConfig {
  webserviceAddress: string;
  websocketAddress: string;
  reconnectAfter: number;
}

/** Loader preferences used by `$.bpql`. */
export interface BPQLDefaults {
  loader: unknown | null;
  automaticLoader: boolean;
}

/**
 * Options accepted by `$.bpql`. A superset of jQuery.ajax settings, hence the
 * permissive index signature, with two BPQL-specific extras.
 */
export interface BPQLRequestOptions {
  /** API key — an alternative to the positional `apiKey` argument. */
  apiKey?: string;
  /** BPQL named parameters merged into the request. */
  parameters?: Record<string, unknown>;
  /** Any other jQuery.ajax setting (`success`, `error`, `method`, ...). */
  [setting: string]: unknown;
}

export type BPQLMessageHandler = (message: unknown, event: MessageEvent) => void;
export type BPQLConnectHandler = (socket: WebSocket) => void;

/** The bound `send` function returned by `$.bpql.socket` / `BPQLSocket.open`. */
export interface BPQLSend {
  (data: unknown, onSend?: () => void): boolean;
  socket: BPQLSocket;
  close(): void;
}

/** Self-healing wrapper around the BIPBOP realtime WebSocket. */
export declare class BPQLSocket {
  constructor(
    apiKey?: string,
    onMessage?: BPQLMessageHandler | null,
    onConnect?: BPQLConnectHandler | null,
  );
  static open(
    apiKey?: string,
    onMessage?: BPQLMessageHandler,
    onConnect?: BPQLConnectHandler,
  ): BPQLSend;
  apiKey: string;
  send(data: unknown, onSend?: () => void): boolean;
  close(): void;
}

/** The `$.bpql` callable together with its helpers. */
export interface BPQLStatic {
  /** Run a BPQL query. Returns the jqXHR from `jQuery.ajax`. */
  (query?: string, apiKey?: string, options?: BPQLRequestOptions): unknown;
  /** Shorthand omitting the key: `$.bpql(query, options)`. */
  (query: string, options: BPQLRequestOptions): unknown;
  assert(document: BPQLSource, callback?: BPQLExceptionCallback): boolean;
  exception(document: BPQLSource): BPQLException | null;
  socket(
    apiKey?: string,
    onMessage?: BPQLMessageHandler,
    onConnect?: BPQLConnectHandler,
  ): BPQLSend;
  config: BPQLConfig;
  defaults: BPQLDefaults;
  Socket: typeof BPQLSocket;
  FREE_KEY: string;
  /** Alias of the callable itself. */
  query: BPQLStatic;
}

export declare const bpql: BPQLStatic;
export declare function assert(document: BPQLSource, callback?: BPQLExceptionCallback): boolean;
export declare function exception(document: BPQLSource): BPQLException | null;
export declare function socket(
  apiKey?: string,
  onMessage?: BPQLMessageHandler,
  onConnect?: BPQLConnectHandler,
): BPQLSend;
export declare const config: BPQLConfig;
export declare const defaults: BPQLDefaults;
export declare const FREE_KEY: string;
export default bpql;

declare global {
  interface JQueryStatic {
    /** Run a BPQL query against the BIPBOP WebService. */
    bpql: BPQLStatic;
    /** @deprecated Backwards-compatible alias of {@link JQueryStatic.bpql}. */
    bipbop: BPQLStatic;
    /** @deprecated Use `$.bpql.assert` instead. */
    bipbopAssert(document: BPQLSource, callback?: BPQLExceptionCallback): boolean;
    /** @deprecated Use `$.bpql.defaults` instead. */
    bipbopDefaults: BPQLDefaults;
  }
}
