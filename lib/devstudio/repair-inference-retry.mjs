const TRANSIENT = /HTTP (?:502|503|504)|ECONNRESET|socket hang up|fetch failed|network error|aborted due to timeout|timed out|temporarily unavailable|overloaded|rate limit|HTTP 429/i;
// A timed-out or cancelled request may still be executing on the single-slot
// owned CPU worker. Replaying it is unsafe even when local time remains.
const TERMINAL_INFERENCE = /HTTP (?:408|504)\b|AbortError|TimeoutError|aborted|timed out|timeout|deadline exceeded/i;
const OPEN_CIRCUIT = /Circuit "ai:[a-z0-9_-]+" is open\. Retry after (\d+(?:\.\d+)?)s\./i;

const OWNED_MODEL_STATUS = /\bElevate LLM worker (?:HTTP )?(\d{3}):/i;
const RETRYABLE_OWNED_MODEL_STATUS = new Set(['429', '502', '503']);

function inferenceFailure(reason, cause) {
  return Object.assign(Error('PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE', { cause }), { reason });
}

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
    if (remaining <= 0) throw inferenceFailure('deadline_exhausted');
    try {
      // Never reuse a signal consumed by a previous timed-out request.
      return await infer(createSignal(remaining));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.match(OWNED_MODEL_STATUS)?.[1];
      if (status === '408' || status === '504' || TERMINAL_INFERENCE.test(message) || error?.name === 'AbortError' || error?.name === 'TimeoutError') {
        throw inferenceFailure('upstream_request_unconfirmed', error);
      }
      const circuit = message.match(OPEN_CIRCUIT);
      const transient = status ? RETRYABLE_OWNED_MODEL_STATUS.has(status) : TRANSIENT.test(message);
      if (!circuit && !transient) throw error;
      // Respect the provider's existing circuit; do not reset or bypass it.
      const delay = circuit ? Math.max(1000, Math.ceil(Number(circuit[1]) * 1000)) : 5000;
      if (deadline - now() <= delay + 1000)
        throw inferenceFailure(circuit ? 'provider_cooldown_exceeds_deadline' : 'deadline_exhausted', error);
      if (attempt >= 3) throw inferenceFailure('transient_retries_exhausted', error);
      onRetry(attempt + 1, delay);
      await sleep(delay);
    }
  }
}
