import { BRACKETS_2026, STANDARD_DEDUCTION_2026, type FilingStatus } from './ty2026-base-1040';

export const FEDERAL_2026_SOURCE = 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf';
export const SOCIAL_SECURITY_WAGE_BASE_2026 = 184500;
export type WageStatement = {
  owner?: 'primary' | 'spouse';
  wages: number;
  federalWithholding: number;
  socialSecurityWages?: number;
  medicareWages?: number;
};
export type SelfEmployment = {
  owner?: 'primary' | 'spouse';
  netProfit: number;
  socialSecurityWages?: number;
};
export type Federal1040Input = {
  filingStatus: FilingStatus;
  wages: WageStatement[];
  taxableInterest?: number;
  taxExemptInterest?: number;
  ordinaryDividends?: number;
  qualifiedDividends?: number;
  shortTermGainLoss?: number;
  longTermGainLoss?: number;
  taxableIraDistributions?: number;
  taxablePensions?: number;
  socialSecurityBenefits?: number;
  marriedSeparateLivedWithSpouse?: boolean;
  selfEmployment?: SelfEmployment[];
  otherSchedule1Income?: number;
  adjustments?: number;
  itemizedDeductions?: number;
  mustItemize?: boolean;
  claimedAsDependent?: boolean;
  additionalStandardDeductionBoxes?: number;
  additionalDeductions?: number;
  nonItemizerQualifiedContributions?: number;
  schedule2Part1Tax?: number;
  qualifiedBusinessIncomeDeduction?: number;
  nonrefundableCredits?: number;
  childTaxCredit?: number;
  earnedIncomeCredit?: number;
  additionalChildTaxCredit?: number;
  refundableAmericanOpportunityCredit?: number;
  refundableCredits?: number;
  otherSchedule2Taxes?: number;
  estimatedPayments?: number;
  otherWithholding?: number;
  additionalMedicareWithholding?: number;
  netInvestmentIncome?: number;
};
const finite = (value: number | undefined, name: string, signed = false) => {
  const amount = value ?? 0;
  if (!Number.isFinite(amount) || (!signed && amount < 0)) throw new Error(`Invalid ${name}`);
  return amount;
};
export const irsDollars = (value: number) => Math.sign(value) * Math.floor(Math.abs(value) + 0.5);
const cents = (value: number) => Math.round(value * 100) / 100;
export function ordinaryTax2026(income: number, status: FilingStatus) {
  let tax = 0,
    previous = 0;
  for (const bracket of BRACKETS_2026[status]) {
    const upper = bracket.upTo ?? Infinity;
    tax += Math.max(0, Math.min(income, upper) - previous) * bracket.rate;
    if (income <= upper) break;
    previous = upper;
  }
  return cents(tax);
}
/** IRS table intervals are $25 below $3,000 and $50 thereafter, with four initial intervals. */
export function taxTable2026(income: number, status: FilingStatus) {
  if (!Number.isFinite(income) || income < 0) throw new Error('Invalid taxable income');
  if (income >= 100000) return irsDollars(ordinaryTax2026(income, status));
  const midpoint =
    income < 5
      ? 2.5
      : income < 15
        ? 10
        : income < 25
          ? 20
          : income < 50
            ? 37.5
            : income < 3000
              ? Math.floor(income / 25) * 25 + 12.5
              : Math.floor(income / 50) * 50 + 25;
  return irsDollars(ordinaryTax2026(midpoint, status));
}
const GAINS_2026: Record<FilingStatus, [number, number]> = {
  single: [49450, 545500],
  married_joint: [98900, 613700],
  married_separate: [49450, 306850],
  head_of_household: [66200, 579600],
  qualifying_surviving_spouse: [98900, 613700],
};
export function qualifiedDividendTax2026(
  taxableIncome: number,
  preferentialIncome: number,
  status: FilingStatus,
) {
  const preferred = Math.min(Math.max(0, preferentialIncome), taxableIncome);
  const ordinary = taxableIncome - preferred;
  const [zeroLimit, fifteenLimit] = GAINS_2026[status];
  const zero = Math.min(preferred, Math.max(0, zeroLimit - ordinary));
  const fifteen = Math.min(
    preferred - zero,
    Math.max(0, fifteenLimit - Math.max(ordinary, zeroLimit)),
  );
  const twenty = preferred - zero - fifteen;
  return Math.min(
    taxTable2026(taxableIncome, status),
    irsDollars(taxTable2026(ordinary, status) + fifteen * 0.15 + twenty * 0.2),
  );
}
export function selfEmploymentTax2026(profit: number, ssWages = 0) {
  finite(profit, 'business profit', true);
  finite(ssWages, 'Social Security wages');
  const earnings = irsDollars(Math.max(0, irsDollars(profit)) * 0.9235);
  if (earnings < 400)
    return { netEarnings: earnings, socialSecurityTax: 0, medicareTax: 0, tax: 0, deduction: 0 };
  const socialSecurityTax = irsDollars(
    Math.min(earnings, Math.max(0, SOCIAL_SECURITY_WAGE_BASE_2026 - irsDollars(ssWages))) * 0.124,
  );
  const medicareTax = irsDollars(earnings * 0.029);
  const tax = socialSecurityTax + medicareTax;
  return {
    netEarnings: earnings,
    socialSecurityTax,
    medicareTax,
    tax,
    deduction: irsDollars(tax / 2),
  };
}
export function taxableSocialSecurity2026(
  benefits: number,
  otherIncome: number,
  taxExemptInterest: number,
  status: FilingStatus,
  livedWithSpouse = false,
) {
  finite(benefits, 'Social Security benefits');
  finite(taxExemptInterest, 'tax-exempt interest');
  const provisional = otherIncome + taxExemptInterest + benefits * 0.5;
  if (status === 'married_separate' && livedWithSpouse)
    return irsDollars(Math.min(benefits * 0.85, Math.max(0, provisional) * 0.85));
  const joint = status === 'married_joint';
  const base = joint ? 32000 : 25000;
  const upper = joint ? 44000 : 34000;
  if (provisional <= base) return 0;
  if (provisional <= upper) return irsDollars(Math.min(benefits * 0.5, (provisional - base) * 0.5));
  return irsDollars(
    Math.min(
      benefits * 0.85,
      (provisional - upper) * 0.85 + Math.min(benefits * 0.5, (upper - base) * 0.5),
    ),
  );
}
export function calculateFederal1040_2026(input: Federal1040Input) {
  if (!Object.hasOwn(STANDARD_DEDUCTION_2026, input.filingStatus))
    throw new Error('Invalid filing status');
  const status = input.filingStatus;
  if (status !== 'married_joint' && input.wages.some((w) => w.owner === 'spouse'))
    throw new Error('Spouse wages require married filing jointly');
  const wages = irsDollars(input.wages.reduce((sum, w) => sum + finite(w.wages, 'wages'), 0));
  const wageWithholding = irsDollars(
    input.wages.reduce((sum, w) => sum + finite(w.federalWithholding, 'withholding'), 0),
  );
  const interest = irsDollars(finite(input.taxableInterest, 'interest'));
  const dividends = irsDollars(finite(input.ordinaryDividends, 'dividends'));
  const qualifiedDividends = irsDollars(finite(input.qualifiedDividends, 'qualified dividends'));
  if (qualifiedDividends > dividends)
    throw new Error('Qualified dividends cannot exceed ordinary dividends');
  const short = finite(input.shortTermGainLoss, 'short-term gain/loss', true),
    long = finite(input.longTermGainLoss, 'long-term gain/loss', true);
  const capital = irsDollars(Math.max(status === 'married_separate' ? -1500 : -3000, short + long));
  const grouped = new Map<string, { profit: number; ssWages: number }>();
  for (const business of input.selfEmployment ?? []) {
    const owner = business.owner ?? 'primary';
    if (owner === 'spouse' && status !== 'married_joint')
      throw new Error('Spouse business income requires married filing jointly');
    const wagesForOwner = input.wages
      .filter((w) => (w.owner ?? 'primary') === owner)
      .reduce(
        (sum, w) => sum + finite(w.socialSecurityWages ?? w.wages, 'Social Security wages'),
        0,
      );
    const group = grouped.get(owner) ?? { profit: 0, ssWages: wagesForOwner };
    group.profit += finite(business.netProfit, 'business profit', true);
    group.ssWages = Math.max(
      group.ssWages,
      finite(business.socialSecurityWages, 'Social Security wages'),
    );
    grouped.set(owner, group);
  }
  const se = [...grouped.entries()].map(([owner, b]) => ({
    owner,
    netProfit: b.profit,
    socialSecurityWages: b.ssWages,
    ...selfEmploymentTax2026(b.profit, b.ssWages),
  }));
  const selfEmploymentTax = se.reduce((sum, item) => sum + item.tax, 0),
    seDeduction = se.reduce((sum, item) => sum + item.deduction, 0);
  const business = irsDollars(
    (input.selfEmployment ?? []).reduce((sum, b) => sum + b.netProfit, 0),
  );
  const schedule1Income =
    business + irsDollars(finite(input.otherSchedule1Income, 'additional income', true));
  const adjustments = seDeduction + irsDollars(finite(input.adjustments, 'adjustments'));
  const beforeBenefits =
    wages +
    interest +
    dividends +
    capital +
    irsDollars(finite(input.taxableIraDistributions, 'IRA distributions')) +
    irsDollars(finite(input.taxablePensions, 'pensions')) +
    schedule1Income;
  const taxableBenefits = taxableSocialSecurity2026(
    finite(input.socialSecurityBenefits, 'Social Security benefits'),
    beforeBenefits - adjustments,
    finite(input.taxExemptInterest, 'tax-exempt interest'),
    status,
    input.marriedSeparateLivedWithSpouse,
  );
  const totalIncome = beforeBenefits + taxableBenefits,
    agi = totalIncome - adjustments;
  const boxes = finite(input.additionalStandardDeductionBoxes, 'aged/blind boxes');
  if (!Number.isInteger(boxes) || boxes > (status === 'married_joint' ? 4 : 2))
    throw new Error('Invalid aged/blind box count');
  const basic = STANDARD_DEDUCTION_2026[status];
  const dependentBasic = input.claimedAsDependent
    ? Math.min(basic, Math.max(1350, wages + business - seDeduction + 450))
    : basic;
  const standard = input.mustItemize
    ? 0
    : dependentBasic +
      boxes * (status === 'single' || status === 'head_of_household' ? 2050 : 1650);
  const itemized = irsDollars(finite(input.itemizedDeductions, 'itemized deductions'));
  const deduction = Math.max(standard, itemized);
  const additional = irsDollars(finite(input.additionalDeductions, 'additional deductions'));
  const qbi = irsDollars(finite(input.qualifiedBusinessIncomeDeduction, 'QBI deduction'));
  const charitable =
    itemized > standard || input.mustItemize
      ? 0
      : Math.min(
          status === 'married_joint' ? 2000 : 1000,
          irsDollars(
            finite(input.nonItemizerQualifiedContributions, 'qualified charitable contributions'),
          ),
        );
  const taxableIncome = Math.max(0, agi - deduction - charitable - additional - qbi);
  const preferential = Math.max(0, Math.min(long, short + long)) + qualifiedDividends;
  const incomeTax =
    preferential > 0
      ? qualifiedDividendTax2026(taxableIncome, preferential, status)
      : taxTable2026(taxableIncome, status);
  const part1Tax = irsDollars(finite(input.schedule2Part1Tax, 'Schedule 2 part I tax'));
  const otherCredit = Math.min(
    incomeTax + part1Tax,
    irsDollars(finite(input.nonrefundableCredits, 'nonrefundable credits')),
  );
  const childCredit = Math.min(
    Math.max(0, incomeTax + part1Tax - otherCredit),
    irsDollars(finite(input.childTaxCredit, 'child tax credit')),
  );
  const nonrefundable = otherCredit + childCredit;
  const threshold =
    status === 'married_joint' ? 250000 : status === 'married_separate' ? 125000 : 200000;
  const medicareWages = input.wages.reduce(
    (sum, w) => sum + finite(w.medicareWages ?? w.wages, 'Medicare wages'),
    0,
  );
  const additionalMedicare = irsDollars(
    Math.max(0, medicareWages + se.reduce((sum, b) => sum + b.netEarnings, 0) - threshold) * 0.009,
  );
  const niit = irsDollars(
    Math.min(
      finite(input.netInvestmentIncome, 'net investment income'),
      Math.max(0, agi - threshold),
    ) * 0.038,
  );
  const otherTaxes =
    selfEmploymentTax +
    additionalMedicare +
    niit +
    irsDollars(finite(input.otherSchedule2Taxes, 'additional taxes'));
  const totalTax = incomeTax + part1Tax - nonrefundable + otherTaxes;
  const withholding =
    wageWithholding +
    irsDollars(finite(input.otherWithholding, 'other withholding')) +
    irsDollars(finite(input.additionalMedicareWithholding, 'additional Medicare withholding'));
  const eic = irsDollars(finite(input.earnedIncomeCredit, 'earned income credit'));
  const actc = irsDollars(finite(input.additionalChildTaxCredit, 'additional child tax credit'));
  const aotc = irsDollars(
    finite(input.refundableAmericanOpportunityCredit, 'refundable education credit'),
  );
  const refundable =
    irsDollars(finite(input.refundableCredits, 'refundable credits')) + eic + actc + aotc;
  const estimated = irsDollars(finite(input.estimatedPayments, 'estimated payments'));
  const payments = withholding + estimated + refundable;
  return {
    taxYear: 2026,
    filingStatus: status,
    totalIncome,
    adjustedGrossIncome: agi,
    adjustments,
    deduction,
    deductionType: input.mustItemize || itemized > standard ? 'itemized' : 'standard',
    additionalDeductions: additional,
    qbiDeduction: qbi,
    taxableIncome,
    incomeTax,
    selfEmploymentTax,
    selfEmploymentDetails: se,
    selfEmploymentDeduction: seDeduction,
    taxableSocialSecurity: taxableBenefits,
    additionalMedicareTax: additionalMedicare,
    netInvestmentIncomeTax: niit,
    nonrefundableCredits: nonrefundable,
    otherTaxes,
    totalTax,
    federalWithholding: withholding,
    estimatedPayments: estimated,
    refundableCredits: refundable,
    totalPayments: payments,
    refundAmount: Math.max(0, payments - totalTax),
    amountOwed: Math.max(0, totalTax - payments),
    capitalLossCarryforward: Math.max(0, -(short + long) + capital),
    lines: {
      '1a': wages,
      '1z': wages,
      '2b': interest,
      '3a': qualifiedDividends,
      '3b': dividends,
      '4b': irsDollars(input.taxableIraDistributions ?? 0),
      '5b': irsDollars(input.taxablePensions ?? 0),
      '6b': taxableBenefits,
      '7a': capital,
      '8': schedule1Income,
      '9': totalIncome,
      '10': adjustments,
      '11a': agi,
      '11b': agi,
      '12e': deduction,
      '12f': charitable,
      '13a': additional,
      '13b': qbi,
      '14': deduction + charitable + additional + qbi,
      '15': taxableIncome,
      '16': incomeTax,
      '17': part1Tax,
      '18': incomeTax + part1Tax,
      '19': childCredit,
      '20': otherCredit,
      '21': nonrefundable,
      '22': incomeTax + part1Tax - nonrefundable,
      '23': otherTaxes,
      '24': totalTax,
      '25a': wageWithholding,
      '25d': withholding,
      '26': estimated,
      '27a': eic,
      '28': actc,
      '29': aotc,
      '31': irsDollars(input.refundableCredits ?? 0),
      '32': refundable,
      '33': payments,
      '34': Math.max(0, payments - totalTax),
      '35a': Math.max(0, payments - totalTax),
      '37': Math.max(0, totalTax - payments),
    },
  };
}
