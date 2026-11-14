/** Wait for an existing bounded operation without cancelling a shared cache fill.
 * @template T
 * @param {Promise<T>} operation
 * @param {AbortSignal} [signal]
 * @returns {Promise<T>}
 */
export function waitForHealthSignal(operation, signal) {
  if (!signal) return operation;
  if (signal.aborted) {
    void Promise.resolve(operation).catch(() => {});
    return Promise.reject(signal.reason);
  }
  return new Promise((resolve, reject) => {
    const aborted = () => { cleanup(); reject(signal.reason); };
    const cleanup = () => signal.removeEventListener('abort', aborted);
    signal.addEventListener('abort', aborted, { once: true });
    Promise.resolve(operation).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
  });
}

export const STUDIO_HEALTH_BUDGET_MS = 10_000;
export const STUDIO_HEALTH_PROBE_MS = 8_000;
export const STUDIO_HEALTH_SECRET_MS = 4_000;
// Leave time for a classified model result after the worst-case secret read.
export const STUDIO_HEALTH_MODEL_MS = STUDIO_HEALTH_PROBE_MS - STUDIO_HEALTH_SECRET_MS - 1_000;

/** Bound the whole probe, including credentials, identity and response parsing.
 * Unknown results never become evidence of an outage or missing credentials.
 * @template T
 * @param {(signal: AbortSignal) => Promise<T> | T} probe
 * @param {{signal?: AbortSignal, timeoutMs?: number}} [options]
 * @returns {Promise<{status: 'completed' | 'timed_out' | 'unavailable', checkedAt: string, value?: T}>}
 */
export async function runHealthProbe(probe, { signal, timeoutMs = STUDIO_HEALTH_PROBE_MS } = {}) {
  const controller = new AbortController();
  const deadline = AbortSignal.any([controller.signal, ...(signal ? [signal] : [])]);
  const timer = setTimeout(() => controller.abort(new DOMException('Health probe deadline exceeded', 'TimeoutError')), timeoutMs);
  try {
    deadline.throwIfAborted();
    const value = await waitForHealthSignal(Promise.resolve().then(() => {
      deadline.throwIfAborted();
      return probe(deadline);
    }), deadline);
    return { status: 'completed', checkedAt: new Date().toISOString(), value };
  } catch (error) {
    return { status: deadline.aborted || error?.name === 'TimeoutError' ? 'timed_out' : 'unavailable', checkedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}
