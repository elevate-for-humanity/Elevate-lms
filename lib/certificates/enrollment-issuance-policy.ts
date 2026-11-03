export const ENROLLMENT_CERTIFICATE_VERSION = 'v2';
export const enrollmentCertificateCampaign = (id: string) => `enrollment-certificate:${ENROLLMENT_CERTIFICATE_VERSION}:${id}`;

export type EnrollmentIssueSource = {
  id: string; user_id: string | null; student_id: string | null;
  status: string | null; program_slug: string | null; payment_status: string | null;
  amount_paid_cents: number | null; amount_paid: number | string | null;
  revoked_at: string | null; refunded_at: string | null;
};

/** A deposit is sufficient; pending, failed, refunded and test payments are not. */
export function eligibleForEnrollmentCertificate(e: EnrollmentIssueSource): boolean {
  if (!e.program_slug || !(e.user_id || e.student_id) || e.revoked_at || e.refunded_at) return false;
  if (!['active', 'enrolled', 'confirmed', 'completed'].includes(e.status || '')) return false;
  if (['pending', 'failed', 'refunded', 'void', 'voided', 'cancelled', 'qa_test'].includes(e.payment_status || '')) return false;
  return Number(e.amount_paid_cents) > 0 || Number(e.amount_paid) > 0 ||
    ['paid', 'paid_in_full', 'deposit_paid', 'partially_paid'].includes(e.payment_status || '');
}
