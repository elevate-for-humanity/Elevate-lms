// Shared approved-paid access grant for program enrollments.
//
// The login gate (lib/learner/approved-paid-admission.mjs) only lets a
// learner into the LMS when the program_enrollments row has, together:
//   status active, access_status active/granted, access_granted_at set,
//   payment paid (or verified state funding), and either manual approval
//   (approved_at + approved_by) or verified self-pay
//   (self_pay_application_verified_at + payment_reference).
// Historically only the marketing application flow and the manual
// grant-access route wrote the full set, so every other paid path created
// enrollments that signed in and then bounced to /lms/access-pending.
// Every paid-enrollment writer should call the helpers here instead of
// hand-rolling the fields.
//
// The helpers never fabricate payment: they use isApprovedPaidEnrollment
// as an oracle, so a row with no verified payment, no payment reference,
// a deposit-only payment, an agency-pending row, or a revoked/cancelled/
// suspended/refunded row simply does not get access fields. Callers pass
// the row as it will be AFTER their own update (e.g. with status
// 'active'), and the helper returns the minimal patch that would make
// that row pass the gate, or null when it cannot pass.

import { isApprovedPaidEnrollment } from '../learner/approved-paid-admission.mjs';

// Columns the gate reads, used by grantPaidEnrollmentAccess when it
// re-reads a row. Keep in sync with lib/learner/approved-paid-admission.mjs.
export const GATE_ROW_COLUMNS =
  'id,status,payment_status,payment_reference,funding_source,funding_verified,eligibility_status,self_pay_application_verified_at,approved_at,approved_by,access_granted_at,access_status,revoked_at,cancelled_at,suspended_at,refunded_at';

/**
 * Minimal access-field patch that makes a program_enrollments row pass the
 * approved-paid gate, or null when the row cannot pass it.
 *
 * @param {Record<string, unknown>} row - the row as it will be after the
 *   caller's own update (status already 'active', payment already 'paid').
 * @param {string} [now] - ISO timestamp to stamp (defaults to now).
 * @returns {Record<string, string> | null} e.g.
 *   { access_status: 'active', access_granted_at, self_pay_application_verified_at }
 *   for a verified self-pay row, or the minimal
 *   { access_status: 'active', access_granted_at } for an already-approved row.
 */
export function paidAccessGrantFields(row, now = new Date().toISOString()) {
  if (!row) return null;
  if (row.revoked_at || row.cancelled_at || row.suspended_at || row.refunded_at) return null;
  // Minimal patch first: enough for a manually approved row (approved_at +
  // approved_by) or a verified state-funded row.
  const minimal = {
    access_status: 'active',
    access_granted_at: row.access_granted_at ?? now,
  };
  if (isApprovedPaidEnrollment({ ...row, ...minimal })) return minimal;
  // Full patch: stamp self-pay verification too. Only a verified self-pay
  // row (paid + payment_reference) can pass this way; anything else
  // (deposit-paid, unpaid, agency-pending, state-funded without approval)
  // still fails the oracle and gets no access fields.
  const full = {
    ...minimal,
    self_pay_application_verified_at: row.self_pay_application_verified_at ?? now,
  };
  if (isApprovedPaidEnrollment({ ...row, ...full })) return full;
  return null;
}

/**
 * Read one program_enrollments row and stamp the access fields when the row
 * would then pass the approved-paid gate. Idempotent: a row that already
 * passes is re-stamped with the same values. Returns true when access was
 * granted (or was already granted), false when the row does not exist or
 * cannot pass the gate. Throws on a database error so callers can retry.
 *
 * @param {any} db - Supabase client (admin client in server code).
 * @param {string} enrollmentId - program_enrollments.id.
 */
export async function grantPaidEnrollmentAccess(db, enrollmentId) {
  if (!enrollmentId) return false;
  const { data: row, error } = await db
    .from('program_enrollments')
    .select(GATE_ROW_COLUMNS)
    .eq('id', enrollmentId)
    .maybeSingle();
  if (error) throw new Error(`PAID_ACCESS_LOOKUP_FAILED: ${error.message}`);
  if (!row) return false;
  const now = new Date().toISOString();
  const patch = paidAccessGrantFields(row, now);
  if (!patch) return false;
  const { error: updateError } = await db
    .from('program_enrollments')
    .update({ ...patch, updated_at: now })
    .eq('id', enrollmentId);
  if (updateError) throw new Error(`PAID_ACCESS_GRANT_FAILED: ${updateError.message}`);
  return true;
}
