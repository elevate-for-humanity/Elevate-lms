/** A finite operator-directed pass. This module never requeues or rewinds. */
export function directLessonEditorialHold(contentJson) {
  return contentJson?.savedFilmSourceNeedsRevision===true;
}
export function directStepIdleDeadline(step){return step==='learner_runthrough'?3600000:600000;}

export function directCourseNeedsFinalPublication(course,lessonCount) {
  if(!Number.isInteger(lessonCount)||lessonCount<1)throw Error('DIRECT_COURSE_LESSON_COUNT_REQUIRED');
  return course?.status!=='published'||course?.is_active!==true||
    course?.generation_status!=='published'||course?.generation_progress!==100||course?.total_lessons!==lessonCount;
}

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

/** Run every snapshot of one course before the next course. An incomplete
 * course stops this pass so failures are repaired before unrelated work starts. */
export async function runDirectCourseSequence({groups,execute}) {
 const results=[];
 for(const group of groups) {
  if(!Array.isArray(group)||!group.length)throw Error('DIRECT_COURSE_GROUP_REQUIRED');
  let last;
  for(const buildId of group) {
   const result=await execute(buildId);
   if(!result||typeof result.complete!=='boolean'||!result.courseId)throw Error('DIRECT_COURSE_RESULT_REQUIRED');
   if(last&&result.courseId!==last.courseId)throw Error('DIRECT_COURSE_GROUP_MISMATCH');
   results.push(result);last=result;
  }
  if(!last.complete)throw Error('DIRECT_COURSE_INCOMPLETE:'+last.courseId);
 }
 return results;
}

/** Preserve known validation diagnostics without serializing request/config data. */
export function directFailureEvidence(error) {
 const message=typeof error?.message==='string'?error.message:'';
 const typed=message.match(/^([A-Z][A-Z0-9_]+)(?=[:\s]|$)/)?.[1];
 const result={code:typed??'DIRECT_COMPONENT_FAILED'};
 if(/^Media quality gate failed:/.test(message))result.code='MEDIA_QUALITY_GATE_FAILED';
 // These validators include the failed objective/activity or scene/cue in
 // their error text. Keep it, while rejecting arbitrary request/config data.
 const diagnostic=/^(?:Media quality gate failed:|MP4 returned HTTP|Caption alignment returned HTTP|Rendered-audio transcription is empty|Cloudflare rendered-audio transcription credentials are not configured|BLUEPRINT_[A-Z_]+:|NARRATION_DUPLICATION:|ULTIMATE_TEACHING_SEQUENCE_ORDER_REQUIRED:|INSTRUCTIONAL_QUALITY_FAILED:|GOOGLE_TEACHING_PHOTO_HTTP_\d{3}:)/;
 const messages=[];let current=error;
 // Photo preparation wraps the provider error in scene/cue context. Its
 // bounded cause chain supplies the actual provider rejection, not just 429.
 for(let depth=0;depth<4&&current;depth++,current=current.cause){
  if(typeof current.message==='string'&&diagnostic.test(current.message)&&!messages.includes(current.message))messages.push(current.message);
 }
 if(messages.length)result.detail=messages.join(' | ').replace(/https?:\/\/[^\s]+/gi,'[private-url]').replace(/(?:Bearer\s+|(?:token|key|secret|signature|authorization)\s*[=:]\s*)[^\s;,]+/gi,'[redacted]').slice(0,1200);
 return result;
}

