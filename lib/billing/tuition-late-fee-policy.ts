/**
 * Prospective tuition late-fee terms. Do not assess fees against previously
 * executed agreements, funded enrollments, or third-party financing.
 * Legal and contract review required before charging real accounts.
 */
export const PROSPECTIVE_TUITION_LATE_FEE_POLICY = {
  version: '2026-10-28',
  effectiveDate: '2026-10-28',
  gracePeriodDays: 3,
  dailyLateFeeCents: 1000,
  suspensionReviewAfterDays: 7,
  oneTimeReactivationFeeCents: 2500,
  appliesTo: 'new_self_pay_internal_plan_with_signed_disclosure',
  protectedAccess: [
    'billing',
    'payments',
    'support',
    'workplace_timekeeping',
    'wages',
    'required_training_records',
  ],
} as const;

/** Calendar days late; date-only arithmetic avoids timezone/DST errors. */
export function calculateProspectiveLateFee(input: {
  dueDate: string;
  asOfDate: string;
  outstandingCents: number;
  signedPolicyVersion?: string | null;
  funded?: boolean;
  thirdPartyFinanced?: boolean;
  paidInFull?: boolean;
}) {
  const valid = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
  if (!valid(input.dueDate) || !valid(input.asOfDate))
    throw new Error('Valid YYYY-MM-DD dates required');
  const daysOverdue = Math.max(
    0,
    Math.floor(
      (Date.parse(input.asOfDate + 'T00:00:00Z') - Date.parse(input.dueDate + 'T00:00:00Z')) /
        86400000,
    ),
  );
  const eligible =
    input.signedPolicyVersion === PROSPECTIVE_TUITION_LATE_FEE_POLICY.version &&
    !input.funded &&
    !input.thirdPartyFinanced &&
    !input.paidInFull &&
    input.outstandingCents > 0;
  const chargeableDays = eligible
    ? Math.max(0, daysOverdue - PROSPECTIVE_TUITION_LATE_FEE_POLICY.gracePeriodDays)
    : 0;
  return {
    daysOverdue,
    chargeableDays,
    lateFeeCents: chargeableDays * PROSPECTIVE_TUITION_LATE_FEE_POLICY.dailyLateFeeCents,
    reviewInstructionalAccess:
      eligible && daysOverdue >= PROSPECTIVE_TUITION_LATE_FEE_POLICY.suspensionReviewAfterDays,
    proposedReactivationFeeCents:
      eligible && daysOverdue >= PROSPECTIVE_TUITION_LATE_FEE_POLICY.suspensionReviewAfterDays
        ? PROSPECTIVE_TUITION_LATE_FEE_POLICY.oneTimeReactivationFeeCents
        : 0,
  };
}
