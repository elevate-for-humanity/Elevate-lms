import type { FilingStatus } from './ty2026-base-1040';
import { irsDollars } from './federal-1040-2026';
const money = (value: number) => {
  if (!Number.isFinite(value) || value < 0) throw new Error('Invalid credit input');
  return value;
};
const count = (value: number) => {
  if (!Number.isInteger(value) || value < 0) throw new Error('Invalid qualifying-person count');
  return value;
};
export function childCredits2026(input: {
  qualifyingChildren: number;
  otherDependents: number;
  modifiedAgi: number;
  earnedIncome: number;
  availableTax: number;
  filingStatus: FilingStatus;
  ssnRequirementsMet: boolean;
  foreignEarnedIncomeExcluded?: boolean;
  threeChildPayrollAlternative?: number;
}) {
  const children = count(input.qualifyingChildren),
    others = count(input.otherDependents);
  const available = money(input.availableTax),
    earned = money(input.earnedIncome),
    magi = money(input.modifiedAgi);
  if (!input.ssnRequirementsMet)
    return { nonrefundable: 0, additionalChildTaxCredit: 0, maximumAfterPhaseout: 0 };
  const threshold = input.filingStatus === 'married_joint' ? 400000 : 200000;
  const reduction = Math.ceil(Math.max(0, magi - threshold) / 1000) * 50;
  const potential = Math.max(0, children * 2200 + others * 500 - reduction);
  const nonrefundable = Math.min(potential, irsDollars(available));
  const unused = Math.min(children * 2200, Math.max(0, potential - nonrefundable));
  const incomeAmount = Math.max(0, earned - 2500) * 0.15;
  const alternative = children >= 3 ? money(input.threeChildPayrollAlternative ?? 0) : 0;
  const refundable = input.foreignEarnedIncomeExcluded
    ? 0
    : Math.min(unused, children * 1700, irsDollars(Math.max(incomeAmount, alternative)));
  return { nonrefundable, additionalChildTaxCredit: refundable, maximumAfterPhaseout: potential };
}
const EIC_2026 = [
  {
    max: 664,
    rate: 0.0765,
    outRate: 0.0765,
    start: 10860,
    jointStart: 18140,
    end: 19540,
    jointEnd: 26820,
  },
  {
    max: 4427,
    rate: 0.34,
    outRate: 0.1598,
    start: 23890,
    jointStart: 31160,
    end: 51593,
    jointEnd: 58863,
  },
  {
    max: 7316,
    rate: 0.4,
    outRate: 0.2106,
    start: 23890,
    jointStart: 31160,
    end: 58629,
    jointEnd: 65899,
  },
  {
    max: 8231,
    rate: 0.45,
    outRate: 0.2106,
    start: 23890,
    jointStart: 31160,
    end: 62974,
    jointEnd: 70244,
  },
];
export function earnedIncomeCredit2026(input: {
  earnedIncome: number;
  adjustedGrossIncome: number;
  investmentIncome: number;
  qualifyingChildren: number;
  filingStatus: FilingStatus;
  eligibilityRequirementsMet: boolean;
  separatedSpouseException?: boolean;
}) {
  const earned = money(input.earnedIncome),
    agi = Math.max(0, input.adjustedGrossIncome);
  if (!Number.isFinite(agi)) throw new Error('Invalid AGI');
  const children = count(input.qualifyingChildren);
  money(input.investmentIncome);
  if (
    !input.eligibilityRequirementsMet ||
    input.investmentIncome > 12200 ||
    (input.filingStatus === 'married_separate' && !input.separatedSpouseException) ||
    earned === 0
  )
    return 0;
  const c = EIC_2026[Math.min(3, children)],
    joint = input.filingStatus === 'married_joint';
  if (Math.max(earned, agi) >= (joint ? c.jointEnd : c.end)) return 0;
  const earnedMid = Math.floor(earned / 50) * 50 + 25,
    agiMid = Math.floor(agi / 50) * 50 + 25;
  const phaseIn = Math.min(c.max, earnedMid * c.rate);
  const phaseOut =
    c.max - Math.max(0, Math.max(earnedMid, agiMid) - (joint ? c.jointStart : c.start)) * c.outRate;
  return irsDollars(Math.max(0, Math.min(phaseIn, phaseOut)));
}
export function educationCredits2026(input: {
  qualifiedAmericanOpportunityExpenses: number[];
  lifetimeLearningExpenses: number;
  modifiedAgi: number;
  filingStatus: FilingStatus;
  aotcEligible: boolean;
  llcEligible: boolean;
  refundableAotcEligible: boolean;
}) {
  const magi = money(input.modifiedAgi),
    joint = input.filingStatus === 'married_joint';
  if (input.filingStatus === 'married_separate') return { nonrefundable: 0, refundable: 0 };
  const phaseout = Math.max(
    0,
    Math.min(1, ((joint ? 180000 : 90000) - magi) / (joint ? 20000 : 10000)),
  );
  const aotc = input.aotcEligible
    ? input.qualifiedAmericanOpportunityExpenses.reduce(
        (sum, expense) =>
          sum + Math.min(2000, money(expense)) + Math.min(2000, Math.max(0, expense - 2000)) * 0.25,
        0,
      ) * phaseout
    : 0;
  const llc = input.llcEligible
    ? Math.min(10000, money(input.lifetimeLearningExpenses)) * 0.2 * phaseout
    : 0;
  const refundable = input.refundableAotcEligible ? irsDollars(aotc * 0.4) : 0;
  return { nonrefundable: irsDollars(aotc + llc) - refundable, refundable };
}
/** 2026 expanded rate under IRC 21; qualifying expenses still capped at $3,000/$6,000. */
export function dependentCareCredit2026(input: {
  qualifyingPeople: number;
  qualifiedExpenses: number;
  excludedBenefits: number;
  primaryEarnedIncome: number;
  spouseEarnedIncome?: number;
  adjustedGrossIncome: number;
  filingStatus: FilingStatus;
  eligibilityRequirementsMet: boolean;
}) {
  const people = count(input.qualifyingPeople),
    agi = money(input.adjustedGrossIncome);
  const expenses = money(input.qualifiedExpenses),
    benefits = money(input.excludedBenefits),
    earned = money(input.primaryEarnedIncome);
  if (!people || !input.eligibilityRequirementsMet)
    return { qualifiedExpenses: 0, rate: 0, credit: 0 };
  const limit = people === 1 ? 3000 : 6000;
  const qualified = Math.max(
    0,
    Math.min(
      Math.max(0, expenses - benefits),
      Math.max(0, limit - benefits),
      earned,
      input.filingStatus === 'married_joint' ? money(input.spouseEarnedIncome ?? 0) : earned,
    ),
  );
  let rate = Math.max(0.35, 0.5 - Math.ceil(Math.max(0, agi - 15000) / 2000) * 0.01);
  const secondThreshold = input.filingStatus === 'married_joint' ? 150000 : 75000;
  rate = Math.max(0.2, rate - Math.ceil(Math.max(0, agi - secondThreshold) / 2000) * 0.01);
  return {
    qualifiedExpenses: qualified,
    rate: Math.round(rate * 100) / 100,
    credit: irsDollars(qualified * rate),
  };
}
