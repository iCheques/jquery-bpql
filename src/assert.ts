import jquery from 'jquery';

/** Anything the parsers accept: a BPQL XML document or markup. */
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

/**
 * Inspect a BPQL XML response and return its `<exception>` as a plain object,
 * or `null` when the request succeeded.
 */
export function exception(doc: BPQLSource): BPQLException | null {
  const node = jquery(doc as Document).find('BPQL > header > exception');
  if (!node.length) {
    return null;
  }
  return {
    source: node.attr('source'),
    message: node.text(),
    code: parseInt(node.attr('code') ?? '', 10),
    push: node.attr('push') === 'true',
    document: doc,
  };
}

/**
 * Returns `true` when `doc` carries a BPQL exception, invoking `callback` with
 * the unpacked fields. Mirrors the historical `$.bipbopAssert` signature.
 */
export function assert(doc: BPQLSource, callback?: BPQLExceptionCallback): boolean {
  const ex = exception(doc);
  if (!ex) {
    return false;
  }
  if (typeof callback === 'function') {
    callback(ex.source, ex.message, ex.code, ex.push, ex.document);
  }
  return true;
}
