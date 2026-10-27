const nonnegative = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new Error('INVALID_RESOURCE_' + name);
  return value;
};
/** Estimate only: the provider invoice remains authoritative. Reserved memory
 * time and allocated CPU time are not mislabeled as observed consumption. */
export function estimateComputeCost({wallSeconds, cpu, memoryMiB, cpuMicrosPerSecond, memoryMicrosPerGiBSecond}) {
  for (const [name, value] of Object.entries({wallSeconds, cpu, memoryMiB, cpuMicrosPerSecond, memoryMicrosPerGiBSecond})) nonnegative(value, name);
  const micros = Math.ceil(wallSeconds * (cpu * cpuMicrosPerSecond + memoryMiB / 1024 * memoryMicrosPerGiBSecond));
  if (!Number.isSafeInteger(micros)) throw new Error('COMPUTE_COST_OVERFLOW');
  return micros;
}

export function creditSettlement(reserved, actual) {
  for (const value of [reserved, actual]) if (!Number.isSafeInteger(value) || value < 0) throw new Error('INVALID_CREDITS');
  // An overrun requires reconciliation/platform coverage, never an unapproved debit.
  return {settled: Math.min(reserved, actual), refund: Math.max(0, reserved - actual),
    uncovered: Math.max(0, actual - reserved)};
}
