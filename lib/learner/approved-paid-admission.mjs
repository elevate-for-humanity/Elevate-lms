/**
 * Admission authority for protected learner training surfaces.
 * Authentication/account creation is not enrollment approval. Payment alone is
 * not approval either. Only a verified, explicitly administrator-approved,
 * active, paid program enrollment can unlock coursework.
 *
 * Do not use this gate on public applications, checkout, or admin previews.
 * Always apply course/program-specific authorization at the API/data boundary.
 */
const ACTIVE = new Set(['active', 'enrolled', 'in_progress', 'confirmed']);
const PAID = new Set(['paid', 'paid_in_full']);
const ACCESS = new Set(['active', 'granted']);
const norm = (value) => String(value ?? '').trim().toLowerCase();

export function isApprovedPaidEnrollment(row) {
  return Boolean(
    row &&
    ACTIVE.has(norm(row.status)) &&
    PAID.has(norm(row.payment_status)) &&
    row.approved_at &&
    row.approved_by &&
    row.access_granted_at &&
    ACCESS.has(norm(row.access_status)) &&
    !row.revoked_at &&
    !row.cancelled_at &&
    !row.suspended_at &&
    !row.refunded_at
  );
}

export async function hasApprovedPaidLearnerEnrollment(db, userId) {
  if (!userId) return false;
  const { data, error } = await db.from('program_enrollments')
    .select('user_id,student_id,status,payment_status,approved_at,approved_by,access_granted_at,access_status,revoked_at,cancelled_at,suspended_at,refunded_at')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .limit(200);
  if (error) throw new Error('LEARNER_ENROLLMENT_ACCESS_CHECK_UNAVAILABLE');
  return (data ?? []).some(row =>
    (row.user_id === userId || row.student_id === userId) && isApprovedPaidEnrollment(row)
  );
}
