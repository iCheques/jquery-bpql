/**
 * jquery-bpql — a tiny jQuery plugin for talking to BPQL, the SQL-flavored
 * query language created by BIPBOP.
 *
 * Importing the module registers everything on the jQuery namespace as a side
 * effect, so the typical usage is simply:
 *
 * ```js
 * import 'jquery-bpql';
 * $.bpql("SELECT FROM 'INFO'.'INFO'").done((doc) => console.log(doc));
 * ```
 *
 * The same members are also available as named ES exports for bundlers and
 * tooling that prefer explicit imports.
 *
 * @module jquery-bpql
 */
import jquery from 'jquery';

import bpql from './core';
import config from './config';
import FREE_KEY from './free-key';
import { defaults } from './loader';
import { assert, exception } from './assert';
import BPQLSocket from './websocket';

/**
 * Open a realtime BPQL WebSocket. See {@link BPQLSocket.open}.
 *
 * @function socket
 * @memberof bpql
 */
function socket(apiKey, onMessage, onConnect) {
  return BPQLSocket.open(apiKey, onMessage, onConnect);
}

// Hang the helpers off the main `$.bpql` function so the whole surface is
// reachable from a single entry point.
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

// Register on jQuery, keeping the historical `bipbop` names as aliases so code
// written against jquery-bipbop keeps working without changes.
jquery.extend({
  bpql,
  bipbop: bpql,
  bipbopAssert: assert,
  bipbopDefaults: defaults,
});

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
