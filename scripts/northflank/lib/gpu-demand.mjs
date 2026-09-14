const ACTIVE_AUTHORIZATION_STATES = new Set([
  'approved',
  'dispatched',
  'acknowledged',
  'processing',
]);

function validDate(value) {
  const time = Date.parse(String(value || ''));
  return Number.isFinite(time) ? time : 0;
}

/**
 * Return the job IDs that still hold a recent, explicit paid-inference
 * authorization. Queue state alone is never authority to provision a GPU.
 */
export function authorizedVideoJobIds(rows, options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const ttlMs = options.ttlMs ?? 90 * 60 * 1000;
  const cutoff = nowMs - ttlMs;

  return new Set(
    rows
      .filter((row) => row.operation === 'lesson-video')
      .filter((row) => ACTIVE_AUTHORIZATION_STATES.has(String(row.status || '')))
      .filter((row) => typeof row.job_id === 'string' && row.job_id.length > 0)
      .filter((row) => {
        const authorityTime = Math.max(
          validDate(row.approved_at),
          validDate(row.dispatched_at),
          validDate(row.updated_at),
        );
        return authorityTime >= cutoff && authorityTime <= nowMs;
      })
      .map((row) => row.job_id),
  );
}

export function eligibleAuthorizedVideoJobs(jobs, authorizedIds) {
  return jobs.filter(
    (job) =>
      authorizedIds.has(job.id) &&
      (job.status === 'queued' || job.status === 'rendering') &&
      !job.dead_lettered_at,
  );
}
