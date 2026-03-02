/**
 * BARBER APPRENTICESHIP PRICING - Single Source of Truth
 * 
 * Full Program Price: $4,980 (non-negotiable)
 * Setup Fee (35%): $1,743 (due at enrollment)
 * Remaining Balance: $3,237 (paid weekly on Fridays)
 * 
 * Weekly payments calculated based on remaining hours and schedule.
 * Verified transfer hours may change weekly payment amount,
 * but the setup fee remains $1,743.
 * 
 * Billing: Setup fee at enrollment, weekly charges every Friday.
 * If enrolled on Friday, first weekly charge is the following Friday.
 */

// Fixed pricing constants
export const BARBER_PRICING = {
  fullPrice: 4980,
  setupFeeRate: 0.35,
  setupFee: 1743,
  remainingBalance: 3237,
  totalHoursRequired: 2000,
  billingDay: 5, // Friday (0=Sunday, 5=Friday)
  billingTimezone: 'America/Indiana/Indianapolis',
  billingHour: 10, // 10:00 AM local
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
 * Calculate weekly payment based on hours per week and transfer hours
 */
export function calculateWeeklyPayment(
  hoursPerWeek: number,
  transferredHoursVerified: number = 0
): WeeklyPaymentCalculation {
  const { remainingBalance, totalHoursRequired } = BARBER_PRICING;
  
  // Calculate remaining hours after transfers
  const hoursRemaining = Math.max(0, totalHoursRequired - transferredHoursVerified);
  
  // Calculate weeks remaining (ceiling to ensure full coverage)
  const weeksRemaining = Math.ceil(hoursRemaining / hoursPerWeek);
  
  // Calculate weekly payment
  const weeklyPaymentDollars = weeksRemaining > 0 
    ? Math.round((remainingBalance / weeksRemaining) * 100) / 100
    : 0;
  
  // Convert to cents for Stripe
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
