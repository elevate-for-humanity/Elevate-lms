/**
 * Cosmetology Apprenticeship — Canonical Pricing Constants
 *
 * POLICY: Tuition is fixed at $4,980. Self-pay deposits must respect the same
 * published minimum as the program_pricing table. Server checkout remains the
 * authoritative enforcement point.
 */

export const COSMETOLOGY_PROGRAM_ID = '0661bc6d-c748-4655-b11b-6d418a4ace4a';
export const COSMETOLOGY_COURSE_ID = '9ca9fb50-7119-46ea-ab81-9b0193c29c31';

export const TUITION_CENTS = 498000;
export const TUITION_DOLLARS = 4980;

export const PAYMENT_TERM_WEEKS = 29;
export const TOTAL_HOURS_REQUIRED = 1500;

export const MIN_SETUP_FEE_CENTS = 60000; // $600 canonical minimum
export const MAX_SETUP_FEE_CENTS = TUITION_CENTS;

export function clampSetupFeeCents(inputDollars: number): number {
  const cents = Math.round(inputDollars * 100);
  return Math.min(TUITION_CENTS, Math.max(MIN_SETUP_FEE_CENTS, cents));
}

export function weeklyPaymentCents(downPaymentDollars: number): number {
  const downCents = Math.round(
    Math.min(TUITION_CENTS, Math.max(MIN_SETUP_FEE_CENTS, downPaymentDollars * 100)),
  );
  const remaining = Math.max(0, TUITION_CENTS - downCents);
  if (remaining === 0) return 0;
  return Math.ceil(remaining / PAYMENT_TERM_WEEKS);
}
