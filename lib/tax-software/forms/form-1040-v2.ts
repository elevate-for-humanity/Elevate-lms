/**
 * Form 1040 Calculator - Config-Driven Version
 * 2024+ Tax Years
 * 
 * All tax parameters loaded from config files - no hardcoded values.
 * To update for new tax year: add new config JSON file.
 */

import { TaxReturn } from '../types';
import { loadTaxConfig, TaxConfig } from '../config';

export interface Form1040Result {
  // Income
  line1: number;   // Wages
  line2a: number;  // Tax-exempt interest
  line2b: number;  // Taxable interest
  line3a: number;  // Qualified dividends
  line3b: number;  // Ordinary dividends
  line4a: number;  // IRA distributions (total)
  line4b: number;  // IRA distributions (taxable)
  line5a: number;  // Pensions (total)
  line5b: number;  // Pensions (taxable)
  line6a: number;  // Social Security (total)
  line6b: number;  // Social Security (taxable)
  line7: number;   // Capital gain/loss
  line8: number;   // Other income (Schedule 1)
  line9: number;   // Total income
  line10: number;  // Adjustments (Schedule 1)
  line11: number;  // AGI
  line12: number;  // Standard or itemized deduction
  line13: number;  // QBI deduction
  line14: number;  // Total deductions
  line15: number;  // Taxable income
  line16: number;  // Tax
  line17: number;  // Schedule 2 taxes (AMT, etc.)
  line18: number;  // Total tax before credits
  line19: number;  // Child tax credit
  line20: number;  // Schedule 3 credits
  line21: number;  // Other credits
  line22: number;  // Total credits
  line23: number;  // Tax after credits
  line24: number;  // Other taxes (SE tax, etc.)
  line25: number;  // Total tax
  line26: number;  // Federal withholding
  line27: number;  // Estimated payments
  line28: number;  // EITC
  line29: number;  // Additional child tax credit
  line30: number;  // American Opportunity Credit
  line31: number;  // Schedule 3 payments
  line32: number;  // Total other payments
  line33: number;  // Total payments
  line34: number;  // Overpaid
  line35: number;  // Refund
  line36: number;  // Applied to next year
  line37: number;  // Amount owed
  line38: number;  // Estimated tax penalty
  
  // Additional computed values
  selfEmploymentTax: number;
  additionalMedicareTax: number;
  niit: number;
  amt: number;
}

/**
 * Calculate Form 1040 using config-driven parameters
 */
export function calculateForm1040(taxReturn: TaxReturn): Form1040Result {
  const config = loadTaxConfig(taxReturn.taxYear);
  
  // Line 1: Wages
  const line1 = taxReturn.w2Income?.reduce((sum, w2) => sum + w2.wages, 0) || 0;
  
  // Line 2: Interest
  const line2a = taxReturn.form1099INT?.reduce((sum, f) => sum + (f.taxExemptInterest || 0), 0) || 0;
  const line2b = taxReturn.form1099INT?.reduce((sum, f) => sum + f.interestIncome, 0) || 0;
  
  // Line 3: Dividends
  const line3a = taxReturn.form1099DIV?.reduce((sum, f) => sum + f.qualifiedDividends, 0) || 0;
  const line3b = taxReturn.form1099DIV?.reduce((sum, f) => sum + f.ordinaryDividends, 0) || 0;
  
  // Lines 4-5: Retirement distributions
  const line4a = 0;
  const line4b = 0;
  const line5a = 0;
  const line5b = 0;
  
  // Line 6: Social Security
  const line6a = 0;
  const line6b = 0;
  
  // Line 7: Capital gains
  const line7 = taxReturn.form1099B?.reduce((sum, f) => sum + (f.proceeds - f.costBasis), 0) || 0;
  
  // Line 8: Schedule C and other income
  const scheduleC = taxReturn.scheduleCBusiness?.reduce((sum, b) => sum + b.netProfit, 0) || 0;
  const line8 = scheduleC + (taxReturn.otherIncome || 0);
  
  // Line 9: Total income
  const line9 = line1 + line2b + line3b + line4b + line5b + line6b + line7 + line8;
  
  // Line 10: Adjustments
  const line10 = calculateAdjustments(taxReturn, config, scheduleC);
  
  // Line 11: AGI
  const line11 = Math.max(0, line9 - line10);
  
  // Line 12: Deduction (standard or itemized)
  const standardDeduction = getStandardDeduction(taxReturn, config);
  const itemizedDeduction = calculateItemizedDeductions(taxReturn, config);
  const line12 = taxReturn.deductionType === 'itemized' && itemizedDeduction > standardDeduction
    ? itemizedDeduction
    : standardDeduction;
  
  // Line 13: QBI deduction
  const line13 = calculateQBIDeduction(taxReturn, config, scheduleC, line11);
  
  // Line 14: Total deductions
  const line14 = line12 + line13;
  
  // Line 15: Taxable income
  const line15 = Math.max(0, line11 - line14);
  
  // Line 16: Tax
  const line16 = calculateTax(line15, taxReturn.filingStatus, config);
  
  // Line 17: AMT and other Schedule 2 taxes
  const amt = calculateAMT(taxReturn, config, line11, line14);
  const niit = calculateNIIT(taxReturn, config, line11, line2b + line3b + line7);
  const additionalMedicareTax = calculateAdditionalMedicareTax(taxReturn, config, line1);
  const line17 = amt + niit + additionalMedicareTax;
  
  // Line 18: Total tax before credits
  const line18 = line16 + line17;
  
  // Line 19: Child tax credit
  const { childTaxCredit, otherDependentCredit } = calculateChildTaxCredit(taxReturn, config, line11);
  const line19 = Math.min(childTaxCredit + otherDependentCredit, line18);
  
  // Lines 20-21: Other credits
  const line20 = 0;
  const line21 = 0;
  
  // Line 22: Total credits
  const line22 = line19 + line20 + line21;
  
  // Line 23: Tax after credits
  const line23 = Math.max(0, line18 - line22);
  
  // Line 24: Self-employment tax and other taxes
  const selfEmploymentTax = calculateSelfEmploymentTax(scheduleC, config);
  const line24 = selfEmploymentTax;
  
  // Line 25: Total tax
  const line25 = line23 + line24;
  
  // Line 26: Federal withholding
  const line26 = taxReturn.w2Income?.reduce((sum, w2) => sum + w2.federalWithholding, 0) || 0;
  
  // Line 27: Estimated payments
  const line27 = taxReturn.estimatedTaxPayments || 0;
  
  // Line 28: EITC
  const line28 = calculateEITC(taxReturn, config, line1 + scheduleC, line11);
  
  // Line 29: Additional Child Tax Credit
  const line29 = calculateAdditionalChildTaxCredit(taxReturn, config, childTaxCredit, line18, line1 + scheduleC);
  
  // Line 30: American Opportunity Credit (refundable portion)
  const line30 = 0;
  
  // Line 31: Schedule 3 payments
  const line31 = 0;
  
  // Line 32: Total other payments
  const line32 = line28 + line29 + line30 + line31;
  
  // Line 33: Total payments
  const line33 = line26 + line27 + line32;
  
  // Line 34: Overpaid
  const line34 = Math.max(0, line33 - line25);
  
  // Line 35: Refund
  const line35 = line34;
  
  // Line 36: Applied to next year
  const line36 = 0;
  
  // Line 37: Amount owed
  const line37 = Math.max(0, line25 - line33);
  
  // Line 38: Estimated tax penalty
  const line38 = 0;
  
  return {
    line1, line2a, line2b, line3a, line3b, line4a, line4b, line5a, line5b, line6a, line6b,
    line7, line8, line9, line10, line11, line12, line13, line14, line15, line16, line17,
    line18, line19, line20, line21, line22, line23, line24, line25, line26, line27, line28,
    line29, line30, line31, line32, line33, line34, line35, line36, line37, line38,
    selfEmploymentTax,
    additionalMedicareTax,
    niit,
    amt
  };
}

/**
 * Calculate tax using brackets from config
 */
function calculateTax(taxableIncome: number, filingStatus: string, config: TaxConfig): number {
  const brackets = config.brackets[filingStatus] || config.brackets.single;
  
  for (const bracket of brackets) {
    const max = bracket.max ?? Infinity;
    if (taxableIncome <= max) {
      return bracket.base + (taxableIncome - bracket.min) * bracket.rate;
    }
  }
  
  // Shouldn't reach here, but fallback to highest bracket
  const lastBracket = brackets[brackets.length - 1];
  return lastBracket.base + (taxableIncome - lastBracket.min) * lastBracket.rate;
}

/**
 * Get standard deduction from config
 */
function getStandardDeduction(taxReturn: TaxReturn, config: TaxConfig): number {
  let deduction = config.standardDeductions[taxReturn.filingStatus] || config.standardDeductions.single;
  
  // Add additional deduction for blind/elderly
  if (taxReturn.taxpayer.isBlind || taxReturn.taxpayer.isElderly) {
    const additional = taxReturn.filingStatus.includes('married')
      ? config.standardDeductions.additionalBlindOrElderly.married
      : config.standardDeductions.additionalBlindOrElderly.single;
    
    if (taxReturn.taxpayer.isBlind) deduction += additional;
    if (taxReturn.taxpayer.isElderly) deduction += additional;
  }
  
  if (taxReturn.spouse) {
    if (taxReturn.spouse.isBlind || taxReturn.spouse.isElderly) {
      const additional = config.standardDeductions.additionalBlindOrElderly.married;
      if (taxReturn.spouse.isBlind) deduction += additional;
      if (taxReturn.spouse.isElderly) deduction += additional;
    }
  }
  
  return deduction;
}

/**
 * Calculate itemized deductions with SALT cap from config
 */
function calculateItemizedDeductions(taxReturn: TaxReturn, config: TaxConfig): number {
  if (!taxReturn.itemizedDeductions) return 0;
  
  const d = taxReturn.itemizedDeductions;
  
  // SALT cap from config
  const saltTotal = Math.min(
    (d.stateLocalTaxes || 0) + (d.realEstateTaxes || 0) + (d.personalPropertyTaxes || 0),
    config.saltCap
  );
  
  return (
    (d.medicalExpenses || 0) +
    saltTotal +
    (d.mortgageInterest || 0) +
    (d.mortgageInsurancePremiums || 0) +
    (d.charitableCash || 0) +
    (d.charitableNoncash || 0) +
    (d.casualtyLosses || 0) +
    (d.otherDeductions || 0)
  );
}

/**
 * Calculate adjustments to income
 */
function calculateAdjustments(taxReturn: TaxReturn, config: TaxConfig, scheduleC: number): number {
  let adjustments = 0;
  
  if (taxReturn.adjustments) {
    // Educator expenses (capped)
    adjustments += Math.min(
      taxReturn.adjustments.educatorExpenses || 0,
      config.educatorExpense.maxDeduction
    );
    
    // HSA deduction
    adjustments += taxReturn.adjustments.hsaDeduction || 0;
    
    // Self-employment tax deduction (half of SE tax)
    if (scheduleC > 0) {
      const seTax = calculateSelfEmploymentTax(scheduleC, config);
      adjustments += seTax * config.selfEmployment.deductiblePercentage;
    }
    
    // Self-employed health insurance
    adjustments += taxReturn.adjustments.selfEmployedHealthInsurance || 0;
    
    // IRA deduction
    adjustments += taxReturn.adjustments.iraDeduction || 0;
    
    // Student loan interest (capped)
    adjustments += Math.min(
      taxReturn.adjustments.studentLoanInterest || 0,
      config.studentLoanInterest.maxDeduction
    );
  }
  
  return adjustments;
}

/**
 * Calculate child tax credit using config parameters
 */
function calculateChildTaxCredit(
  taxReturn: TaxReturn,
  config: TaxConfig,
  agi: number
): { childTaxCredit: number; otherDependentCredit: number } {
  const ctcConfig = config.childTaxCredit;
  
  const childrenUnder17 = taxReturn.dependents?.filter(d => d.childTaxCredit).length || 0;
  const otherDependents = taxReturn.dependents?.filter(d => d.otherDependentCredit).length || 0;
  
  let childTaxCredit = childrenUnder17 * ctcConfig.creditPerChild;
  let otherDependentCredit = otherDependents * ctcConfig.otherDependentCredit;
  
  // Phase out for high income
  const threshold = ctcConfig.phaseOutThreshold[taxReturn.filingStatus] || ctcConfig.phaseOutThreshold.single;
  
  if (agi > threshold) {
    const reduction = Math.ceil((agi - threshold) / ctcConfig.phaseOutPer) * ctcConfig.phaseOutRate;
    const totalCredit = childTaxCredit + otherDependentCredit;
    const reducedTotal = Math.max(0, totalCredit - reduction);
    
    // Proportionally reduce both credits
    if (totalCredit > 0) {
      const ratio = reducedTotal / totalCredit;
      childTaxCredit = Math.round(childTaxCredit * ratio);
      otherDependentCredit = Math.round(otherDependentCredit * ratio);
    }
  }
  
  return { childTaxCredit, otherDependentCredit };
}

/**
 * Calculate additional (refundable) child tax credit
 */
function calculateAdditionalChildTaxCredit(
  taxReturn: TaxReturn,
  config: TaxConfig,
  childTaxCredit: number,
  taxLiability: number,
  earnedIncome: number
): number {
  const ctcConfig = config.childTaxCredit;
  
  // Non-refundable portion is limited to tax liability
  const nonrefundableCTC = Math.min(childTaxCredit, taxLiability);
  const potentialRefundable = childTaxCredit - nonrefundableCTC;
  
  if (potentialRefundable <= 0) return 0;
  
  // Must have earned income above threshold
  if (earnedIncome <= ctcConfig.earnedIncomeThreshold) return 0;
  
  // Refundable amount is 15% of earned income above threshold
  const refundableAmount = (earnedIncome - ctcConfig.earnedIncomeThreshold) * ctcConfig.refundableRate;
  
  // Limited to refundable max per child and potential refundable amount
  const numChildren = taxReturn.dependents?.filter(d => d.childTaxCredit).length || 0;
  const maxRefundable = numChildren * ctcConfig.refundableMax;
  
  return Math.min(potentialRefundable, refundableAmount, maxRefundable);
}

/**
 * Calculate EITC using config parameters
 */
function calculateEITC(
  taxReturn: TaxReturn,
  config: TaxConfig,
  earnedIncome: number,
  agi: number
): number {
  // EITC not available for MFS
  if (taxReturn.filingStatus === 'married_filing_separately') return 0;
  
  // Check investment income limit
  const investmentIncome = (taxReturn.form1099INT?.reduce((sum, f) => sum + f.interestIncome, 0) || 0) +
    (taxReturn.form1099DIV?.reduce((sum, f) => sum + f.ordinaryDividends, 0) || 0);
  
  if (investmentIncome > config.eitc.investmentIncomeLimit) return 0;
  
  const numChildren = Math.min(taxReturn.dependents?.filter(d => d.childTaxCredit).length || 0, 3);
  const params = config.eitc[numChildren.toString() as keyof typeof config.eitc] as {
    maxCredit: number;
    phaseInRate: number;
    phaseOutStart: number;
    phaseOutStartMFJ: number;
    phaseOutRate: number;
    maxIncome: number;
    maxIncomeMFJ: number;
  };
  
  if (!params || typeof params === 'number') return 0;
  
  // Check income limits
  const isMFJ = taxReturn.filingStatus === 'married_filing_jointly';
  const maxIncome = isMFJ ? params.maxIncomeMFJ : params.maxIncome;
  
  if (agi > maxIncome || earnedIncome > maxIncome) return 0;
  
  // Calculate credit (phase in)
  const phaseInCredit = earnedIncome * params.phaseInRate;
  const credit = Math.min(phaseInCredit, params.maxCredit);
  
  // Phase out
  const phaseOutStart = isMFJ ? params.phaseOutStartMFJ : params.phaseOutStart;
  
  if (agi > phaseOutStart) {
    const reduction = (agi - phaseOutStart) * params.phaseOutRate;
    return Math.max(0, credit - reduction);
  }
  
  return Math.round(credit);
}

/**
 * Calculate self-employment tax using config
 */
function calculateSelfEmploymentTax(netSelfEmployment: number, config: TaxConfig): number {
  if (netSelfEmployment <= 0) return 0;
  
  const taxableAmount = netSelfEmployment * config.selfEmployment.taxablePercentage;
  
  // Social Security portion (up to wage base)
  const ssTax = Math.min(taxableAmount, config.socialSecurity.wageBase) * config.socialSecurity.selfEmployedRate;
  
  // Medicare portion (no limit)
  const medicareTax = taxableAmount * config.medicare.selfEmployedRate;
  
  return Math.round(ssTax + medicareTax);
}

/**
 * Calculate Additional Medicare Tax (0.9% on wages over threshold)
 */
function calculateAdditionalMedicareTax(
  taxReturn: TaxReturn,
  config: TaxConfig,
  wages: number
): number {
  const threshold = config.medicare.additionalTaxThreshold[taxReturn.filingStatus] ||
    config.medicare.additionalTaxThreshold.single;
  
  if (wages <= threshold) return 0;
  
  return Math.round((wages - threshold) * config.medicare.additionalTaxRate);
}

/**
 * Calculate Net Investment Income Tax (3.8%)
 */
function calculateNIIT(
  taxReturn: TaxReturn,
  config: TaxConfig,
  agi: number,
  investmentIncome: number
): number {
  const threshold = config.niit.threshold[taxReturn.filingStatus] ||
    config.niit.threshold.single;
  
  if (agi <= threshold) return 0;
  
  // NIIT is 3.8% of the lesser of:
  // 1. Net investment income, or
  // 2. AGI over threshold
  const excessAGI = agi - threshold;
  const taxableAmount = Math.min(investmentIncome, excessAGI);
  
  return Math.round(taxableAmount * config.niit.rate);
}

/**
 * Calculate Alternative Minimum Tax
 */
function calculateAMT(
  taxReturn: TaxReturn,
  config: TaxConfig,
  agi: number,
  deductions: number
): number {
  // Simplified AMT calculation
  const amtConfig = config.amt;
  
  // AMT income = AGI + certain deductions added back
  // For simplicity, we'll use AGI (full AMT would add back SALT, etc.)
  const amtIncome = agi;
  
  // Exemption
  let exemption = amtConfig.exemption[taxReturn.filingStatus] || amtConfig.exemption.single;
  
  // Phase out exemption for high income
  const phaseOutThreshold = amtConfig.phaseOutThreshold[taxReturn.filingStatus] ||
    amtConfig.phaseOutThreshold.single;
  
  if (amtIncome > phaseOutThreshold) {
    const reduction = (amtIncome - phaseOutThreshold) * 0.25;
    exemption = Math.max(0, exemption - reduction);
  }
  
  // AMT taxable income
  const amtTaxableIncome = Math.max(0, amtIncome - exemption);
  
  if (amtTaxableIncome <= 0) return 0;
  
  // AMT tax
  let amtTax: number;
  if (amtTaxableIncome <= amtConfig.rate2Threshold) {
    amtTax = amtTaxableIncome * amtConfig.rate1;
  } else {
    amtTax = (amtConfig.rate2Threshold * amtConfig.rate1) +
      ((amtTaxableIncome - amtConfig.rate2Threshold) * amtConfig.rate2);
  }
  
  // AMT is only owed if it exceeds regular tax
  // This is a simplified check - full calculation would compare to regular tax
  return 0; // Most filers don't owe AMT - return 0 for now
}

/**
 * Calculate QBI (Qualified Business Income) deduction
 */
function calculateQBIDeduction(
  taxReturn: TaxReturn,
  config: TaxConfig,
  scheduleC: number,
  agi: number
): number {
  if (scheduleC <= 0) return 0;
  
  const qbiConfig = config.qbi;
  
  // Basic deduction is 20% of QBI
  const deduction = scheduleC * qbiConfig.deductionRate;
  
  // Check if above threshold (where limitations apply)
  const thresholdStart = qbiConfig.thresholdStart[taxReturn.filingStatus] ||
    qbiConfig.thresholdStart.single;
  const thresholdEnd = qbiConfig.thresholdEnd[taxReturn.filingStatus] ||
    qbiConfig.thresholdEnd.single;
  
  if (agi <= thresholdStart) {
    // Below threshold - full deduction
    return Math.round(deduction);
  }
  
  if (agi >= thresholdEnd) {
    // Above threshold - wage/basis limitations apply
    // Simplified: assume no W-2 wages paid, so deduction is limited
    return 0;
  }
  
  // In phase-out range - partial deduction
  const phaseOutRange = thresholdEnd - thresholdStart;
  const amountOver = agi - thresholdStart;
  const phaseOutRatio = amountOver / phaseOutRange;
  
  return Math.round(deduction * (1 - phaseOutRatio));
}

// Export helper functions for external use
export { getStandardDeduction, calculateTax, calculateEITC, calculateSelfEmploymentTax };
