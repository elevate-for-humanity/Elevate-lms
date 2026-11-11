import { z } from 'zod';
import counties from './indiana-counties-2026.json';

// Sources: IRS Publication 15-T (2026), Worksheet 1A / annual tables;
// Publication 15 (2026); Indiana DOR Notice #1, effective 2026-10-01.
// Regular periodic wages only. Unsupported arrangements must use a reviewed
// external payroll engine; never fall back to a made-up withholding percentage.
export const PAYROLL_VERSION = 'sfc-periodic-IN-2026.1';
export const payPeriods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 } as const;
const cents = z.number().int().min(0).max(100_000_000);
const annual = z.number().int().min(0).max(10_000_000_000);
export const employeePayrollSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(120),
    reference: z.string().trim().min(1).max(80),
    active: z.boolean(),
    hourlyRateCents: cents.positive(),
    frequency: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']),
    w4: z
      .object({
        year: z.number().int().min(2020).max(2026),
        filingStatus: z.enum(['single', 'married_joint', 'head_of_household']),
        multipleJobs: z.boolean(),
        exempt: z.boolean(),
        annualCreditsCents: annual,
        otherIncomeCents: annual,
        deductionsCents: annual,
        extraWithholdingCents: cents,
      })
      .strict(),
    indiana: z
      .object({
        resident: z.literal(true),
        countyCode: z
          .string()
          .regex(/^\d{2}$/)
          .refine((v) => v in counties, 'Select an Indiana county'),
        personalExemptions: z.number().int().min(0).max(20),
        dependentExemptions: z.number().int().min(0).max(20),
        firstTimeDependentExemptions: z.number().int().min(0).max(20),
        adoptedChildExemptions: z.number().int().min(0).max(20),
        extraStateCents: cents,
        extraCountyCents: cents,
      })
      .strict(),
  })
  .strict();
export type PayrollEmployee = z.infer<typeof employeePayrollSchema>;
export const payrollLineSchema = z
  .object({
    employeeId: z.string().uuid(),
    regularMinutes: z.number().int().min(0).max(30_000),
    overtimeMinutes: z.number().int().min(0).max(30_000),
    afterTaxDeductionCents: cents,
    // Import the actual same-employer wage totals from the previous processor.
    // A saved or approved draft is never counted as money already paid.
    priorSocialSecurityWagesCents: annual,
    priorMedicareWagesCents: annual,
    priorWageEvidence: z.string().trim().min(3).max(200),
  })
  .strict();
export const payrollDraftSchema = z
  .object({
    periodStart: z.string().date(),
    periodEnd: z.string().date(),
    payDate: z.string().date(),
    timesheetsReviewed: z.literal(true),
    lines: z.array(payrollLineSchema).min(1).max(100),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.periodStart > v.periodEnd || v.payDate < v.periodEnd)
      c.addIssue({ code: 'custom', message: 'Review the pay-period and pay dates' });
    if (v.periodStart < '2026-10-01' || v.payDate > '2026-12-31')
      c.addIssue({
        code: 'custom',
        message:
          'This engine supports regular Indiana periods beginning October–December 2026 only',
      });
    if (new Set(v.lines.map((l) => l.employeeId)).size !== v.lines.length)
      c.addIssue({ code: 'custom', message: 'An employee may appear only once per run' });
  });
export type PayrollDraft = z.infer<typeof payrollDraftSchema>;
type Band = readonly [number, number, number];
// lower adjusted annual wage, base tax, marginal rate (dollars).
const standard: Record<PayrollEmployee['w4']['filingStatus'], readonly Band[]> = {
  single: [
    [0, 0, 0],
    [7500, 0, 0.1],
    [19900, 1240, 0.12],
    [57900, 5800, 0.22],
    [113200, 17966, 0.24],
    [209275, 41024, 0.32],
    [263725, 58448, 0.35],
    [648100, 192979.25, 0.37],
  ],
  married_joint: [
    [0, 0, 0],
    [19300, 0, 0.1],
    [44100, 2480, 0.12],
    [120100, 11600, 0.22],
    [230700, 35932, 0.24],
    [422850, 82048, 0.32],
    [531750, 116896, 0.35],
    [788000, 206583.5, 0.37],
  ],
  head_of_household: [
    [0, 0, 0],
    [15550, 0, 0.1],
    [33250, 1770, 0.12],
    [83000, 7740, 0.22],
    [121250, 16155, 0.24],
    [217300, 39207, 0.32],
    [271750, 56631, 0.35],
    [656150, 191171, 0.37],
  ],
};
const multiple: typeof standard = {
  single: [
    [0, 0, 0],
    [8050, 0, 0.1],
    [14250, 620, 0.12],
    [33250, 2900, 0.22],
    [60900, 8983, 0.24],
    [108938, 20512, 0.32],
    [136163, 29224, 0.35],
    [328350, 96489.63, 0.37],
  ],
  married_joint: [
    [0, 0, 0],
    [16100, 0, 0.1],
    [28500, 1240, 0.12],
    [66500, 5800, 0.22],
    [121800, 17966, 0.24],
    [217875, 41024, 0.32],
    [272325, 58448, 0.35],
    [400450, 103291.75, 0.37],
  ],
  head_of_household: [
    [0, 0, 0],
    [12075, 0, 0.1],
    [20925, 885, 0.12],
    [45800, 3870, 0.22],
    [64925, 8077.5, 0.24],
    [112950, 19603.5, 0.32],
    [140175, 28315.5, 0.35],
    [332375, 95585.5, 0.37],
  ],
};
const rounded = (n: number) => Math.round(n + Number.EPSILON);
export function calculatePayrollLine(
  employeeInput: PayrollEmployee,
  input: z.infer<typeof payrollLineSchema>,
) {
  const e = employeePayrollSchema.parse(employeeInput),
    l = payrollLineSchema.parse(input);
  if (!e.active || e.id !== l.employeeId)
    throw Error('Select an active employee from this company');
  const periods = payPeriods[e.frequency],
    w = e.w4;
  const regularCents = rounded((e.hourlyRateCents * l.regularMinutes) / 60);
  const overtimeCents = rounded(((e.hourlyRateCents * l.overtimeMinutes) / 60) * 1.5);
  const grossCents = regularCents + overtimeCents;
  if (!grossCents) throw Error('Enter positive approved hours');
  const offset = w.multipleJobs ? 0 : w.filingStatus === 'married_joint' ? 12900 : 8600;
  const adjustedAnnual = Math.max(
    0,
    (grossCents * periods + w.otherIncomeCents - w.deductionsCents) / 100 - offset,
  );
  const bands = (w.multipleJobs ? multiple : standard)[w.filingStatus];
  const band = [...bands].reverse().find((b) => adjustedAnnual >= b[0])!;
  const annualTax = band[1] + (adjustedAnnual - band[0]) * band[2];
  const federalCents = w.exempt
    ? 0
    : rounded(
        Math.max(0, annualTax * 100 - w.annualCreditsCents) / periods + w.extraWithholdingCents,
      );
  const socialSecurityCents = rounded(
    Math.min(grossCents, Math.max(0, 18_450_000 - l.priorSocialSecurityWagesCents)) * 0.062,
  );
  const medicareCents = rounded(grossCents * 0.0145);
  const additionalMedicareCents = rounded(
    Math.min(grossCents, Math.max(0, l.priorMedicareWagesCents + grossCents - 20_000_000)) * 0.009,
  );
  const i = e.indiana;
  // DOR constants are rounded separately for Tables A, B and C.
  const exemptionsCents =
    rounded((i.personalExemptions * 100_000) / periods) +
    rounded(((i.dependentExemptions + i.firstTimeDependentExemptions) * 150_000) / periods) +
    rounded((i.adoptedChildExemptions * 300_000) / periods);
  const indianaTaxableCents = Math.max(0, grossCents - exemptionsCents);
  const stateCents = rounded(indianaTaxableCents * 0.0295) + i.extraStateCents;
  const county = counties[i.countyCode as keyof typeof counties];
  const countyCents = rounded(indianaTaxableCents * county.rate) + i.extraCountyCents;
  const employeeTaxCents =
    federalCents +
    socialSecurityCents +
    medicareCents +
    additionalMedicareCents +
    stateCents +
    countyCents;
  const netCents = grossCents - employeeTaxCents - l.afterTaxDeductionCents;
  if (netCents < 0)
    throw Error('Withholding and deductions exceed gross wages; review before saving');
  return {
    employeeId: e.id,
    name: e.name,
    reference: e.reference,
    regularCents,
    overtimeCents,
    grossCents,
    federalCents,
    socialSecurityCents,
    medicareCents,
    additionalMedicareCents,
    stateCents,
    countyCents,
    afterTaxDeductionCents: l.afterTaxDeductionCents,
    employeeTaxCents,
    netCents,
    employerFicaCents: socialSecurityCents + medicareCents,
    county: county.name,
    countyRate: county.rate,
  };
}
export function calculatePayrollDraft(employees: PayrollEmployee[], input: PayrollDraft) {
  const draft = payrollDraftSchema.parse(input);
  const lines = draft.lines.map((l) => {
    const e = employees.find((e) => e.id === l.employeeId);
    if (!e) throw Error('An employee does not belong to this company');
    return calculatePayrollLine(e, l);
  });
  return {
    version: PAYROLL_VERSION,
    periodStart: draft.periodStart,
    periodEnd: draft.periodEnd,
    payDate: draft.payDate,
    lines,
    grossCents: lines.reduce((s, l) => s + l.grossCents, 0),
    netCents: lines.reduce((s, l) => s + l.netCents, 0),
    employeeTaxCents: lines.reduce((s, l) => s + l.employeeTaxCents, 0),
    employerFicaCents: lines.reduce((s, l) => s + l.employerFicaCents, 0),
    paymentsSent: false as const,
    taxesFiled: false as const,
    exclusions: [
      'Employer unemployment taxes',
      'Nonresident or multistate wages',
      'Pre-tax benefits, tips, bonuses, garnishments and special wage arrangements',
    ],
  };
}
