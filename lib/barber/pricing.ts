/**
 * Barber Apprenticeship — Absolute Pricing Authority
 *
 * POLICY (immutable):
 *   Tuition is fixed at $4,980. Transfer hours NEVER affect price.
 *   Deposits are UNLIMITED — no minimum required. User can put any amount down ($0 to full tuition).
 *   No other file may define or derive barber tuition amounts.
 *
 * Program/course IDs — single source of truth.
 *   Do not hardcode these UUIDs in checkout routes or page components.
 *   Import BARBER_PROGRAM_ID and BARBER_COURSE_ID from here instead.
 *
 * If this policy changes, update:
 *   - All four Stripe session creation routes in app/api/barber/checkout/
 *   - Email templates in app/api/barber/webhook/route.ts
 *   - Cron email in app/api/cron/barber-billing/route.ts
 *   - lib/barber/suspension.ts (policy comment)
 */

/** Full program tuition in cents. Never derived from hours, ratios, or client input. */
/** Barber Apprenticeship program_id in the programs table */
export const BARBER_PROGRAM_ID = '5ff21fcb-1968-41fd-99d3-37d69a31bd5c';

/** Barber Apprenticeship course_id in the courses/training_courses table */
export const BARBER_COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

export const TUITION_CENTS = 498000; // $4,980

/** Full program tuition in dollars. */
export const TUITION_DOLLARS = 4980;

/** Universal deposit — NO minimum required. User can put $0 to full tuition. */
export const MIN_SETUP_FEE_CENTS = 0; // $0 - no minimum

/** Payment term — fixed at 29 weekly invoices. */
export const PAYMENT_TERM_WEEKS = 29;

/**
 * Total training hours required per DOL Standards.
 * 2,000 hours total (OJT + RTI) per DOL Registered Apprenticeship.
 */
export const TOTAL_HOURS_REQUIRED = 2000;

/**
 * Clamp a user-provided setup fee to the allowed range (0 to tuition).
 * Universal deposit — any amount from $0 up to full tuition is allowed.
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
  const downCents = Math.round(Math.min(TUITION_CENTS, Math.max(0, downPaymentDollars * 100)));
  const remaining = Math.max(0, TUITION_CENTS - downCents);
  if (remaining === 0) return 0;
  return Math.ceil(remaining / PAYMENT_TERM_WEEKS);
}

/**
 * Remaining hours for display only — never used in pricing.
 * @param transferHoursClaimed — unverified student-reported hours
 */
export function remainingHoursDisplay(transferHoursClaimed: number): number {
  return Math.max(0, TOTAL_HOURS_REQUIRED - Math.max(0, transferHoursClaimed));
}
