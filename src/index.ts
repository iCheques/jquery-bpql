/**
 * jquery-bpql — a tiny jQuery plugin for talking to BPQL, the SQL-flavored
 * query language created by BIPBOP and used by CreditHub.
 *
 * Importing the module registers everything on the jQuery namespace as a side
 * effect:
 *
 * ```ts
 * import 'jquery-bpql';
 * const doc = await $.bpql("SELECT FROM 'INFO'.'INFO'");
 * ```
 *
 * Every member is also available as a named ES export.
 *
 * @packageDocumentation
 */
import jquery from 'jquery';

import bpqlFn from './core';
import config from './config';
import FREE_KEY from './free-key';
import { defaults } from './loader';
import { assert, exception } from './assert';
import BPQLSocket from './websocket';

import type { BPQLStatic } from './core';
import type { BPQLSource, BPQLExceptionCallback } from './assert';
import type { BPQLDefaults } from './loader';
import type { BPQLConnectHandler, BPQLMessageHandler, BPQLSend } from './websocket';

/** Open a realtime BPQL WebSocket. See {@link BPQLSocket.open}. */
function socket(
  apiKey?: string,
  onMessage?: BPQLMessageHandler,
  onConnect?: BPQLConnectHandler,
): BPQLSend {
  return BPQLSocket.open(apiKey, onMessage, onConnect);
}

const bpql = bpqlFn as BPQLStatic;

// Hang the helpers off the main `$.bpql` function.
jquery.extend(bpql, {
  assert,
  exception,
  socket,
  config,
  defaults,
  Socket: BPQLSocket,
  FREE_KEY,
  query: bpql,
});

// Register on jQuery, keeping the historical `bipbop` names as aliases.
jquery.extend({
  bpql,
  bipbop: bpql,
  bipbopAssert: assert,
  bipbopDefaults: defaults,
});

declare global {
  interface JQueryStatic {
    /** Run a BPQL query against the WebService. */
    bpql: BPQLStatic;
    /** @deprecated Backwards-compatible alias of {@link JQueryStatic.bpql}. */
    bipbop: BPQLStatic;
    /** @deprecated Use `$.bpql.assert` instead. */
    bipbopAssert(document: BPQLSource, callback?: BPQLExceptionCallback): boolean;
    /** @deprecated Use `$.bpql.defaults` instead. */
    bipbopDefaults: BPQLDefaults;
  }
}

export default bpql;
export {
  bpql,
  assert,
  exception,
  socket,
  config,
  defaults,
  FREE_KEY,
  BPQLSocket,
};
export type {
  BPQLStatic,
  BPQLRequestOptions,
} from './core';
export type {
  BPQLSource,
  BPQLException,
  BPQLExceptionCallback,
} from './assert';
export type { BPQLConfig } from './config';
export type { BPQLDefaults } from './loader';
export type {
  BPQLSend,
  BPQLMessageHandler,
  BPQLConnectHandler,
} from './websocket';
