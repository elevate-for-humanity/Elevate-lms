/**
 * Apprenticeship Subscription Products
 *
 * Defines Stripe products and prices for apprenticeship programs.
 * These are used for recurring payment plans (weekly/monthly subscriptions).
 *
 * PRICES ARE IN DOLLARS (converted to cents when sent to Stripe)
 */

// Individual course one-time purchases (for hospitality program)
export const HOSPITALITY_COURSES = {
  'start-hospitality': {
    name: 'Start in Hospitality',
    description: 'Foundation course for hospitality careers',
    price: 89,
    credentials: ['Hospitality Certificate'],
  },
  'servsafe-food-handler': {
    name: 'ServSafe Food Handler',
    description: 'Nationally recognized food safety certification',
    price: 29,
    credentials: ['ServSafe Food Handler'],
  },
  'servsafe-manager': {
    name: 'ServSafe Manager',
    description: 'Advanced food safety management certification',
    price: 199,
    credentials: ['ServSafe Manager Certification'],
  },
  'servsuccess': {
    name: 'ServSuccess Professional',
    description: 'Professional hospitality service certification',
    price: 129,
    credentials: ['ServSuccess Certificate'],
  },
  'guest-service-gold': {
    name: 'Guest Service Gold',
    description: 'AHLEI hospitality certification',
    price: 0, // Free - comes with program
    credentials: ['Guest Service Gold Certification'],
  },
} as const;

// Apprenticeship payment plan configurations
export const APPRENTICESHIP_PLANS = {
  barber: {
    programId: 'prog-barber',
    programName: 'Barber Apprenticeship',
    totalCost: 4980,
    deposit: 600,
    weeklyPayment: 45,
    weeks: 96,
    subscriptionType: 'weekly' as const,
  },
  cosmetology: {
    programId: 'prog-cosmetology',
    programName: 'Cosmetology Apprenticeship',
    totalCost: 6000,
    deposit: 1000,
    weeklyPayment: 50,
    weeks: 100,
    subscriptionType: 'weekly' as const,
  },
  esthetician: {
    programId: 'prog-esthetics',
    programName: 'Esthetics Apprenticeship',
    totalCost: 2500,
    deposit: 500,
    weeklyPayment: 25,
    weeks: 80,
    subscriptionType: 'weekly' as const,
  },
  'nail-tech': {
    programId: 'prog-nail-tech',
    programName: 'Nail Technician Apprenticeship',
    totalCost: 2500,
    deposit: 500,
    weeklyPayment: 25,
    weeks: 80,
    subscriptionType: 'weekly' as const,
  },
} as const;

// Program application fees
export const APPLICATION_FEES = {
  default: {
    name: 'Program Application Fee',
    amount: 15,
    currency: 'usd',
    description: 'Non-refundable application fee',
    stripePriceId: process.env.STRIPE_PRICE_APPLICATION_FEE || 'price_1TiEDyH4a2yrVOt5pYBCQc2D',
  },
} as const;

// Get price ID for a course (creates inline price data for checkout)
export function getCourseCheckoutData(courseSlug: keyof typeof HOSPITALITY_COURSES) {
  const course = HOSPITALITY_COURSES[courseSlug];
  if (!course) return null;

  return {
    name: course.name,
    description: course.description,
    amount: course.price * 100, // Convert to cents
    currency: 'usd',
  };
}

// Get apprenticeship plan configuration
export function getApprenticeshipPlan(programType: keyof typeof APPRENTICESHIP_PLANS) {
  return APPRENTICESHIP_PLANS[programType] || null;
}

// Calculate payment breakdown
export function calculatePaymentBreakdown(
  totalAmount: number,
  depositPercent: number,
  months: number,
) {
  const deposit = Math.round(totalAmount * (depositPercent / 100));
  const remaining = totalAmount - deposit;
  const monthlyPayment = Math.ceil(remaining / months);

  return {
    deposit,
    remaining,
    monthlyPayment,
    totalMonths: months,
    totalWithInterest: totalAmount,
    apr: 0, // 0% APR
  };
}
