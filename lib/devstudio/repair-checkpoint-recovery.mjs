/** A new admitted attempt can replan an untouched branch. Never discard writes. */
export function untouchedPlannerNeedsFreshGeneration(repair, now = Date.now()) {
  const c = repair?.candidate?.checkpoint;
  if (repair?.status !== 'patching' || !Number.isInteger(repair.attempt_count) || repair.attempt_count < 2 ||
      repair.release_sha || repair.candidate?.kind !== 'planner-checkpoint' || !c ||
      c.writes !== 0 || !Array.isArray(c.commits) || c.commits.length ||
      !Array.isArray(c.changedFiles) || c.changedFiles.length ||
      !/^[a-f0-9]{40}$/.test(c.baseSha ?? '') || c.headSha !== c.baseSha || c.complete === true)
    return false;
  const start = Date.parse(c.startedAt ?? '');
  return c.nextTurn >= 14 || (Number.isFinite(start) && now - start >= 30 * 60_000);
}
