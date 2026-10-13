import { calculateFederal1040_2026, type Federal1040Input } from './federal-1040-2026';
import {
  childCredits2026,
  earnedIncomeCredit2026,
  educationCredits2026,
  dependentCareCredit2026,
} from './credits-2026';
import type { SavedFederalInputs } from './input-schema';
export function prepareFederalReturn2026(base: Federal1040Input, extras: SavedFederalInputs) {
  const preliminary = calculateFederal1040_2026(base),
    magi = Math.max(0, preliminary.adjustedGrossIncome);
  const education = extras.educationCreditInputs
    ? educationCredits2026({
        ...extras.educationCreditInputs,
        modifiedAgi: magi,
        filingStatus: base.filingStatus,
      })
    : { nonrefundable: 0, refundable: 0 };
  const care = extras.dependentCareInputs
    ? dependentCareCredit2026({
        ...extras.dependentCareInputs,
        adjustedGrossIncome: magi,
        filingStatus: base.filingStatus,
      })
    : { credit: 0 };
  const earned = Math.max(
    0,
    base.wages.reduce((s, w) => s + w.wages, 0) +
      (base.selfEmployment ?? []).reduce((s, b) => s + b.netProfit, 0) -
      preliminary.selfEmploymentDeduction,
  );
  const eic = extras.eicInputs
    ? earnedIncomeCredit2026({
        ...extras.eicInputs,
        earnedIncome: earned,
        adjustedGrossIncome: preliminary.adjustedGrossIncome,
        filingStatus: base.filingStatus,
      })
    : 0;
  const otherNonref = (base.nonrefundableCredits ?? 0) + education.nonrefundable + care.credit;
  const child = extras.childCreditInputs
    ? childCredits2026({
        ...extras.childCreditInputs,
        modifiedAgi: magi,
        earnedIncome: earned,
        availableTax: Math.max(
          0,
          preliminary.incomeTax + (base.schedule2Part1Tax ?? 0) - otherNonref,
        ),
        filingStatus: base.filingStatus,
      })
    : { nonrefundable: 0, additionalChildTaxCredit: 0 };
  const financial = {
    ...base,
    nonrefundableCredits: otherNonref,
    childTaxCredit: child.nonrefundable,
    earnedIncomeCredit: eic,
    additionalChildTaxCredit: child.additionalChildTaxCredit,
    refundableAmericanOpportunityCredit: education.refundable,
  };
  return {
    financial,
    calculation: calculateFederal1040_2026(financial),
    supportingCreditCalculations: { education, dependentCare: care, child, eic },
  };
}
