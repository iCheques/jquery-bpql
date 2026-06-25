import jquery from 'jquery';
import config from './config';
import FREE_KEY from './free-key';
import { attachLoader } from './loader';
import type { BPQLException, BPQLExceptionCallback, BPQLSource } from './assert';
import type { BPQLConfig } from './config';
import type { BPQLDefaults } from './loader';
import type { BPQLSend, BPQLConnectHandler, BPQLMessageHandler } from './websocket';
import type BPQLSocket from './websocket';

/** Query used when `$.bpql()` is called with no arguments — a cheap ping. */
const DEFAULT_QUERY = "SELECT FROM 'INFO'.'INFO'";

/**
 * Options accepted by `$.bpql`. A superset of jQuery.ajax settings plus two
 * BPQL-specific extras.
 */
export interface BPQLRequestOptions extends JQuery.AjaxSettings {
  /** API key — an alternative to the positional `apiKey` argument. */
  apiKey?: string;
  /** BPQL named parameters merged into the request. */
  parameters?: Record<string, unknown>;
}

/**
 * The `$.bpql` callable together with its helpers. Returns the jqXHR from
 * `jQuery.ajax`, so `.done()`, `.fail()`, `await` and friends all work.
 */
export interface BPQLStatic {
  /** Run a BPQL query. */
  (query?: string, apiKey?: string, options?: BPQLRequestOptions): JQuery.jqXHR;
  /** Shorthand omitting the key: `$.bpql(query, options)`. */
  (query: string, options: BPQLRequestOptions): JQuery.jqXHR;
  assert(document: BPQLSource, callback?: BPQLExceptionCallback): boolean;
  exception(document: BPQLSource): BPQLException | null;
  socket(apiKey?: string, onMessage?: BPQLMessageHandler, onConnect?: BPQLConnectHandler): BPQLSend;
  config: BPQLConfig;
  defaults: BPQLDefaults;
  Socket: typeof BPQLSocket;
  FREE_KEY: string;
  /** Alias of the callable itself. */
  query: BPQLStatic;
}

/** Detect a JSONP request so we can ask the server for the JSONP adapter. */
function usesJsonp(dataType?: string): boolean {
  return typeof dataType === 'string' && /\bjsonp\b/i.test(dataType);
}

/**
 * Run a BPQL query against the BIPBOP/CreditHub WebService.
 *
 * BPQL targets a database and a table — `SELECT FROM 'DATABASE'.'TABLE'` — and
 * named parameters are passed through `options.parameters`.
 */
function bpql(
  query: string = DEFAULT_QUERY,
  apiKey?: string | BPQLRequestOptions,
  options?: BPQLRequestOptions,
): JQuery.jqXHR {
  let opts: BPQLRequestOptions;
  let key: string | undefined;

  // Support the shorthand `$.bpql(query, options)`.
  if (apiKey !== null && typeof apiKey === 'object') {
    opts = apiKey;
    key = opts.apiKey;
  } else {
    opts = options ?? {};
    key = apiKey != null ? apiKey : opts.apiKey;
  }
  if (key == null) {
    key = FREE_KEY;
  }

  const { parameters, apiKey: _ignoredKey, ...ajaxOptions } = opts;
  const adapter = usesJsonp(ajaxOptions.dataType) ? "USING 'JSONP' " : '';

  const data = jquery.extend(
    { q: adapter + query, apiKey: key },
    parameters,
    ajaxOptions.data,
  );

  const settings: JQuery.AjaxSettings = jquery.extend(
    { method: 'GET', dataType: 'xml', url: config.webserviceAddress },
    ajaxOptions,
    { data },
  );

  return jquery.ajax(attachLoader(settings));
}

export default bpql;
