import { COURSE_PRODUCTION_POLICY_VERSION } from '../core/production-policy.mjs';
// Scope the owner's continuous production request to this course. Other
// courses retain their existing scheduling and fairness policy.
const COURSE = 'a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
// Existing Google tasks allow three hours. Stop starting new lessons after
// ninety minutes, leaving room to finish the current lesson safely.
export function continuousCourseLease(courseId, payload, elapsedMs, profile) {
  return (courseId === COURSE || profile?.productionPolicyVersion === COURSE_PRODUCTION_POLICY_VERSION) && Number.isFinite(elapsedMs) && elapsedMs >= 0 &&
    elapsedMs < 90 * 60_000 && !payload?.ownerPreview && !payload?.acceptance &&
    !payload?.competencyId && !payload?.lessonBuildId;
}

export async function checkpointContinuousLesson({db,jobId,workerId,generation,payload}) {
  // Keep status, lease owner, expiry, generation and retry history intact.
  // A concurrent media wakeup must go through its existing atomic consumer.
  const {data,error} = await db.from('ultimate_build_jobs').update({
    payload, last_error:null, updated_at:new Date().toISOString(),
  }).eq('id',jobId).eq('lease_owner',workerId)
    .eq('execution_generation',generation).eq('status','running')
    .gt('lease_expires_at',new Date().toISOString())
    .is('pending_dependency_resume',null).select('id');
  if (error) throw error;
  // The caller uses the fenced yield path on a pending request or lost lease;
  // it must never start another lesson after an unacknowledged checkpoint.
  return data?.length === 1;
}
