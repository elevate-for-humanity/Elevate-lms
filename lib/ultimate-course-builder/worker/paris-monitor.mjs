/** PARIS supervises the canonical queue. It never renders in the Admin request,
 * overrides a live lease, purchases evidence, or declares a course released. */
export const COURSE_AI_ROLES = {
  PARIS: 'Monitor, coordinate recovery, and report verified worker state',
  ELLIE: 'Instruction and the complete lesson learning sequence',
  LIZZY: 'Worker operations, checkpoint continuation, and media production',
  ZORA: 'Independent quality and credential release checks',
};

export function inspectCourseAutopilot(job, build, now = Date.now()) {
  if (!job?.monitor?.enabled) return {state:'disabled', action:'none'};
  if (build?.status === 'published')
    return {state:'published',action:'none',reason:'This revision is published'};
  if (build?.status === 'archived')
    return {state:'archived',action:'none',reason:'This revision is archived'};
  if (build?.ownerPaused === true || build?.profile?.ownerPaused === true)
    return {state:'paused',action:'none',reason:'A saved build pause flag is set. Its origin is not established by this flag. Use Resume to continue saved work.'};
  if (job.status === 'running') {
    const age = now - Date.parse(job.heartbeat_at ?? '');
    const fresh = Number.isFinite(age) && age >= 0 && age < 90000;
    const leased = Date.parse(job.lease_expires_at ?? '') > now;
    return fresh && leased ? {state:'running',action:'observe'}
      : leased ? {state:'heartbeat_stale',action:'wait_for_lease',reason:'Existing worker still owns its lease'}
      : job.attempts < job.max_attempts ? {state:'recovering',action:'dispatch',reason:'Expired lease; atomic claim will recover saved progress'}
      : {state:'attention_required',action:'none',reason:'Worker retry limit reached'};
  }
  // A failed job may only say EXTERNAL_ASSET_REQUIRED while its durable storage
  // finding lives on the build or lesson. Never requeue that failed render.
  const storageFinding = !job.payload?.autopilot && Array.isArray(build?.findings) && build.findings.some(f =>
    /COURSE_OBJECT_STORAGE_UPLOAD_FAILED|COURSE_OBJECT_STORAGE_DELIVERY_NOT_CONFIGURED|storage cap exceeded/i.test(String(f?.message ?? '')));
  if (storageFinding && job.status !== 'completed')
    return {state:'storage_blocked',action:'none',reason:'Course-object upload blocked; verify writable storage and readback before dispatch'};
  // Infrastructure quota is not a transient rendering error. Do not burn a
  // paid or bounded retry until a separate verified storage preflight clears it.
  if (/storage cap exceeded|COURSE_OBJECT_STORAGE_UPLOAD_FAILED|COURSE_OBJECT_STORAGE_DELIVERY_NOT_CONFIGURED/i.test(job.last_error ?? ''))
    return {state:'storage_blocked',action:'none',reason:'Storage upload failed; verify quota and successful upload/readback before retry'};
  if (job.status === 'queued' && job.available_at === 'infinity')
    return {state:job.payload?.autopilot?'prerequisite_wait':'parallel_pool_active',action:'observe',reason:job.payload?.autopilot?'Waiting for this lesson’s prior role':'Lesson teams own the work; the coordinator waits for verified publications'};
  if (job.status === 'queued') return job.attempts < job.max_attempts
    ? {state:'awaiting_assignment',action:'dispatch',reason:'Waiting for a fresh worker heartbeat'}
    : {state:'attention_required',action:'none',reason:'Worker retry limit reached'};
  if (job.status === 'completed') return job.last_error
    ? {state:'checkpoint_complete_with_prior_error',action:'none',reason:'Completed worker retains historical failure evidence; inspect current lesson acceptance before publication, do not retry this job'}
    : {state:build?.status === 'published'?'published':'checkpoint_complete',action:'none'};
  // Retry only transient runtime faults. Missing sources, permissions, licensing,
  // exhausted lesson repairs and owner review require evidence or staff action.
  const transient = /ULTIMATE_PROGRESS_STALLED|timeout|timed out|ECONNRESET|fetch failed|HTTP (429|5\d\d)/i.test(job.last_error ?? '');
  const external = /OWNER_|AUTHORIZ|LICENSE|SOURCE|DEPENDENCIES|403|401/i.test(job.last_error ?? '');
  if (transient && !external && job.attempts < job.max_attempts && (job.monitor.recoveries ?? 0) < 3)
    return {state:'recovering',action:'requeue',reason:'Retryable runtime failure; preserve lesson cursor and checkpoints'};
  return {state:'attention_required',action:'none',reason:job.last_error || 'Repair needs independent review'};
}
