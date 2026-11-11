/** A referenced deadline bounds smoke HTTP headers and body reads.
 * AbortSignal.timeout() has an unref'ed timer: a pending top-level fetch
 * otherwise lets Node exit with code 13 before the intended deadline.
 */
export async function fetchSmoke(url, options = {}, timeoutMs = 10000, responseType = 'json', fetchImpl = globalThis.fetch) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw new RangeError('Smoke timeout must be 1..120000 ms');
  if (!['json', 'text'].includes(responseType)) throw new TypeError('Unsupported smoke response type');
  const controller = new AbortController();
  let deadline;
  const timeout = new Promise((_, reject) => {
    deadline = setTimeout(() => {
      controller.abort();
      reject(new Error('Smoke HTTP response timed out after ' + timeoutMs + ' ms'));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(url, {...options,signal:controller.signal});
        return {status:response.status,body:await response[responseType]()};
      })(),
      timeout,
    ]);
  } finally {
    clearTimeout(deadline);
  }
}
