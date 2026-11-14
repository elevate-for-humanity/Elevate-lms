import { describe, it, expect } from 'vitest';
import { prepareFederalReturn2026 } from '@/lib/tax-software/calculation/prepare-federal-return';
import {
  childCredits2026,
  earnedIncomeCredit2026,
  educationCredits2026,
  dependentCareCredit2026,
} from '@/lib/tax-software/calculation/credits-2026';
describe('2026 credits', () => {
  it('uses actual payroll withholding for the three-child alternative', () => {
    const prepared = prepareFederalReturn2026(
      {
        filingStatus: 'single',
        wages: [
          { wages: 2500, federalWithholding: 0, socialSecurityTax: 155, medicareTaxWithheld: 36 },
        ],
      },
      {
        childCreditInputs: { qualifyingChildren: 3, otherDependents: 0, ssnRequirementsMet: true },
      },
    );
    expect(prepared.calculation.lines['28']).toBe(191);
  });
  it('caps refundable child credit at the earned-income and per-child limits', () => {
    const r = childCredits2026({
      qualifyingChildren: 2,
      otherDependents: 0,
      modifiedAgi: 20000,
      earnedIncome: 20000,
      availableTax: 0,
      filingStatus: 'single',
      ssnRequirementsMet: true,
    });
    expect(r.nonrefundable).toBe(0);
    expect(r.additionalChildTaxCredit).toBe(2625);
  });
  it('phases child credit out by fifty dollars for each started thousand', () => {
    expect(
      childCredits2026({
        qualifyingChildren: 1,
        otherDependents: 0,
        modifiedAgi: 200001,
        earnedIncome: 200001,
        availableTax: 10000,
        filingStatus: 'single',
        ssnRequirementsMet: true,
      }).nonrefundable,
    ).toBe(2150);
  });
  it('uses the 2026 EIC maximum and investment-income restriction', () => {
    expect(
      earnedIncomeCredit2026({
        earnedIncome: 20000,
        adjustedGrossIncome: 20000,
        investmentIncome: 0,
        qualifyingChildren: 3,
        filingStatus: 'single',
        eligibilityRequirementsMet: true,
      }),
    ).toBe(8231);
    expect(
      earnedIncomeCredit2026({
        earnedIncome: 20000,
        adjustedGrossIncome: 20000,
        investmentIncome: 12201,
        qualifyingChildren: 3,
        filingStatus: 'single',
        eligibilityRequirementsMet: true,
      }),
    ).toBe(0);
  });
  it('separates refundable AOTC and avoids refunding lifetime-learning credit', () => {
    const r = educationCredits2026({
      qualifiedAmericanOpportunityExpenses: [4000],
      lifetimeLearningExpenses: 10000,
      modifiedAgi: 20000,
      filingStatus: 'single',
      aotcEligible: true,
      llcEligible: true,
      refundableAotcEligible: true,
    });
    expect(r.refundable).toBe(1000);
    expect(r.nonrefundable).toBe(3500);
  });
  it('uses the expanded 2026 dependent-care rate and subtracts excluded benefits', () => {
    const r = dependentCareCredit2026({
      qualifyingPeople: 1,
      qualifiedExpenses: 2000,
      excludedBenefits: 1000,
      primaryEarnedIncome: 15000,
      adjustedGrossIncome: 15000,
      filingStatus: 'single',
      eligibilityRequirementsMet: true,
    });
    expect(r.qualifiedExpenses).toBe(1000);
    expect(r.credit).toBe(500);
  });
});
