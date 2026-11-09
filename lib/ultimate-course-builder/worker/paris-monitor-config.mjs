/** Operational tuning only. Never changes publication, owner, or lease authority. */
function boundedInteger(envName, fallback, minimum, maximum) {
  const raw = typeof process !== 'undefined' ? process.env?.[envName] : undefined;
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < minimum || n > maximum)
    throw new Error('PARIS_MONITOR_INVALID_CONFIG:' + envName);
  return n;
}
export const PARIS_MONITOR_HEARTBEAT_FRESH_MS = boundedInteger(
  'PARIS_MONITOR_HEARTBEAT_FRESH_MS', 90_000, 10_000, 900_000
);
export const PARIS_MONITOR_TRANSIENT_RECOVERY_LIMIT = boundedInteger(
  'PARIS_MONITOR_TRANSIENT_RECOVERY_LIMIT', 3, 0, 10
);
