/** One durable job, bounded lesson work, and a finite failed-lesson repair pass.
 * An unresolved dependency must not starve the other lessons or other courses. */
export function nextCourseWork(payload: any, result: any, maximumRepairs = 3) {
  const retries: string[] = [...(payload.repairCompetencyIds ?? [])];
  const counts = { ...(payload.lessonRepairCounts ?? {}) };
  const exhausted: string[] = [...(payload.unresolvedCompetencyIds ?? [])];
  const competencyId = result.lessons[0]?.competencyId;
  if (payload.repairCompetencyId) {
    const index = retries.indexOf(payload.repairCompetencyId);
    if (index >= 0) retries.splice(index, 1);
  }
  if (!result.completed && competencyId) {
    counts[competencyId] = (counts[competencyId] ?? 0) + 1;
    if (counts[competencyId] < maximumRepairs) {
      if (!retries.includes(competencyId)) retries.push(competencyId);
    } else if (!exhausted.includes(competencyId)) exhausted.push(competencyId);
  }
  const next = { ...payload, lessonRepairCounts: counts, repairCompetencyIds: retries,
    unresolvedCompetencyIds: exhausted, repairCompetencyId: undefined };
  if (!payload.repairCompetencyId && result.hasRemaining)
    return { continue: true, payload: { ...next, nextCompetencyIndex: result.nextIndex } };
  if (retries.length) return { continue: true, payload: { ...next, repairCompetencyId: retries[0] } };
  return { continue: false, payload: next, unresolved: exhausted };
}
