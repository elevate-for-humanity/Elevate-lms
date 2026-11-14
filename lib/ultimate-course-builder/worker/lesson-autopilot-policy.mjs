export const LESSON_AUTOPILOT_VERSION = 'three-role-v1';
export const LESSON_AUTOPILOT_ROLES = Object.freeze({
  instruction: {title:'Instruction', startAtStep:'standards_lock', stopAfterStep:'storyboard', next:'media'},
  media: {title:'Media production', startAtStep:'visual_assignment', stopAfterStep:'lesson_film_render', next:'quality'},
  quality: {title:'Independent quality and publication', startAtStep:'finished_media_qa', next:null},
});
export function lessonAutopilotType(competencyId, role) {
  if (!String(competencyId ?? '').trim() || !LESSON_AUTOPILOT_ROLES[role])
    throw Error('ULTIMATE_AUTOPILOT_IDENTITY_REQUIRED');
  return 'lesson_autopilot:' + competencyId + ':' + role;
}
export function lessonAutopilotIdentity(job) {
  const task = job.payload?.autopilot;
  if (!task) return null;
  if (task.version !== LESSON_AUTOPILOT_VERSION || !task.poolId ||
      job.job_type !== lessonAutopilotType(task.competencyId, task.role))
    throw Error('ULTIMATE_AUTOPILOT_IDENTITY_MISMATCH');
  return {...task, ...LESSON_AUTOPILOT_ROLES[task.role]};
}

// Recovery receipts describe how a source was restored, not the immutable
// lesson instruction itself. Do not invalidate an active pool merely because
// the provenance/approval audit receipt changes. Actual instructional sources,
// competencies, presentation and publication policies remain hashed.
export function immutableAutopilotSourceProfile(profile) {
  const {ownerPaused,pauseResumeAudit,publishCompletedLessons,preservedPublishedLessonIds,
    parallelAutopilot,existingLessonSourceRecovery,...source} = profile;
  return source;
}
