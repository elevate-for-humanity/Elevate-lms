import { capCheckoutDollarsToCents } from './format-metrics';

function toSafeNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function sumCentsFromRows<T extends Record<string, unknown>>(
  rows: T[],
  value: (row: T) => number,
  date: (row: T) => string | null | undefined,
  startIso?: string,
  endIso?: string,
): number {
  const startMs = startIso ? new Date(startIso).getTime() : null;
  const endMs = endIso ? new Date(endIso).getTime() : null;
  return rows.reduce((sum, row) => {
    const rawDate = date(row);
    if (startMs !== null || endMs !== null) {
      if (!rawDate) return sum;
      const t = new Date(rawDate).getTime();
      if (startMs !== null && t < startMs) return sum;
      if (endMs !== null && t >= endMs) return sum;
    }
    return sum + value(row);
  }, 0);
}

export interface TrackedRevenueInput {
  rpcOk: boolean;
  rpcAllTime: number;
  rpcThisMonth: number;
  rpcLastMonth: number;
  enrollmentRows: Record<string, unknown>[];
  stripeRows: Record<string, unknown>[];
  barberSubs: Record<string, unknown>[];
  cosmoSubs: Record<string, unknown>[];
  barberPayments: Record<string, unknown>[];
  thisMonthStart: string;
  lastMonthStart: string;
  lastMonthEnd: string;
}

/** RPC-first revenue — avoids Math.max double-count across enrollment + Stripe. */
export function computeTrackedRevenue(input: TrackedRevenueInput): {
  allTimeCents: number;
  thisMonthCents: number;
  lastMonthCents: number;
} {
  const enrollmentAll = sumCentsFromRows(
    input.enrollmentRows,
    (row) => Math.max(toSafeNumber(row.your_revenue_cents), toSafeNumber(row.amount_paid_cents)),
    (row) => String(row.paid_at ?? row.created_at ?? ''),
  );
  const enrollmentThisMonth = sumCentsFromRows(
    input.enrollmentRows,
    (row) => Math.max(toSafeNumber(row.your_revenue_cents), toSafeNumber(row.amount_paid_cents)),
    (row) => String(row.paid_at ?? row.created_at ?? ''),
    input.thisMonthStart,
  );
  const enrollmentLastMonthOnly = sumCentsFromRows(
    input.enrollmentRows,
    (row) => Math.max(toSafeNumber(row.your_revenue_cents), toSafeNumber(row.amount_paid_cents)),
    (row) => String(row.paid_at ?? row.created_at ?? ''),
    input.lastMonthStart,
    input.lastMonthEnd,
  );

  const stripeAll = sumCentsFromRows(
    input.stripeRows,
    (row) => toSafeNumber(row.amount),
    (row) => String(row.created_at ?? ''),
  );
  const stripeThisMonth = sumCentsFromRows(
    input.stripeRows,
    (row) => toSafeNumber(row.amount),
    (row) => String(row.created_at ?? ''),
    input.thisMonthStart,
  );
  const stripeLastMonth = sumCentsFromRows(
    input.stripeRows,
    (row) => toSafeNumber(row.amount),
    (row) => String(row.created_at ?? ''),
    input.lastMonthStart,
    input.lastMonthEnd,
  );

  const apprenticeshipAll = sumCentsFromRows(
    [...input.barberSubs, ...input.cosmoSubs],
    (row) => capCheckoutDollarsToCents(row.amount_paid_at_checkout),
    (row) => String(row.created_at ?? ''),
  );
  const apprenticeshipThisMonth = sumCentsFromRows(
    [...input.barberSubs, ...input.cosmoSubs],
    (row) => capCheckoutDollarsToCents(row.amount_paid_at_checkout),
    (row) => String(row.created_at ?? ''),
    input.thisMonthStart,
  );
  const apprenticeshipLastMonth = sumCentsFromRows(
    [...input.barberSubs, ...input.cosmoSubs],
    (row) => capCheckoutDollarsToCents(row.amount_paid_at_checkout),
    (row) => String(row.created_at ?? ''),
    input.lastMonthStart,
    input.lastMonthEnd,
  );

  const barberRecurringAll = sumCentsFromRows(
    input.barberPayments,
    (row) => capCheckoutDollarsToCents(row.amount_paid),
    (row) => String(row.payment_date ?? row.created_at ?? ''),
  );
  const barberRecurringThisMonth = sumCentsFromRows(
    input.barberPayments,
    (row) => capCheckoutDollarsToCents(row.amount_paid),
    (row) => String(row.payment_date ?? row.created_at ?? ''),
    input.thisMonthStart,
  );
  const barberRecurringLastMonth = sumCentsFromRows(
    input.barberPayments,
    (row) => capCheckoutDollarsToCents(row.amount_paid),
    (row) => String(row.payment_date ?? row.created_at ?? ''),
    input.lastMonthStart,
    input.lastMonthEnd,
  );

  const supplementAll = apprenticeshipAll + barberRecurringAll;
  const supplementThisMonth = apprenticeshipThisMonth + barberRecurringThisMonth;
  const supplementLastMonth = apprenticeshipLastMonth + barberRecurringLastMonth;

  if (input.rpcOk) {
    return {
      allTimeCents: input.rpcAllTime + supplementAll,
      thisMonthCents: input.rpcThisMonth + supplementThisMonth,
      lastMonthCents: input.rpcLastMonth + supplementLastMonth,
    };
  }

  const enrollmentBaseAll = Math.max(enrollmentAll, stripeAll);
  const enrollmentBaseThisMonth = Math.max(enrollmentThisMonth, stripeThisMonth);
  const enrollmentBaseLastMonth = Math.max(enrollmentLastMonthOnly, stripeLastMonth);

  return {
    allTimeCents: enrollmentBaseAll + supplementAll,
    thisMonthCents: enrollmentBaseThisMonth + supplementThisMonth,
    lastMonthCents: enrollmentBaseLastMonth + supplementLastMonth,
  };
}
