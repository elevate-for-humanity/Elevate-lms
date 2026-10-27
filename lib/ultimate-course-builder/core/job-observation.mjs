/** Execution recency, rather than job creation, identifies the latest result. */
export function orderCourseJobs(jobs) {
  const time = job => Date.parse(job.updated_at ?? job.created_at ?? '') || 0;
  return [...jobs].sort((a, b) => time(b) - time(a));
}

export function checkpointNeedsRecheck(steps, step) {
  if (!['finished_media_qa','instructional_qa','narration_qa','learner_runthrough','selective_repair','credential_release'].includes(step)) return false;
  const rendered = steps.find(row => row.step === 'lesson_film_render');
  const checked = steps.find(row => row.step === step);
  const renderTime = Date.parse(rendered?.completed_at ?? '');
  const checkTime = Date.parse(checked?.completed_at ?? '');
  return rendered?.state === 'passed' && Number.isFinite(renderTime) &&
    (!Number.isFinite(checkTime) || checkTime < renderTime);
}
