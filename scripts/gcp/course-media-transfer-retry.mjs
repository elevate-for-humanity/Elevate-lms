const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_CODES = new Set(['ECONNRESET','ECONNREFUSED','EPIPE','ETIMEDOUT','EAI_AGAIN','ENETUNREACH','EHOSTUNREACH','UND_ERR_SOCKET','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT']);
const RETRYABLE_NAMES = new Set(['TimeoutError','RequestTimeout','RequestTimeoutException','NetworkingError','SlowDown','ServiceUnavailable']);
export function transientCourseMediaError(error) {
  if (error?.name === 'AbortError') return false;
  const status = Number(error?.$metadata?.httpStatusCode ?? error?.statusCode ?? 0);
  if (status >= 400 && !RETRYABLE_STATUS.has(status)) return false;
  if (RETRYABLE_STATUS.has(status)) return true;
  let current = error;
  for (let depth = 0; current && depth < 4; depth++, current = current.cause)
    if (RETRYABLE_CODES.has(current.code) || RETRYABLE_NAMES.has(current.name)) return true;
  return false;
}
/** The operation must create a new stream on each attempt. Never replay a consumed body. */
export async function retryCourseMediaTransfer(operation, {
  attempts = 3,
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
  onRetry = () => {},
} = {}) {
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 3) throw Error('MEDIA_TRANSFER_RETRY_BOUND_INVALID');
  for (let attempt = 1; ; attempt++) {
    try { return await operation(attempt); }
    catch (error) {
      if (attempt >= attempts || !transientCourseMediaError(error)) throw error;
      const delayMs = 1000 * 2 ** (attempt - 1);
      onRetry({ attempt, delayMs });
      await wait(delayMs);
    }
  }
}
