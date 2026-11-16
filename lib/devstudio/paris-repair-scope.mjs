/** Operator-tunable PARIS repair limits (positive integers; empty = default).
 * Mirrored by repairSetting in paris-code-engineer.ts. */
function positiveSetting(name, fallback, env) {
  const value = Number((env ?? process.env)[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export function repairLimits(env) {
  return {
    maxChangedFiles: positiveSetting('PARIS_REPAIR_MAX_FILES', 100, env),
    providerDeadlineMs: positiveSetting('PARIS_OPENHANDS_DEADLINE_MINUTES', 90, env) * 60_000,
  };
}
