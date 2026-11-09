const TRANSIENT = /HTTP (?:502|503|504)|ECONNRESET|socket hang up|fetch failed|network error|aborted due to timeout|timed out|temporarily unavailable|overloaded|rate limit|HTTP 429/i;
const OPEN_CIRCUIT = /Circuit "ai:[a-z0-9_-]+" is open\. Retry after (\d+(?:\.\d+)?)s\./i;

/**
 * One request budget covers inference, retries and the provider cooldown.
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} infer
 * @param {{timeoutMs: number, now?: () => number, sleep?: (ms: number) => Promise<void>, createSignal?: (ms: number) => AbortSignal, onRetry?: (attempt: number, delay: number) => void}} options
 * @returns {Promise<T>}
 */
export async function retryRepairInference(infer, {
  timeoutMs, now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  createSignal = ms => AbortSignal.timeout(ms), onRetry = () => {},
}) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw Error('PARIS_INFERENCE_BUDGET_REQUIRED');
  const deadline = now() + timeoutMs;
  for (let attempt = 0; ; attempt += 1) {
    const remaining = deadline - now();
    if (remaining <= 0) throw Error('PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE');
    try {
      // Never reuse a signal consumed by a previous timed-out request.
      return await infer(createSignal(remaining));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const circuit = message.match(OPEN_CIRCUIT);
      if (!circuit && !TRANSIENT.test(message)) throw error;
      // Respect the provider's existing circuit; do not reset or bypass it.
      const delay = circuit ? Math.max(1000, Math.ceil(Number(circuit[1]) * 1000)) : 5000;
      if (attempt >= 3 || deadline - now() <= delay + 1000)
        throw Error('PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE', { cause: error });
      onRetry(attempt + 1, delay);
      await sleep(delay);
    }
  }
}
