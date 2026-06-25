/**
 * Wrap `fn` so it runs at most once. Subsequent calls are no-ops and return
 * the value produced by the first invocation.
 *
 * Replaces the former `one-time` dependency — jQuery 4 only targets modern
 * engines, so a three-line closure is all we need.
 *
 * @param {Function} fn Function to guard.
 * @returns {Function} Guarded function.
 */
export default function once(fn) {
  let called = false;
  let result;
  return function onceWrapper(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
