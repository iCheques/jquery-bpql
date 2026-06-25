import jquery from 'jquery';

/**
 * @typedef {Object} BPQLException
 * @property {string|undefined} source  Database/table that raised the error.
 * @property {string} message           Human readable error message.
 * @property {number} code              Numeric error code (`NaN` when absent).
 * @property {boolean} push             Whether the error came from a PUSH stream.
 * @property {Document} document        The raw XML document, for further inspection.
 */

/**
 * Inspect a BPQL XML response and return its `<exception>` as a plain object,
 * or `null` when the request succeeded.
 *
 * Every BPQL document reports failures the same way:
 *
 * ```xml
 * <BPQL>
 *   <header>
 *     <exception code="6" source="PLACA.CONSULTA">Plate not found</exception>
 *   </header>
 * </BPQL>
 * ```
 *
 * @function exception
 * @param {Document|Element|string} doc BPQL response to inspect.
 * @returns {BPQLException|null}
 */
export function exception(doc) {
  const node = jquery(doc).find('BPQL > header > exception');
  if (!node.length) {
    return null;
  }
  return {
    source: node.attr('source'),
    message: node.text(),
    code: parseInt(node.attr('code'), 10),
    push: node.attr('push') === 'true',
    document: doc,
  };
}

/**
 * Backwards-compatible guard. Returns `true` when the document carries a BPQL
 * exception, invoking `callback` with the unpacked fields, and `false`
 * otherwise. Mirrors the historical `$.bipbopAssert` signature so existing code
 * keeps working unchanged.
 *
 * ```js
 * $.bpql.assert(doc, (source, message, code, push) => {
 *   console.error(`[${code}] ${message} (${source})`);
 * });
 * ```
 *
 * @function assert
 * @param {Document|Element|string} doc BPQL response to inspect.
 * @param {function(string=, string, number, boolean, Document): void} [callback]
 *   Called only when an exception is present.
 * @returns {boolean} `true` if an exception was found.
 */
export function assert(doc, callback) {
  const ex = exception(doc);
  if (!ex) {
    return false;
  }
  if (typeof callback === 'function') {
    callback(ex.source, ex.message, ex.code, ex.push, ex.document);
  }
  return true;
}
