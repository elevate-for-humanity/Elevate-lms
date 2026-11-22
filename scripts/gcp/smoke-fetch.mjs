import { get } from 'node:http';
import { text } from 'node:stream/consumers';

// Built-in fetch can replace a supplied Host header with the socket authority.
// Send tenant and internal-host probes directly to the local published port.
function fetchLoopbackWithHost(url, { headers, signal }) {
  const target = new URL(url);
  if (target.protocol !== 'http:' || target.hostname !== '127.0.0.1') {
    throw new Error('Smoke Host header probes require an HTTP loopback destination');
  }
  return new Promise((resolve, reject) => {
    const request = get(target, { headers, signal, agent: false }, response => {
      resolve({
        status: response.statusCode,
        text: () => text(response),
        json: async () => JSON.parse(await text(response)),
      });
    });
    request.once('error', reject);
  });
}

/** A referenced deadline bounds smoke HTTP headers and body reads.
 * AbortSignal.timeout() has an unref'ed timer: a pending top-level fetch
 * otherwise lets Node exit with code 13 before the intended deadline.
 */
export async function fetchSmoke(url, options = {}, timeoutMs = 10000, responseType = 'json', fetchImpl) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw new RangeError('Smoke timeout must be 1..120000 ms');
  if (!['json', 'text'].includes(responseType)) throw new TypeError('Unsupported smoke response type');
  const path = new URL(url).pathname;
  const request = fetchImpl ?? (options.headers?.host ? fetchLoopbackWithHost : globalThis.fetch);
  const controller = new AbortController();
  let deadline;
  const timeout = new Promise((_, reject) => {
    deadline = setTimeout(() => {
      controller.abort();
      reject(new Error(`Smoke HTTP response for ${path} timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      (async () => {
        const response = await request(url, {...options,signal:controller.signal});
        return {status:response.status,body:await response[responseType]()};
      })(),
      timeout,
    ]);
  } finally {
    clearTimeout(deadline);
  }
}
