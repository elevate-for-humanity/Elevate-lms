import { getInitialProgramInvoiceCents } from './deposit-policy';
import { BARBER_PRICING } from './pricing';

export function downPaymentCents(value: string): number {
  return /^\d+(?:\.\d{0,2})?$/.test(value) ? Math.round(Number(value) * 100) : NaN;
}

/** Shared by the calculator, checkout and manual-invoice schedule. All money is cents. */
export function programInstallmentTerms(
  slug: string,
  tuitionCents: number,
  downPaymentCents?: number,
) {
  const minimum = getInitialProgramInvoiceCents(slug, tuitionCents);
  const down = downPaymentCents ?? minimum;
  if (!Number.isSafeInteger(down) || down < minimum || down > tuitionCents)
    throw new Error(
      `Choose a down payment between $${(minimum / 100).toFixed(2)} and $${(tuitionCents / 100).toFixed(2)}.`,
    );
  const balance = tuitionCents - down;
  return { downPaymentCents: down, ...installmentSchedule(slug, balance) };
}

export function installmentSchedule(slug: string, balance: number) {
  const term = slug === 'barber-apprenticeship' ? BARBER_PRICING.paymentTermWeeks : 3;
  const installment = Math.ceil(balance / term);
  const count = installment ? Math.ceil(balance / installment) : 0;
  return {
    balanceCents: balance,
    installmentCents: installment,
    installmentCount: balance ? count : 0,
    finalInstallmentCents: balance ? balance - installment * (count - 1) : 0,
    cadence: slug === 'barber-apprenticeship' ? ('weekly' as const) : ('monthly' as const),
  };
}

/** A calendar date in Indianapolis, never a same-day Friday invoice. */
export function firstWeeklyInvoiceDate(now = new Date()): string {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: BARBER_PRICING.billingTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));
  const days = (5 - target.getUTCDay() + 7) % 7 || 7;
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().slice(0, 10);
}
