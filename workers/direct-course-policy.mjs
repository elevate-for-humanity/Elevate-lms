/** A finite operator-directed pass. This module never requeues or rewinds. */
export async function runDirectLessonPass({steps, reusable, fingerprint, attempted, execute, validate, save, reject}) {
  const decisions=[];
  for (const step of steps) {
    if (await reusable(step)) { decisions.push({step,action:'reused'}); continue; }
    const key=await fingerprint(step);
    if (await attempted(step,key)) return {complete:false,blockedAt:step,reason:'unchanged-failure',decisions};
    try {
      const result=await execute(step);
      await validate(step,result);
      await save(step,result,key);
      decisions.push({step,action:'completed'});
    } catch (error) {
      await reject(step,key,error);
      return {complete:false,blockedAt:step,reason:'component-failed',decisions};
    }
  }
  return {complete:true,decisions};
}

export function directCourseComplete({learnerLessonIds, acceptedLessonIds, manifestLessonIds}) {
  const learners=new Set(learnerLessonIds),accepted=new Set(acceptedLessonIds),manifest=new Set(manifestLessonIds);
  return learners.size>0 && learners.size===learnerLessonIds.length && manifest.size===learners.size &&
    [...learners].every(id=>manifest.has(id)&&accepted.has(id));
}
