import jquery from 'jquery';
import config from './config';
import FREE_KEY from './free-key';
import { attachLoader } from './loader';

/** Query used when `$.bpql()` is called with no arguments — a cheap echo/ping. */
const DEFAULT_QUERY = "SELECT FROM 'INFO'.'INFO'";

/** Detect a JSONP request so we can ask the server for the JSONP adapter. */
function usesJsonp(dataType) {
  return typeof dataType === 'string' && /\bjsonp\b/i.test(dataType);
}

/**
 * Run a BPQL query against the BIPBOP WebService.
 *
 * BPQL is BIPBOP's SQL-flavored query language. A statement targets a database
 * and a table — `SELECT FROM 'DATABASE'.'TABLE'` — and any named parameters are
 * passed through `options.parameters`:
 *
 * ```js
 * $.bpql("SELECT FROM 'PLACA'.'CONSULTA'", 'YOUR_API_KEY', {
 *   parameters: { placa: 'ABC1234' },
 *   success(doc) {
 *     console.log($(doc).find('BPQL > body marca').text());
 *   },
 * });
 * ```
 *
 * The API key is optional and may also be supplied as `options.apiKey`. You can
 * even omit it entirely and call `$.bpql(query, options)` — the public demo key
 * is used as a fallback.
 *
 * `options` is a superset of
 * [jQuery.ajax settings](https://api.jquery.com/jquery.ajax/), so `success`,
 * `error`, `dataType`, `method`, timeouts and the rest behave exactly as you'd
 * expect. Two extra keys are understood:
 *
 * - `parameters` — BPQL named parameters merged into the request.
 * - `apiKey` — alternative place to provide the key.
 *
 * @function bpql
 * @param {string} [query=DEFAULT_QUERY] BPQL statement to execute.
 * @param {string|Object} [apiKey] API key, or the options object.
 * @param {Object} [options] jQuery.ajax settings plus `parameters`/`apiKey`.
 * @returns {JQuery.jqXHR} The jqXHR promise returned by `jQuery.ajax`.
 */
export default function bpql(query = DEFAULT_QUERY, apiKey, options) {
  let opts;
  let key;

  // Support the shorthand `$.bpql(query, options)`.
  if (apiKey !== null && typeof apiKey === 'object') {
    opts = apiKey;
    key = opts.apiKey;
  } else {
    opts = options || {};
    key = apiKey != null ? apiKey : opts.apiKey;
  }
  if (key == null) {
    key = FREE_KEY;
  }

  const { parameters, apiKey: ignoredKey, ...ajaxOptions } = opts;
  const adapter = usesJsonp(ajaxOptions.dataType) ? "USING 'JSONP' " : '';

  const data = jquery.extend(
    { q: adapter + query, apiKey: key },
    parameters,
    ajaxOptions.data,
  );

  const settings = jquery.extend(
    { method: 'GET', dataType: 'xml', url: config.webserviceAddress },
    ajaxOptions,
    { data },
  );

  return jquery.ajax(attachLoader(settings));
}
