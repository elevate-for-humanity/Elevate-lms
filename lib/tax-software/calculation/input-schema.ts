import { z } from 'zod';
const amount = z.number().finite().nonnegative().max(1_000_000_000).optional();
const signed = z.number().finite().min(-1_000_000_000).max(1_000_000_000).optional();
export const federalInputSchema = z
  .object({
    additionalInterest: amount,
    additionalOrdinaryDividends: amount,
    qualifiedDividends: amount,
    taxExemptInterest: amount,
    shortTermGainLoss: signed,
    longTermGainLoss: signed,
    taxableIraDistributions: amount,
    taxablePensions: amount,
    socialSecurityBenefits: amount,
    otherSchedule1Income: signed,
    adjustments: amount,
    itemizedDeductions: amount,
    additionalDeductions: amount,
    nonItemizerQualifiedContributions: amount,
    qualifiedBusinessIncomeDeduction: amount,
    nonrefundableCredits: amount,
    refundableCredits: amount,
    schedule2Part1Tax: amount,
    otherSchedule2Taxes: amount,
    estimatedPayments: amount,
    otherWithholding: amount,
    additionalMedicareWithholding: amount,
    netInvestmentIncome: amount,
    claimedAsDependent: z.boolean().optional(),
    mustItemize: z.boolean().optional(),
    marriedSeparateLivedWithSpouse: z.boolean().optional(),
    additionalStandardDeductionBoxes: z.number().int().min(0).max(4).optional(),
    childCreditInputs: z
      .object({
        qualifyingChildren: z.number().int().min(0).max(20),
        otherDependents: z.number().int().min(0).max(20),
        ssnRequirementsMet: z.boolean(),
        foreignEarnedIncomeExcluded: z.boolean().optional(),
      })
      .strict()
      .optional(),
    eicInputs: z
      .object({
        qualifyingChildren: z.number().int().min(0).max(20),
        eligibilityRequirementsMet: z.boolean(),
        investmentIncome: z.number().finite().nonnegative(),
        separatedSpouseException: z.boolean().optional(),
      })
      .strict()
      .optional(),
    educationCreditInputs: z
      .object({
        qualifiedAmericanOpportunityExpenses: z.array(z.number().finite().nonnegative()).max(20),
        lifetimeLearningExpenses: z.number().finite().nonnegative(),
        aotcEligible: z.boolean(),
        llcEligible: z.boolean(),
        refundableAotcEligible: z.boolean(),
      })
      .strict()
      .optional(),
    dependentCareInputs: z
      .object({
        qualifyingPeople: z.number().int().min(0).max(20),
        qualifiedExpenses: z.number().finite().nonnegative(),
        excludedBenefits: z.number().finite().nonnegative(),
        primaryEarnedIncome: z.number().finite().nonnegative(),
        spouseEarnedIncome: z.number().finite().nonnegative().optional(),
        eligibilityRequirementsMet: z.boolean(),
      })
      .strict()
      .optional(),
    selfEmployment: z
      .array(
        z.object({
          owner: z.enum(['primary', 'spouse']).optional(),
          netProfit: z.number().finite(),
          socialSecurityWages: amount,
        }),
      )
      .max(20)
      .optional(),
  })
  .strict();
export type SavedFederalInputs = z.infer<typeof federalInputSchema>;
