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
  const rows = data ?? [];
  if (rows.some(row =>
    (row.user_id === userId || row.student_id === userId) && isApprovedPaidEnrollment(row)
  )) return true;
  // Direct (non-program) course enrollment: a learner enrolled only through
  // a course_enrollments row — e.g. verified paid store fulfillment, which
  // creates ONLY that row — has no program_enrollments row, so the program
  // gate above can never admit them, even though the workspace lists their
  // courses (loadLearnerCourseIds counts course_enrollments). The LMS layout
  // then bounces them to /lms/access-pending and they cannot click into
  // any course. Admit them here. If the learner has ANY program_enrollments
  // row, the program gate governs: admitting on the mirrored
  // course_enrollments rows the sync trigger creates for active program
  // enrollments would bypass the approved-paid check for unpaid students.
  if (rows.length > 0) return false;
  const { data: direct, error: directError } = await db.from('course_enrollments')
    .select('id,status,revoked_at')
    .eq('student_id', userId)
    .is('revoked_at', null)
    .in('status', ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'])
    .limit(1);
  if (directError) throw new Error('LEARNER_ENROLLMENT_ACCESS_CHECK_UNAVAILABLE');
  return (direct ?? []).length > 0;
}
