/**
 * Barber Apprenticeship — Absolute Pricing Authority
 *
 * POLICY (immutable):
 *   Tuition is fixed at $4,980. Transfer hours NEVER affect price.
 *   Only custom_setup_fee is user-selectable, and it is server-clamped here.
 *   No other file may define or derive barber tuition amounts.
 *
 * If this policy changes, update:
 *   - All four Stripe session creation routes in app/api/barber/checkout/
 *   - Email templates in app/api/barber/webhook/route.ts
 *   - Cron email in app/api/cron/barber-billing/route.ts
 *   - lib/barber/suspension.ts (policy comment)
 */

/** Full program tuition in cents. Never derived from hours, ratios, or client input. */
export const TUITION_CENTS = 498000; // $4,980

/** Full program tuition in dollars. */
export const TUITION_DOLLARS = 4980;

/** Minimum down payment in cents. */
export const MIN_SETUP_FEE_CENTS = 60000; // $600

/** Payment term — fixed at 29 weekly invoices. */
export const PAYMENT_TERM_WEEKS = 29;

/** Total program hours required. Used for duration display only — not pricing. */
export const TOTAL_HOURS_REQUIRED = 2000;

/**
 * Clamp a user-provided setup fee to the allowed range.
 * This is the ONLY place where a user-influenced value touches pricing.
 * Input is in dollars. Returns cents.
 */
export function clampSetupFeeCents(inputDollars: number): number {
  const cents = Math.round(inputDollars * 100);
  if (isNaN(cents)) return MIN_SETUP_FEE_CENTS;
  return Math.min(TUITION_CENTS, Math.max(MIN_SETUP_FEE_CENTS, cents));
}

/**
 * Compute weekly payment in cents given a down payment in dollars.
 * Transfer hours do not affect this calculation.
 */
export function weeklyPaymentCents(downPaymentDollars: number): number {
  const downCents = clampSetupFeeCents(downPaymentDollars);
  const remaining = TUITION_CENTS - downCents;
  return Math.round(remaining / PAYMENT_TERM_WEEKS);
}

/**
 * Remaining hours for display only — never used in pricing.
 * @param transferHoursClaimed — unverified student-reported hours
 */
export function remainingHoursDisplay(transferHoursClaimed: number): number {
  return Math.max(0, TOTAL_HOURS_REQUIRED - Math.max(0, transferHoursClaimed));
}
