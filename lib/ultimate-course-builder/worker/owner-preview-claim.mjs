/** Claim only the explicitly requested preview. Never reclaim, cancel, or
 * modify another execution, including an expired lease. */
export async function claimExactOwnerPreview(db, jobId, workerId, leaseSeconds = 300) {
  const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
  if (!uuid.test(jobId ?? '') || !workerId?.trim() || !Number.isInteger(leaseSeconds) || leaseSeconds < 30 || leaseSeconds > 900)
    throw new Error('OWNER_PREVIEW_CLAIM_IDENTITY_REQUIRED');
  const {data:job,error} = await db.from('ultimate_build_jobs').select('*').eq('id',jobId).maybeSingle();
  if (error) throw error;
  if (!job || job.external_execution_id || job.status !== 'queued' || job.lease_owner || job.payload?.ownerPreview !== true ||
      !uuid.test(job.payload.lessonBuildId ?? '') || !uuid.test(job.payload.competencyId ?? '') ||
      !(job.attempts < job.max_attempts) || !(Date.parse(job.available_at) <= Date.now())) return null;
  const now = new Date();
  const {data,error:writeError} = await db.from('ultimate_build_jobs').update({
    status:'running',attempts:job.attempts+1,lease_owner:workerId,heartbeat_at:now.toISOString(),
    lease_expires_at:new Date(now.getTime()+leaseSeconds*1000).toISOString(),updated_at:now.toISOString(),
  }).eq('id',jobId).eq('status','queued').eq('attempts',job.attempts)
    .eq('execution_generation',job.execution_generation).is('lease_owner',null)
    .eq('payload',JSON.stringify(job.payload)).select('*').maybeSingle();
  if (writeError) throw writeError;
  return data ?? null;
}
