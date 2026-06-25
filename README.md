<div align="center">

# @credithub/jquery-bpql

**A tiny, _typed_ jQuery 4 plugin for talking to [BPQL](https://www.bipbop.com.br) — the SQL‑flavored query language created by BIPBOP and used by CreditHub.**

[![npm version](https://img.shields.io/npm/v/@credithub/jquery-bpql.svg)](https://www.npmjs.com/package/@credithub/jquery-bpql)
[![CI](https://github.com/icheques/jquery-bpql/actions/workflows/ci.yml/badge.svg)](https://github.com/icheques/jquery-bpql/actions/workflows/ci.yml)
[![jQuery 4 ready](https://img.shields.io/badge/jQuery-3%20%7C%204-0769AD.svg?logo=jquery&logoColor=white)](https://jquery.com/)
[![Written in TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

```ts
$.bpql("SELECT FROM 'PLACA'.'CONSULTA'", "YOUR_API_KEY", {
  parameters: { placa: "ABC1234" },
  success(doc) {
    console.log($(doc).find("BPQL > body marca").text());
  },
});
```

---

## What is BPQL?

**BPQL** (BIPBOP Query Language) is a small, SQL‑like language used to query the
many data sources exposed by [BIPBOP](https://www.bipbop.com.br) — and by
platforms built on it, like **CreditHub**. Instead of memorizing one REST
endpoint per data source, you write a single statement that targets a
**database** and a **table**:

```sql
SELECT FROM 'DATABASE'.'TABLE'
```

Named parameters refine the query (`{ placa: "ABC1234" }`), and the server always
answers with a predictable XML envelope:

```xml
<BPQL>
  <header>
    <query>SELECT FROM 'PLACA'.'CONSULTA'</query>
    <!-- present only when something went wrong -->
    <exception code="6" source="PLACA.CONSULTA">Plate not found</exception>
  </header>
  <body>
    <!-- your results live here -->
  </body>
</BPQL>
```

`@credithub/jquery-bpql` wraps that request/response cycle in a one‑line jQuery
call, parses errors for you, and ships a realtime WebSocket transport for PUSH
streams — all fully typed.

## Highlights

- 🎯 **One call, any data source** — `$.bpql(query, apiKey, options)` returns a
  standard jQuery [`jqXHR`](https://api.jquery.com/jquery.ajax/), so `.done()`,
  `.fail()`, `async/await` and friends all just work.
- 🟦 **Written in TypeScript** — strict types throughout; the bundled
  declarations augment `JQueryStatic`, so `$.bpql` is typed out of the box.
- 🧩 **Named parameters** — pass BPQL parameters as a plain object.
- 🛰️ **Realtime** — `$.bpql.socket()` opens a self‑healing, auto‑reconnecting
  WebSocket for PUSH notifications.
- 🚨 **First‑class error handling** — `$.bpql.assert()` / `$.bpql.exception()`
  turn the BPQL `<exception>` envelope into a tidy object.
- ⚡ **jQuery 4 ready** — modern ESM/CJS/UMD builds, no legacy polyfills, tested
  against jQuery 4 (and still compatible with 3.x).
- 🪶 **Zero runtime dependencies** — only jQuery, declared as a peer dependency.
- 🤖 **Optional loading overlay** — the classic robot, fully optional and
  customizable.

## Installation

```bash
npm install @credithub/jquery-bpql jquery
```

Or drop it in straight from a CDN (after jQuery):

```html
<script src="https://code.jquery.com/jquery-4.0.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@credithub/jquery-bpql"></script>
```

> **Note:** `@credithub/jquery-bpql` uses `$.ajax`, so it needs the **full**
> jQuery build, not the slim one.

## Quick start

### As a module (bundlers, ESM, TypeScript)

Importing the package registers everything on the jQuery namespace as a side
effect:

```ts
import $ from "jquery";
import "@credithub/jquery-bpql";

const doc = await $.bpql("SELECT FROM 'INFO'.'INFO'");
console.log($(doc).find("BPQL > header > query").text());
```

Prefer explicit imports? Every member is also a named export:

```ts
import { bpql, assert, socket } from "@credithub/jquery-bpql";
```

### As a `<script>` tag

```html
<script src="https://code.jquery.com/jquery-4.0.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@credithub/jquery-bpql"></script>
<script>
  $.bpql("SELECT FROM 'INFO'.'INFO'")
    .done((doc) => console.log(doc))
    .fail((xhr) => console.error("request failed", xhr.status));
</script>
```

## Usage guide

### Running a query

```ts
$.bpql(query, apiKey, options);
```

| Argument  | Type     | Default                      | Description                                  |
| --------- | -------- | ---------------------------- | -------------------------------------------- |
| `query`   | `string` | `SELECT FROM 'INFO'.'INFO'`  | The BPQL statement to execute.               |
| `apiKey`  | `string` | the public demo key          | Your API key (see below).                    |
| `options` | `object` | `{}`                         | jQuery.ajax settings + the extras below.     |

`options` is a **superset of jQuery.ajax settings**, plus two BPQL‑specific keys:

| Option       | Type     | Description                                       |
| ------------ | -------- | ------------------------------------------------- |
| `parameters` | `object` | BPQL named parameters merged into the request.    |
| `apiKey`     | `string` | Alternative place to provide the key.             |

The key is optional — you can also use the `$.bpql(query, options)` shorthand:

```ts
$.bpql("SELECT FROM 'PLACA'.'CONSULTA'", {
  apiKey: "YOUR_API_KEY",
  parameters: { placa: "ABC1234" },
});
```

### Passing named parameters

```ts
$.bpql("SELECT FROM 'PLACA'.'CONSULTA'", "YOUR_API_KEY", {
  parameters: { placa: "ABC1234" },
}).done((doc) => {
  const marca = $(doc).find("BPQL > body marca").text();
  console.log(`Marca: ${marca}`);
});
```

### Reading the response

The response is an XML `Document`, so traverse it with everyday jQuery:

```ts
const doc = await $.bpql("SELECT FROM 'INFO'.'INFO'");

$(doc).find("BPQL > body *").each(function () {
  console.log(this.tagName, $(this).text());
});
```

### Handling errors

BPQL reports business errors inside the document (the HTTP status is often still
`200`). Use the helpers to detect them:

```ts
const doc = await $.bpql("SELECT FROM 'PLACA'.'CONSULTA'", "KEY", {
  parameters: { placa: "INVALID" },
});

// Callback style (returns true when an exception is present):
$.bpql.assert(doc, (source, message, code, push) => {
  console.error(`[${code}] ${message} — from ${source}`);
});

// Or get a plain object (null when the query succeeded):
const error = $.bpql.exception(doc);
if (error) {
  console.error(error.code, error.message, error.source);
}
```

`$.bpql.exception(doc)` returns a typed `BPQLException | null`:

```ts
{
  source?: string;   // database/table that raised the error
  message: string;   // human readable message
  code: number;      // numeric error code
  push: boolean;     // true when it came from a PUSH stream
  document: Document // the raw XML, for further inspection
}
```

### Getting an API key

A public, heavily rate‑limited demo key is used when you don't pass one — great
for experimenting, not for production. Grab your own key from your
BIPBOP/CreditHub account and pass it as the second argument (or as
`options.apiKey`). The demo key is also exposed as `$.bpql.FREE_KEY`.

### GET, POST and JSONP

By default requests are sent as `GET` with `dataType: "xml"`. Override anything
through `options`:

```ts
// POST (handy for large queries / many parameters)
$.bpql("SELECT FROM 'PLACA'.'CONSULTA'", "KEY", {
  method: "POST",
  parameters: { placa: "ABC1234" },
});

// Cross-origin via JSONP — the plugin adds the server-side `USING 'JSONP'`
// adapter automatically when it sees a jsonp dataType.
$.bpql("SELECT FROM 'INFO'.'INFO'", "KEY", { dataType: "jsonp" });
```

### The loading overlay

While a request is in flight, the plugin shows a robot overlay. It is
reference‑counted (one overlay for any number of concurrent requests) and
completely optional.

```ts
// Disable it globally
$.bpql.defaults.automaticLoader = false;

// …or swap in your own element
$.bpql.defaults.loader = $('<div class="my-spinner">Loading…</div>');
```

### Realtime (WebSocket / PUSH)

```ts
const send = $.bpql.socket("YOUR_API_KEY", (message, event) => {
  console.log("realtime message:", message);
});

send({ query: "SELECT FROM 'INFO'.'INFO'" });

// The connection auto-reconnects on drop. Close it when you're done:
send.close();
```

### Configuration

Point the client at a different host (sandbox, on‑prem…) at runtime:

```ts
$.bpql.config.webserviceAddress = "https://irql.credithub.com.br/";
$.bpql.config.websocketAddress  = "wss://irql.credithub.com.br/ws";
$.bpql.config.reconnectAfter    = 5000; // ms before a dropped socket retries
```

## API reference

| Member                         | Description                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| `$.bpql(query, apiKey?, opts?)`| Run a BPQL query. Returns a jQuery `jqXHR`.                             |
| `$.bpql.assert(doc, cb?)`      | `true` when `doc` carries a BPQL exception; invokes `cb` if so.         |
| `$.bpql.exception(doc)`        | Parsed `BPQLException`, or `null`.                                      |
| `$.bpql.socket(key?, onMsg?, onOpen?)` | Open a realtime WebSocket; returns a bound `send` function.    |
| `$.bpql.config`                | `{ webserviceAddress, websocketAddress, reconnectAfter }`.              |
| `$.bpql.defaults`              | `{ loader, automaticLoader }`.                                         |
| `$.bpql.FREE_KEY`              | The public demo API key.                                               |
| `$.bpql.Socket`                | The underlying `BPQLSocket` class, for advanced use.                    |

All of the above are also available as named ES exports
(`import { bpql, assert, exception, socket, config, defaults, FREE_KEY, BPQLSocket } from "@credithub/jquery-bpql"`),
along with every type (`BPQLStatic`, `BPQLRequestOptions`, `BPQLException`, …).

## TypeScript

The package is written in TypeScript and ships a single bundled declaration file
that **augments the global `JQueryStatic` interface**, so `$.bpql` is fully typed
with no extra setup:

```ts
import "@credithub/jquery-bpql";

const doc: Document = await $.bpql("SELECT FROM 'INFO'.'INFO'");
const error = $.bpql.exception(doc); // BPQLException | null
```

The types build on the standard jQuery typings. If you write TypeScript, make
sure `@types/jquery` is installed (it's declared as an optional peer dependency).

## Compatibility

| jQuery | Status        |
| ------ | ------------- |
| 4.x    | ✅ Tested      |
| 3.x    | ✅ Compatible  |

Declared as a peer dependency: `jquery@>=3.0.0 <5.0.0`. Requires the full jQuery
build (the plugin relies on `$.ajax`).

## Upgrading from `jquery-bipbop` / `jquery-bpql`

This package is the modernized, TypeScript successor of `jquery-bipbop`. The old
names are kept as aliases, so existing code keeps working after you switch the
install to `@credithub/jquery-bpql`:

| Legacy               | Preferred           |
| -------------------- | ------------------- |
| `$.bipbop(...)`      | `$.bpql(...)`       |
| `$.bipbopAssert(...)`| `$.bpql.assert(...)`|
| `$.bipbopDefaults`   | `$.bpql.defaults`   |

The default endpoint is now `irql.credithub.com.br`; override `$.bpql.config` if
you need a different host.

## Development

```bash
npm install      # install dev dependencies
npm run build    # bundle src/ → dist/ (ESM, CJS, UMD + minified, and .d.ts)
npm test         # run the jQuery 4 smoke tests (node:test + jsdom)
npm run lint     # ESLint (flat config, typescript-eslint)
npm run typecheck# tsc --noEmit
```

TypeScript source lives in [`src/`](src); the published bundles in `dist/` are
generated by Rollup (`@rollup/plugin-typescript` for JS, `rollup-plugin-dts` for
the single bundled declaration file). The loader stylesheet
([`src/styles.scss`](src/styles.scss)) is compiled and its images inlined as
base64 at build time, so the overlay ships as a single self‑contained asset.

## License

[MIT](LICENSE) © CreditHub. BPQL and BIPBOP are products of
[BIPBOP](https://www.bipbop.com.br); see [api.bipbop.com.br](https://api.bipbop.com.br)
for the full API catalog and Portuguese documentation.
