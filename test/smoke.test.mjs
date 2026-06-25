/**
 * Smoke tests that load the built UMD bundle on top of a real jQuery 4 instance
 * (via jsdom) and assert the public surface behaves. `jQuery.ajax` is stubbed so
 * nothing hits the network — we only verify how requests are shaped.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);

// A real jQuery 4, bound to a jsdom window. jQuery 4 reads the global `window`
// at require time, so it must be set before the module is loaded.
const { window } = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
globalThis.window = window;
const jQuery = require('jquery');

// The UMD bundle binds to globalThis and reads globalThis.jQuery.
globalThis.jQuery = jQuery;
const umd = readFileSync(new URL('../dist/jquery-bpql.umd.js', import.meta.url), 'utf8');
new Function(umd).call(globalThis);

// Capture ajax settings instead of performing a request.
let lastSettings = null;
jQuery.ajax = (settings) => {
  lastSettings = settings;
  return { done() { return this; }, fail() { return this; }, always() { return this; } };
};
jQuery.bpql.defaults.automaticLoader = false;

test('reports the running jQuery 4 version', () => {
  assert.match(jQuery.fn.jquery, /^4\./);
});

test('registers $.bpql and backwards-compatible aliases', () => {
  assert.equal(typeof jQuery.bpql, 'function');
  assert.equal(jQuery.bipbop, jQuery.bpql);
  assert.equal(typeof jQuery.bipbopAssert, 'function');
  assert.equal(jQuery.bipbopDefaults, jQuery.bpql.defaults);
  assert.equal(typeof jQuery.bpql.socket, 'function');
  assert.equal(typeof jQuery.bpql.config.webserviceAddress, 'string');
});

test('builds a GET request with query, key and named parameters', () => {
  jQuery.bpql("SELECT FROM 'PLACA'.'CONSULTA'", 'MY_KEY', {
    parameters: { placa: 'ABC1234' },
  });
  assert.equal(lastSettings.method, 'GET');
  assert.equal(lastSettings.dataType, 'xml');
  assert.equal(lastSettings.url, jQuery.bpql.config.webserviceAddress);
  assert.equal(lastSettings.data.q, "SELECT FROM 'PLACA'.'CONSULTA'");
  assert.equal(lastSettings.data.apiKey, 'MY_KEY');
  assert.equal(lastSettings.data.placa, 'ABC1234');
});

test('falls back to the free key and default query', () => {
  jQuery.bpql();
  assert.equal(lastSettings.data.q, "SELECT FROM 'INFO'.'INFO'");
  assert.equal(lastSettings.data.apiKey, jQuery.bpql.FREE_KEY);
});

test('supports the $.bpql(query, options) shorthand', () => {
  jQuery.bpql("SELECT FROM 'INFO'.'INFO'", { apiKey: 'SHORT', method: 'POST' });
  assert.equal(lastSettings.method, 'POST');
  assert.equal(lastSettings.data.apiKey, 'SHORT');
});

test('prepends the JSONP adapter when dataType is jsonp', () => {
  jQuery.bpql("SELECT FROM 'INFO'.'INFO'", 'K', { dataType: 'jsonp' });
  assert.ok(lastSettings.data.q.startsWith("USING 'JSONP' "));
});

test('assert() and exception() parse a BPQL error document', () => {
  const xml = jQuery.parseXML(
    "<BPQL><header><exception code=\"6\" source=\"PLACA.CONSULTA\" push=\"false\">not found</exception></header></BPQL>",
  );
  let captured = null;
  const hadError = jQuery.bpql.assert(xml, (source, message, code, push) => {
    captured = { source, message, code, push };
  });
  assert.equal(hadError, true);
  assert.deepEqual(captured, {
    source: 'PLACA.CONSULTA', message: 'not found', code: 6, push: false,
  });

  const ok = jQuery.parseXML('<BPQL><header></header><body>ok</body></BPQL>');
  assert.equal(jQuery.bpql.assert(ok), false);
  assert.equal(jQuery.bpql.exception(ok), null);
});
