import { isDurableExternalBlocker } from '../core/repair-router';
/** A failed lesson never advances the course cursor. Retries resume the same
 * checkpoint; an exhausted or external blocker pauses only this course. */
export function nextCourseWork(payload: any, result: any, maximumRepairs = 3) {
  const counts = { ...(payload.lessonRepairCounts ?? {}) };
  const competencyId = result.lessons[0]?.competencyId;
  const index = Number.isInteger(payload.nextCompetencyIndex) ? payload.nextCompetencyIndex : 0;
  const next = { ...payload, nextCompetencyIndex:index, lessonRepairCounts:counts,
    repairCompetencyIds:[], repairCompetencyId:undefined, unresolvedCompetencyIds:[] as string[] };
  if (!competencyId) return {continue:false,payload:next,unresolved:['ULTIMATE_LESSON_RESULT_REQUIRED']};
  if (!result.completed) {
    const external = result.findings?.some(isDurableExternalBlocker);
    if (!external) counts[competencyId]=(counts[competencyId]??0)+1;
    if (external || counts[competencyId]>=maximumRepairs) {
      next.unresolvedCompetencyIds=[competencyId];
      return {continue:false,payload:next,unresolved:[competencyId]};
    }
    return {continue:true,payload:next};
  }
  delete counts[competencyId];
  if (result.hasRemaining) return {continue:true,payload:{...next,nextCompetencyIndex:result.nextIndex}};
  return {continue:false,payload:next,unresolved:[]};
}
