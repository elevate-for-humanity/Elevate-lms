// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculatePayrollLine,
  calculatePayrollDraft,
  employeePayrollSchema,
  payrollDraftSchema,
  type PayrollEmployee,
} from '@/lib/payroll/supersonic-2026';
import { payrollReviewCsv } from '@/lib/payroll/review-export';
const employee: PayrollEmployee = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Fictional employee',
  reference: 'E-1',
  active: true,
  hourlyRateCents: 2500,
  frequency: 'weekly',
  w4: {
    year: 2026,
    filingStatus: 'single',
    multipleJobs: false,
    exempt: false,
    annualCreditsCents: 0,
    otherIncomeCents: 0,
    deductionsCents: 0,
    extraWithholdingCents: 0,
  },
  indiana: {
    resident: true,
    countyCode: '49',
    personalExemptions: 1,
    dependentExemptions: 0,
    firstTimeDependentExemptions: 0,
    adoptedChildExemptions: 0,
    extraStateCents: 0,
    extraCountyCents: 0,
  },
};
const line = {
  employeeId: employee.id,
  regularMinutes: 2400,
  overtimeMinutes: 0,
  afterTaxDeductionCents: 0,
  priorSocialSecurityWagesCents: 0,
  priorMedicareWagesCents: 0,
  priorWageEvidence: 'Fictional zero opening payroll report',
};
const draft = {
  periodStart: '2026-11-01',
  periodEnd: '2026-11-07',
  payDate: '2026-11-13',
  timesheetsReviewed: true as const,
  lines: [line],
};
describe('2026 Supersonic regular Indiana payroll', () => {
  it('matches independent IRS Worksheet 1A and DOR Marion calculations for $1,000 weekly', () => {
    const r = calculatePayrollLine(employee, line);
    expect(r).toMatchObject({
      grossCents: 100000,
      federalCents: 7808,
      socialSecurityCents: 6200,
      medicareCents: 1450,
      stateCents: 2893,
      countyCents: 1981,
      netCents: 79668,
      employerFicaCents: 7650,
    });
  });
  it.each([
    ['married_joint', 3808],
    ['head_of_household', 5746],
  ] as const)('applies the %s W-4 schedule', (filingStatus, expected) => {
    expect(
      calculatePayrollLine({ ...employee, w4: { ...employee.w4, filingStatus } }, line)
        .federalCents,
    ).toBe(expected);
  });
  it('uses the multiple-jobs checkbox schedule, annual credit and per-paycheck extra', () => {
    expect(
      calculatePayrollLine({ ...employee, w4: { ...employee.w4, multipleJobs: true } }, line)
        .federalCents,
    ).toBe(13510);
    expect(
      calculatePayrollLine(
        {
          ...employee,
          w4: { ...employee.w4, annualCreditsCents: 52000, extraWithholdingCents: 1000 },
        },
        line,
      ).federalCents,
    ).toBe(7808);
  });
  it('never treats federal exemption as an Indiana or FICA exemption', () => {
    expect(
      calculatePayrollLine({ ...employee, w4: { ...employee.w4, exempt: true } }, line),
    ).toMatchObject({
      federalCents: 0,
      stateCents: 2893,
      countyCents: 1981,
      socialSecurityCents: 6200,
    });
  });
  it('rejects an expired federal exempt election', () => {
    expect(
      employeePayrollSchema.safeParse({
        ...employee,
        w4: { ...employee.w4, year: 2025, exempt: true },
      }).success,
    ).toBe(false);
  });
  it('caps Social Security wages and starts additional Medicare at the employer threshold', () => {
    expect(
      calculatePayrollLine(employee, { ...line, priorSocialSecurityWagesCents: 18400000 }),
    ).toMatchObject({ socialSecurityCents: 3100 });
    expect(
      calculatePayrollLine(employee, {
        ...line,
        priorSocialSecurityWagesCents: 18450000,
        priorMedicareWagesCents: 19950000,
      }),
    ).toMatchObject({ socialSecurityCents: 0, additionalMedicareCents: 450 });
  });
  it('calculates separately reviewed overtime and rejects excess deductions', () => {
    expect(calculatePayrollLine(employee, { ...line, overtimeMinutes: 120 })).toMatchObject({
      regularCents: 100000,
      overtimeCents: 7500,
      grossCents: 107500,
    });
    expect(() =>
      calculatePayrollLine(employee, { ...line, afterTaxDeductionCents: 100000 }),
    ).toThrow(/exceed/);
  });
  it('rejects unsupported tax years, nonresidents, invalid counties and invented payment flags', () => {
    expect(
      employeePayrollSchema.safeParse({
        ...employee,
        indiana: { ...employee.indiana, resident: false },
      }).success,
    ).toBe(false);
    expect(
      employeePayrollSchema.safeParse({
        ...employee,
        indiana: { ...employee.indiana, countyCode: '00' },
      }).success,
    ).toBe(false);
    expect(
      employeePayrollSchema.safeParse({ ...employee, w4: { ...employee.w4, year: 2019 } }).success,
    ).toBe(false);
    expect(payrollDraftSchema.safeParse({ ...draft, payDate: '2027-01-01' }).success).toBe(false);
    expect(payrollDraftSchema.safeParse({ ...draft, periodStart: '2026-09-30' }).success).toBe(
      false,
    );
    expect(payrollDraftSchema.safeParse({ ...draft, paymentsSent: true }).success).toBe(false);
  });
  it('rejects duplicate, inactive and other-company employees and missing prior-wage evidence', () => {
    expect(() => calculatePayrollDraft([employee], { ...draft, lines: [line, line] })).toThrow();
    expect(() => calculatePayrollDraft([], draft)).toThrow(/belong/);
    expect(() => calculatePayrollDraft([{ ...employee, active: false }], draft)).toThrow(/active/);
    expect(() =>
      calculatePayrollDraft([employee], { ...draft, lines: [{ ...line, priorWageEvidence: '' }] }),
    ).toThrow();
  });
  it('exports a formula-safe private review, never a fake payment or filing receipt', () => {
    const calculation = calculatePayrollDraft([{ ...employee, name: '=WEBSERVICE("bad")' }], draft);
    expect(calculation.paymentsSent).toBe(false);
    expect(calculation.taxesFiled).toBe(false);
    const csv = payrollReviewCsv('+Client', { id: 'run', status: 'draft', calculation });
    expect(csv).toContain("'+Client");
    expect(csv).toContain("'=WEBSERVICE");
    expect(csv).toContain('No funds sent; no tax returns filed');
    expect(csv).not.toContain('priorWageEvidence');
  });
});
