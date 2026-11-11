/**
 * Bounded HTTP fetch for packaged-image smoke tests.
 *
 * AbortSignal.timeout() arms an *unref'ed* timer. When a pending request is the
 * only outstanding work, Node drains the event loop and exits with code 13
 * ("Detected unsettled top-level await") before the deadline fires, so the
 * intended startup budget is never enforced. A referenced setTimeout keeps the
 * loop alive until the request settles or the deadline aborts it.
 */
export async function fetchSmoke(url, options = {}, timeoutMs = 10000, responseType = 'json', fetchImpl = globalThis.fetch) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw new RangeError('Smoke timeout must be 1..120000 ms');
  if (responseType !== 'json' && responseType !== 'text') throw new TypeError('Unsupported smoke response type');
  const controller = new AbortController();
  let deadline;
  const expired = new Promise((_, reject) => {
    deadline = setTimeout(() => {
      controller.abort();
      reject(new Error(`Smoke HTTP response timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(url, { ...options, signal: controller.signal });
        return { status: response.status, body: await response[responseType]() };
      })(),
      expired,
    ]);
  } finally {
    clearTimeout(deadline);
  }
}
