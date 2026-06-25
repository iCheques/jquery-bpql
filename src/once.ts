/**
 * Wrap `fn` so it runs at most once. Subsequent calls are no-ops and return the
 * value produced by the first invocation.
 */
export default function once<T extends (...args: never[]) => unknown>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;
  return function onceWrapper(this: unknown, ...args: never[]): ReturnType<T> {
    if (!called) {
      called = true;
      result = fn.apply(this, args) as ReturnType<T>;
    }
    return result;
  } as T;
}
