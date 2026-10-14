import { irsDollars } from './federal-1040-2026';
import type { FilingStatus } from './ty2026-base-1040';
import { federalInputSchema } from './input-schema';
import { prepareFederalReturn2026 } from './prepare-federal-return';
import { scheduleCFromRow, calculateScheduleC2026 } from './schedule-c-2026';
export type TaxSourceRow = Record<string, unknown>;
export function prepareStoredFederalReturn2026(input: {
  filingStatus: FilingStatus;
  extra: unknown;
  w2: TaxSourceRow[];
  income1099: TaxSourceRow[];
  scheduleC: TaxSourceRow[];
  itemized: TaxSourceRow | null;
}) {
  const extra = federalInputSchema.parse(input.extra ?? {});
  const amount = (value: unknown, signed = false) => {
    if (value === null || value === undefined) return 0;
    const n = Number(value);
    if (!Number.isFinite(n) || (!signed && n < 0))
      throw new Error('Invalid saved financial amount');
    return n;
  };
  const income = (type: string) =>
    input.income1099.filter((r) => r.form_type === type).reduce((s, r) => s + amount(r.amount), 0);
  if (
    input.income1099.some((r) => r.form_type === 'R') &&
    extra.taxableIraDistributions === undefined &&
    extra.taxablePensions === undefined
  )
    throw new Error('Review taxable IRA and pension amounts from your 1099-R before calculating');
  const businessSchedules = input.scheduleC.map(scheduleCFromRow);
  const businessIncome = input.scheduleC.length
    ? input.scheduleC.map((row, index) => {
        const worksheet = businessSchedules[index];
        const netProfit = worksheet
          ? calculateScheduleC2026(worksheet).netProfit
          : amount(row.net_profit, true);
        if (worksheet && netProfit !== irsDollars(amount(row.net_profit, true)))
          throw new Error('Review the changed business worksheet before calculating');
        return {
          owner: row.income_owner === 'spouse' ? ('spouse' as const) : ('primary' as const),
          netProfit,
        };
      })
    : income('NEC') !== 0
      ? [{ owner: 'primary' as const, netProfit: income('NEC') }]
      : [];
  const other = input.income1099
    .filter((r) => !['INT', 'DIV', 'NEC', 'R'].includes(String(r.form_type)))
    .reduce((s, r) => s + amount(r.amount), 0);
  const base = {
    ...extra,
    filingStatus: input.filingStatus,
    wages: input.w2.map((w) => ({
      owner: w.income_owner === 'spouse' ? ('spouse' as const) : ('primary' as const),
      wages: amount(w.wages),
      federalWithholding: amount(w.federal_withholding),
      socialSecurityWages: amount(w.social_security_wages ?? w.wages),
      medicareWages: amount(w.medicare_wages ?? w.wages),
      socialSecurityTax: amount(w.social_security_tax),
      medicareTaxWithheld: amount(w.medicare_tax),
    })),
    taxableInterest: income('INT') + (extra.additionalInterest ?? 0),
    ordinaryDividends: income('DIV') + (extra.additionalOrdinaryDividends ?? 0),
    selfEmployment: [...businessIncome, ...(extra.selfEmployment ?? [])],
    otherSchedule1Income: other + (extra.otherSchedule1Income ?? 0),
    itemizedDeductions: Math.max(
      amount(input.itemized?.total_itemized),
      extra.itemizedDeductions ?? 0,
    ),
    otherWithholding:
      input.income1099.reduce((s, r) => s + amount(r.federal_withholding), 0) +
      (extra.otherWithholding ?? 0),
  };
  return {
    ...prepareFederalReturn2026(base, extra),
    businessSchedules: businessSchedules.filter((b): b is NonNullable<typeof b> => b !== null),
    unreviewedBusinessCount: businessSchedules.filter((b) => b === null).length,
    needsScheduleC:
      input.scheduleC.length > 0 || base.selfEmployment.some((b) => b.netProfit !== 0),
  };
}
