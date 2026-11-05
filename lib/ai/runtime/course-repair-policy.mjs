/** Deterministic contracts shared by PARIS discovery and completion checks. */
export function isRepairableCourseFailure(job) {
  if (job?.status !== 'failed' || !job.monitor?.enabled || /owner|pause/i.test(job.monitor?.reason ?? '')) return false;
  const error = String(job.last_error ?? '');
  // A missing or unverified scene entitlement/relevance is not a source-code defect.\n  // It requires course-scoped, ready licensed media evidence before retrying.\n  if (/OWNER_PAUSED|AUTHORIZ|LICENSE_APPROVAL_REQUIRED|MEDIA_LICENSE_REQUIRED|ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED|HTTP_(?:401|403)|HTTP (?:401|403)/i.test(error)) return false;
  return /ULTIMATE_INTERNAL_REPAIR_REQUIRED|LEARNER_RUNTHROUGH_CHECK_FAILED|quality|frozen|timeline|replay|PICTURE_CUE_NOT_ALIGNED_TO_SPEECH|PREMIUM_TEACHING_CUE_NOT_ALIGNED|TEACHING_PICTURE_|TEACHING_PHOTO_REPLACEMENT_REQUIRED|INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED|NARRATION_DUPLICATION|MEDIA_SCENE_NARRATION_MISMATCH|CAPTION_SYNC_FAILED|AUDIO_SYNC_FAILED|REPAIR_PRODUCER_UNCHANGED|NARRATION_ANALYSIS_UNTRUSTED_AUDIO_URL/i.test(error);
}

/** A new worker, successful dispatch, or preview is not production acceptance. */
export function courseRepairOutcome({ repairId, releaseSha, sourceJobId, job, build, lessonAcceptance }) {
  const resumedOriginal = job?.id === sourceJobId &&
    Number.isSafeInteger(job.payload?.codeRepairSourceGeneration) &&
    job.execution_generation > job.payload.codeRepairSourceGeneration;
  if (!job || (job.id === sourceJobId && !resumedOriginal) || job.payload?.codeRepairId !== repairId ||
      job.payload?.codeRepairSha !== releaseSha || job.build_id !== build?.id)
    return { state: 'pending', reason: 'Waiting for the correlated repair execution.' };
  if (job.status === 'failed') return { state: 'failed', reason: 'The repaired course execution failed; saved work is preserved.' };
  if (job.status === 'completed' && job.payload?.autopilot &&
      lessonAcceptance?.published === true && lessonAcceptance?.learnerPassed === true)
    return {state:'passed',reason:'The original lesson job completed; canonical video publication and learner acceptance passed.'};
  if (job.status === 'completed' && build.status === 'published')
    return { state: 'passed', reason: 'The correlated worker completed and canonical course publication passed.' };
  return { state: 'pending', reason: 'Waiting for course quality checks and canonical publication.' };
}
