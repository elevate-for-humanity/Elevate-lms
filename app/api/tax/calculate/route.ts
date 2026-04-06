import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { calculateForm1040, getStandardDeduction } from '@/lib/tax-software/forms/form-1040';
import { TaxReturn } from '@/lib/tax-software/types';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { auditPiiAccess } from '@/lib/auditLog';
import { apiAuthGuard } from '@/lib/admin/guards';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await apiAuthGuard(request);
    if (auth.error) return auth.error;

    await auditPiiAccess({ action: 'PII_ACCESS', entity: 'pii', req: request, metadata: { route: '/api/tax/calculate' } });

    const body = await request.json();
    
    // Build tax return from request
    const taxReturn: TaxReturn = {
      taxYear: body.taxYear || 2024,
      efin: process.env.IRS_EFIN || '000000',
      returnId: `CALC${Date.now()}`,
      filingStatus: body.filingStatus || 'single',
      taxpayer: body.taxpayer || {
        firstName: '',
        lastName: '',
        ssn: '',
        dateOfBirth: ''
      },
      address: body.address || {
        street: '',
        city: '',
        state: '',
        zip: ''
      },
      dependents: body.dependents || [],
      w2Income: body.w2Income || [],
      form1099INT: body.form1099INT,
      form1099DIV: body.form1099DIV,
      scheduleCBusiness: body.scheduleCBusiness,
      deductionType: body.deductionType || 'standard',
      itemizedDeductions: body.itemizedDeductions,
      totalIncome: 0,
      adjustedGrossIncome: 0,
      taxableIncome: 0,
      taxBeforeCredits: 0,
      credits: {
        childTaxCredit: 0,
        creditForOtherDependents: 0,
        earnedIncomeCredit: 0,
        additionalChildTaxCredit: 0
      },
      totalCredits: 0,
      federalWithholding: 0,
      totalTax: 0,
      totalPayments: 0
    };
    
    // Calculate Form 1040
    const result = calculateForm1040(taxReturn);
    
    return NextResponse.json({
      success: true,
      calculation: {
        totalIncome: result.line9,
        adjustedGrossIncome: result.line11,
        standardDeduction: result.line12,
        taxableIncome: result.line15,
        taxBeforeCredits: result.line18,
        totalCredits: result.line22,
        totalTax: result.line25,
        totalPayments: result.line33,
        refund: result.line35,
        amountOwed: result.line37,
        eitc: result.line28,
        childTaxCredit: result.line19,
        additionalChildTaxCredit: result.line29
      },
      lines: result
    });
  } catch (error) {
    logger.error('Tax calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate tax' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
// Return standard deductions for reference
  return NextResponse.json({
    taxYear: 2024,
    standardDeductions: {
      single: getStandardDeduction('single'),
      married_filing_jointly: getStandardDeduction('married_filing_jointly'),
      married_filing_separately: getStandardDeduction('married_filing_separately'),
      head_of_household: getStandardDeduction('head_of_household'),
      qualifying_surviving_spouse: getStandardDeduction('qualifying_surviving_spouse')
    }
  });
}
