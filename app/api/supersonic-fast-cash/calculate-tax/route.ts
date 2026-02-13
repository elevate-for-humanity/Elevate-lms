import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const taxReturn = await request.json();

    // Calculate total income
    const w2Wages = taxReturn.w2Income?.reduce((sum: number, w2: any) => sum + (w2.wages || 0), 0) || 0;
    const totalIncome = w2Wages;

    // Calculate deductions
    let deduction = 0;
    if (taxReturn.deductionType === 'standard') {
      // Standard deduction amounts for 2024
      if (taxReturn.filingStatus === 'single') deduction = 14600;
      else if (taxReturn.filingStatus === 'married_joint') deduction = 29200;
      else if (taxReturn.filingStatus === 'married_separate') deduction = 14600;
      else if (taxReturn.filingStatus === 'head_of_household') deduction = 21900;
      else if (taxReturn.filingStatus === 'qualifying_widow') deduction = 29200;
    } else if (taxReturn.deductionType === 'itemized') {
      const itemized = taxReturn.itemizedDeductions || {};
      deduction = (
        (itemized.mortgageInterest || 0) +
        (itemized.propertyTax || 0) +
        (itemized.charitableContributions || 0) +
        (itemized.medicalExpenses || 0) +
        Math.min((itemized.stateLocalTaxes || 0), 10000)
      );
    }

    // Calculate taxable income
    const taxableIncome = Math.max(0, totalIncome - deduction);

    // Calculate federal tax using 2024 tax brackets
    let federalTax = 0;
    if (taxReturn.filingStatus === 'single') {
      if (taxableIncome <= 11600) {
        federalTax = taxableIncome * 0.10;
      } else if (taxableIncome <= 47150) {
        federalTax = 1160 + (taxableIncome - 11600) * 0.12;
      } else if (taxableIncome <= 100525) {
        federalTax = 5426 + (taxableIncome - 47150) * 0.22;
      } else if (taxableIncome <= 191950) {
        federalTax = 17168.50 + (taxableIncome - 100525) * 0.24;
      } else if (taxableIncome <= 243725) {
        federalTax = 39110.50 + (taxableIncome - 191950) * 0.32;
      } else if (taxableIncome <= 609350) {
        federalTax = 55678.50 + (taxableIncome - 243725) * 0.35;
      } else {
        federalTax = 183647.25 + (taxableIncome - 609350) * 0.37;
      }
    } else if (taxReturn.filingStatus === 'married_joint') {
      if (taxableIncome <= 23200) {
        federalTax = taxableIncome * 0.10;
      } else if (taxableIncome <= 94300) {
        federalTax = 2320 + (taxableIncome - 23200) * 0.12;
      } else if (taxableIncome <= 201050) {
        federalTax = 10852 + (taxableIncome - 94300) * 0.22;
      } else if (taxableIncome <= 383900) {
        federalTax = 34337 + (taxableIncome - 201050) * 0.24;
      } else if (taxableIncome <= 487450) {
        federalTax = 78221 + (taxableIncome - 383900) * 0.32;
      } else if (taxableIncome <= 731200) {
        federalTax = 111357 + (taxableIncome - 487450) * 0.35;
      } else {
        federalTax = 196669.50 + (taxableIncome - 731200) * 0.37;
      }
    }

    // Calculate credits
    let totalCredits = 0;
    if (taxReturn.hasChildTaxCredit) {
      totalCredits += (taxReturn.dependents?.length || 0) * 2000;
    }
    if (taxReturn.hasEITC) {
      // Simplified EITC calculation
      const numChildren = taxReturn.dependents?.length || 0;
      if (numChildren === 0 && totalIncome < 17640) totalCredits += 600;
      else if (numChildren === 1 && totalIncome < 46560) totalCredits += 3995;
      else if (numChildren === 2 && totalIncome < 52918) totalCredits += 6604;
      else if (numChildren >= 3 && totalIncome < 56838) totalCredits += 7430;
    }
    if (taxReturn.hasEducationCredits) {
      totalCredits += 2500; // American Opportunity Credit
    }

    // Calculate withholding
    const federalWithholding = taxReturn.w2Income?.reduce((sum: number, w2: any) => sum + (w2.federalWithholding || 0), 0) || 0;

    // Calculate refund or owed
    const taxAfterCredits = Math.max(0, federalTax - totalCredits);
    const estimatedRefund = federalWithholding - taxAfterCredits;

    return NextResponse.json({
      success: true,
      totalIncome,
      deduction,
      taxableIncome,
      federalTax,
      totalCredits,
      taxAfterCredits,
      federalWithholding,
      estimatedRefund: Math.round(estimatedRefund),
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    );
  }
}
