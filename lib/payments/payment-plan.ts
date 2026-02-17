/**
 * Payment Plan Calculator
 * 
 * Flow:
 * 1. Customer pays down payment (for approval)
 * 2. Weekly payments calculated based on program hours and remaining amount
 * 3. Payments continue until balance is paid
 */

export interface PaymentPlanConfig {
  totalAmount: number;          // Total program cost
  downPaymentPercent: number;   // e.g., 0.10 for 10%
  programHours: number;         // Total program hours
  hoursPerWeek: number;         // Expected hours per week (e.g., 40)
}

export interface PaymentPlan {
  totalAmount: number;
  downPayment: number;
  remainingBalance: number;
  weeklyPayment: number;
  numberOfWeeks: number;
  programHours: number;
  hoursPerWeek: number;
  schedule: PaymentScheduleItem[];
}

export interface PaymentScheduleItem {
  weekNumber: number;
  dueDate: Date;
  amount: number;
  type: 'down_payment' | 'weekly';
  cumulativePaid: number;
  remainingBalance: number;
}

/**
 * Calculate payment plan based on program details
 */
export function calculatePaymentPlan(config: PaymentPlanConfig): PaymentPlan {
  const { totalAmount, downPaymentPercent, programHours, hoursPerWeek } = config;

  // Calculate down payment (minimum $100, or percentage)
  const downPayment = Math.max(100, Math.round(totalAmount * downPaymentPercent));
  const remainingBalance = totalAmount - downPayment;

  // Calculate number of weeks based on program hours
  const numberOfWeeks = Math.ceil(programHours / hoursPerWeek);

  // Calculate weekly payment (remaining balance / weeks)
  const weeklyPayment = Math.ceil(remainingBalance / numberOfWeeks);

  // Generate payment schedule
  const schedule: PaymentScheduleItem[] = [];
  let cumulativePaid = 0;
  let balance = totalAmount;
  const startDate = new Date();

  // Down payment (due today)
  cumulativePaid += downPayment;
  balance -= downPayment;
  schedule.push({
    weekNumber: 0,
    dueDate: startDate,
    amount: downPayment,
    type: 'down_payment',
    cumulativePaid,
    remainingBalance: balance,
  });

  // Weekly payments
  for (let week = 1; week <= numberOfWeeks; week++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (week * 7));

    // Last payment might be less if we've overpaid
    const paymentAmount = Math.min(weeklyPayment, balance);
    
    if (paymentAmount <= 0) break;

    cumulativePaid += paymentAmount;
    balance -= paymentAmount;

    schedule.push({
      weekNumber: week,
      dueDate,
      amount: paymentAmount,
      type: 'weekly',
      cumulativePaid,
      remainingBalance: Math.max(0, balance),
    });
  }

  return {
    totalAmount,
    downPayment,
    remainingBalance: totalAmount - downPayment,
    weeklyPayment,
    numberOfWeeks,
    programHours,
    hoursPerWeek,
    schedule,
  };
}

/**
 * Pre-configured payment plans for common programs
 */
export const PROGRAM_PAYMENT_PLANS: Record<string, PaymentPlanConfig> = {
  'barber-apprenticeship': {
    totalAmount: 4980,
    downPaymentPercent: 0.10, // 10% = $498
    programHours: 2000,
    hoursPerWeek: 40,
  },
  'cosmetology-apprenticeship': {
    totalAmount: 5500,
    downPaymentPercent: 0.10,
    programHours: 1500,
    hoursPerWeek: 40,
  },
  'nail-technician-apprenticeship': {
    totalAmount: 2500,
    downPaymentPercent: 0.15,
    programHours: 600,
    hoursPerWeek: 30,
  },
  'esthetician-apprenticeship': {
    totalAmount: 3500,
    downPaymentPercent: 0.15,
    programHours: 700,
    hoursPerWeek: 30,
  },
  'cna-certification': {
    totalAmount: 1200,
    downPaymentPercent: 0.17, // ~$200
    programHours: 120,
    hoursPerWeek: 20,
  },
  'phlebotomy': {
    totalAmount: 1500,
    downPaymentPercent: 0.15,
    programHours: 80,
    hoursPerWeek: 20,
  },
};

/**
 * Get payment plan for a specific program
 */
export function getProgramPaymentPlan(programSlug: string): PaymentPlan | null {
  const config = PROGRAM_PAYMENT_PLANS[programSlug];
  if (!config) return null;
  return calculatePaymentPlan(config);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
