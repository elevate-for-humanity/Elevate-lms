/** Only persisted dispatch/claim/lease evidence can advance execution state. */
export function courseExecutionState(job, { paused = false, now = Date.now() } = {}) {
  if (paused) return { phase: 'paused', active: false };
  if (!job) return { phase: 'not_started', active: false };
  if (job.status === 'completed') return { phase: 'completed', active: false };
  if (job.status !== 'running') return { phase: job.status === 'queued' ? (job.monitor?.lastDispatch?.accepted ? 'dispatched' : 'queued') : 'attention_required', active: false };
  const age = now - Date.parse(job.heartbeat_at ?? '');
  const leased = Boolean(job.lease_owner) && Date.parse(job.lease_expires_at ?? '') > now;
  if (!leased || !Number.isFinite(age) || age < 0 || age >= 90_000)
    return { phase: 'heartbeat_unverified', active: false, leased };
  const progress = job.payload?.progress;
  return { phase: progress ? 'processing' : 'heartbeat_verified', active: true, leased: true };
}
