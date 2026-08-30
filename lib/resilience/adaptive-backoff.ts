export type AdaptiveBackoffOptions = {
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio?: number;
};

/**
 * Exponential outage backoff shared by database-backed background workers.
 * A caller resets the failure count after a successful tick. Jitter prevents
 * multiple service replicas from retrying Supabase at the same instant.
 */
export function adaptiveBackoffMs(
  consecutiveFailures: number,
  options: AdaptiveBackoffOptions,
  random = Math.random,
): number {
  const failures = Math.max(1, Math.trunc(consecutiveFailures));
  const base = Math.max(1, Math.trunc(options.baseDelayMs));
  const maximum = Math.max(base, Math.trunc(options.maxDelayMs));
  const exponential = Math.min(maximum, base * (2 ** Math.min(failures - 1, 20)));
  const jitterRatio = Math.min(0.5, Math.max(0, options.jitterRatio ?? 0.2));
  const jitter = exponential * jitterRatio * random();
  return Math.min(maximum, Math.round(exponential + jitter));
}
