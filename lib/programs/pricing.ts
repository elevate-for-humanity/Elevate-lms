/**
 * BARBER APPRENTICESHIP PRICING - Single Source of Truth
 *
 * Full Program Price: $4,980 (fixed — never adjusted for transfer hours)
 * Minimum Down Payment: $600 (due at enrollment — customizable upward)
 * Payment Term: 29 weeks (fixed), weekly invoices every Friday
 * Weekly Payment: ($4,980 - down payment) / 29 weeks
 *
 * TRANSFER HOUR POLICY (locked):
 *   Transfer hours are progress credit only. They reduce program duration,
 *   NOT tuition. A student transferring 1,000 hours still owes $4,980.
 *   Do not add transfer-hour-to-dollar conversion logic here.
 *
 * Billing: Down payment at enrollment, weekly charges every Friday.
 * If enrolled on Friday, first weekly charge is the following Friday.
 */

// Fixed pricing constants
export const BARBER_PRICING = {
  fullPrice: 4980,
  minDownPayment: 600,
  defaultDownPayment: 600,
  paymentTermWeeks: 29,
  totalHoursRequired: 2000,
  billingDay: 5, // Friday (0=Sunday, 5=Friday)
  billingTimezone: 'America/Indiana/Indianapolis',
  billingHour: 10, // 10:00 AM local
  // Legacy fields kept for backward compatibility
  setupFeeRate: 0.35,
  setupFee: 600,
  remainingBalance: 4380,
} as const;

// Stripe price IDs — resolved via centralized config (lib/stripe/prices.ts)
import { PRICES } from '@/lib/stripe/prices';

export const STRIPE_PRICES = {
  barberSetupFee: PRICES.BARBER_SETUP_FEE,
  barberWeeklyPayment: PRICES.BARBER_WEEKLY,
} as const;

export interface WeeklyPaymentCalculation {
  hoursRemaining: number;
  weeksRemaining: number;
  weeklyPaymentDollars: number;
  weeklyPaymentCents: number;
  totalWeeklyPayments: number;
}

/**
 * Calculate weekly payment based on down payment chosen.
 * Term is fixed at 29 weeks regardless of hours.
 */
export function calculateWeeklyPayment(
  hoursPerWeek: number,
  transferredHoursVerified: number = 0,
  downPayment: number = BARBER_PRICING.defaultDownPayment
): WeeklyPaymentCalculation {
  const { fullPrice, paymentTermWeeks, totalHoursRequired } = BARBER_PRICING;

  const hoursRemaining = Math.max(0, totalHoursRequired - transferredHoursVerified);
  const weeksRemaining = paymentTermWeeks;
  const remainingBalance = Math.max(0, fullPrice - downPayment);
  const weeklyPaymentDollars = Math.round((remainingBalance / weeksRemaining) * 100) / 100;
  const weeklyPaymentCents = Math.round(weeklyPaymentDollars * 100);

  return {
    hoursRemaining,
    weeksRemaining,
    weeklyPaymentDollars,
    weeklyPaymentCents,
    totalWeeklyPayments: weeklyPaymentDollars * weeksRemaining,
  };
}

/**
 * Get pre-calculated examples for display on pricing page
 */
export function getWeeklyPaymentExamples() {
  return [
    {
      hoursPerWeek: 40,
      ...calculateWeeklyPayment(40, 0),
      label: 'Full-time (40 hrs/week)',
    },
    {
      hoursPerWeek: 30,
      ...calculateWeeklyPayment(30, 0),
      label: 'Standard (30 hrs/week)',
    },
    {
      hoursPerWeek: 25,
      ...calculateWeeklyPayment(25, 0),
      label: 'Part-time (25 hrs/week)',
    },
  ];
}

// ─── BOOTH RENTAL PRICING ────────────────────────────────────────────────────
//
// Weekly booth/suite rental rates for Elevate's barbershop.
// Deposit = 1 week's rent, collected once at signup via Stripe before
// the first weekly charge begins.
//
// Late fee policy:
//   - $25 flat fee on day 1 past due
//   - $10/day for each additional day (days 2–5)
//   - Termination initiated at 5 days past due
//
// Billing day: Friday (same as apprenticeship program)

export type BoothRentalDiscipline = 'barber' | 'cosmetologist' | 'nail_tech' | 'esthetician';

export interface BoothRentalTier {
  discipline: BoothRentalDiscipline;
  label: string;
  spaceType: 'Booth' | 'Suite';
  weeklyRateDollars: number;
  weeklyRateCents: number;
  depositDollars: number;   // 1 week's rent
  depositCents: number;
  stripePriceKey: string;   // key into PRICES for the weekly subscription
  stripeDepositKey: string; // key into PRICES for the one-time deposit
}

export const BOOTH_RENTAL_TIERS: Record<BoothRentalDiscipline, BoothRentalTier> = {
  barber: {
    discipline: 'barber',
    label: 'Barber',
    spaceType: 'Booth',
    weeklyRateDollars: 150,
    weeklyRateCents: 15000,
    depositDollars: 150,
    depositCents: 15000,
    stripePriceKey: 'BOOTH_BARBER_WEEKLY',
    stripeDepositKey: 'BOOTH_BARBER_DEPOSIT',
  },
  cosmetologist: {
    discipline: 'cosmetologist',
    label: 'Cosmetologist',
    spaceType: 'Booth',
    weeklyRateDollars: 150,
    weeklyRateCents: 15000,
    depositDollars: 150,
    depositCents: 15000,
    stripePriceKey: 'BOOTH_COSMO_WEEKLY',
    stripeDepositKey: 'BOOTH_COSMO_DEPOSIT',
  },
  nail_tech: {
    discipline: 'nail_tech',
    label: 'Nail Technician',
    spaceType: 'Booth',
    weeklyRateDollars: 150,
    weeklyRateCents: 15000,
    depositDollars: 150,
    depositCents: 15000,
    stripePriceKey: 'BOOTH_NAIL_WEEKLY',
    stripeDepositKey: 'BOOTH_NAIL_DEPOSIT',
  },
  esthetician: {
    discipline: 'esthetician',
    label: 'Esthetician',
    spaceType: 'Suite',
    weeklyRateDollars: 160,
    weeklyRateCents: 16000,
    depositDollars: 0,    // no deposit for esthetician suite
    depositCents: 0,
    stripePriceKey: 'BOOTH_ESTHI_WEEKLY',
    stripeDepositKey: '',  // no deposit charge
  },
};

export const BOOTH_LATE_FEE = {
  initialFeeDollars: 25,   // charged on day 1 past due
  dailyFeeDollars: 10,     // charged each additional day (days 2–5)
  terminationDays: 5,      // access terminated after this many days past due
} as const;

/**
 * Get booth rental tier by discipline slug.
 * Returns null for unknown disciplines.
 */
export function getBoothRentalTier(discipline: string): BoothRentalTier | null {
  return BOOTH_RENTAL_TIERS[discipline as BoothRentalDiscipline] ?? null;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency without cents for whole numbers
 */
export function formatCurrencyWhole(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get the FOLLOWING Friday at 10:00 AM Indianapolis time
 * 
 * Rule: First weekly charge is always the "following Friday" (never same-day)
 * - Mon-Thu enrollment: upcoming Friday
 * - Friday enrollment: next week's Friday (7 days later)
 * - Sat-Sun enrollment: upcoming Friday
 */
export function getNextFridayAnchor(): Date {
  const now = new Date();
  
  // Get current day in Indianapolis timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BARBER_PRICING.billingTimezone,
    weekday: 'long',
  });
  
  const currentDay = formatter.format(now);
  
  // Calculate days until next Friday
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayIndex = daysOfWeek.indexOf(currentDay);
  const fridayIndex = 5;
  
  let daysUntilFriday = (fridayIndex - currentDayIndex + 7) % 7;
  
  // CRITICAL: If today is Friday, first charge is NEXT Friday (7 days)
  // This prevents "I just paid and got charged again" complaints
  if (daysUntilFriday === 0) {
    daysUntilFriday = 7;
  }
  
  // Create the target Friday date
  const nextFriday = new Date(now);
  nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
  
  // Set to 10:00 AM Indianapolis time
  // Note: This creates a local time; Stripe will handle timezone conversion
  nextFriday.setHours(BARBER_PRICING.billingHour, 0, 0, 0);
  
  return nextFriday;
}

/**
 * Format the first billing date for display
 */
export function formatFirstBillingDate(): string {
  const nextFriday = getNextFridayAnchor();
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(nextFriday);
}

/**
 * Get billing cycle anchor as Unix timestamp for Stripe
 */
export function getBillingCycleAnchor(): number {
  return Math.floor(getNextFridayAnchor().getTime() / 1000);
}
