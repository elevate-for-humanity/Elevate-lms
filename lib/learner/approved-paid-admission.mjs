/** Admission authority for protected learner training surfaces. */
const ACTIVE = new Set(['active', 'enrolled', 'in_progress', 'confirmed']);
const PAID = new Set(['paid', 'paid_in_full']);
const ACCESS = new Set(['active', 'granted']);
const norm = (value) => String(value ?? '').trim().toLowerCase();

export function isStateFunded(source) {
  return ['wioa', 'wrg', 'workone', 'jri'].includes(norm(source));
}

export function hasVerifiedStateFunding(row) {
  return isStateFunded(row?.funding_source) &&
    row.funding_verified === true && norm(row.eligibility_status) === 'eligible';
}

export function hasAdmissionPaymentOrFunding(row) {
  return isStateFunded(row?.funding_source)
    ? hasVerifiedStateFunding(row)
    : PAID.has(norm(row?.payment_status));
}

export function isApprovedPaidEnrollment(row) {
  if (!row || !ACTIVE.has(norm(row.status)) || !ACCESS.has(norm(row.access_status)) ||
      !row.access_granted_at || row.revoked_at || row.cancelled_at || row.suspended_at || row.refunded_at) return false;
  const manuallyApproved = row.approved_at && row.approved_by;
  const verifiedSelfPay = norm(row.funding_source) === 'self_pay' &&
    row.self_pay_application_verified_at && row.payment_reference;
  return Boolean(hasAdmissionPaymentOrFunding(row) && (manuallyApproved || verifiedSelfPay));
}

export async function hasApprovedPaidLearnerEnrollment(db, userId) {
  if (!userId) return false;
  const { data, error } = await db.from('program_enrollments')
    .select('user_id,student_id,status,payment_status,payment_reference,funding_source,funding_verified,eligibility_status,self_pay_application_verified_at,approved_at,approved_by,access_granted_at,access_status,revoked_at,cancelled_at,suspended_at,refunded_at')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .limit(200);
  if (error) throw new Error('LEARNER_ENROLLMENT_ACCESS_CHECK_UNAVAILABLE');
  return (data ?? []).some(row =>
    (row.user_id === userId || row.student_id === userId) && isApprovedPaidEnrollment(row)
  );
}
