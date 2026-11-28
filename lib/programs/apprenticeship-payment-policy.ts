/**
 * Apprenticeship tuition is normally self-pay. Owner rule (Elizabeth,
 * 2026-11-28): a deposit may be asked ONLY of self-paying applicants. An
 * apprentice who declares a workforce-funding path (WIOA / WorkOne / WRG /
 * agency funding / employer sponsorship) is never rejected or rewritten to
 * self-pay at this boundary — the application is accepted and routed to
 * Admissions review, where the funding must be documented and verified
 * before enrollment activates.
 */
export function isSelfPayApprenticeship(program: string | null | undefined): boolean {
  return /apprentice/i.test(program || '');
}

export function isSelfPayPaymentMethod(value: string | null | undefined): boolean {
  const method = (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return ['self_pay', 'selfpay', 'payment_plan', 'bnpl'].includes(method);
}

export function isWorkforceFundingMethod(value: string | null | undefined): boolean {
  const method = (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return ['wioa', 'wrg', 'workone', 'work_one', 'jri', 'fssa', 'grant', 'employer', 'employer_sponsored', 'agency_funding'].includes(method);
}

export function apprenticeshipPaymentError(program: string | null | undefined, method: string | null | undefined): string | null {
  if (!isSelfPayApprenticeship(program) || !method?.trim()) return null;
  if (isSelfPayPaymentMethod(method) || isWorkforceFundingMethod(method)) return null;
  return 'Choose self-pay or a workforce funding path (WIOA, WorkOne, WRG, or employer sponsorship). Funded applications are reviewed by Admissions before enrollment.';
}
