import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { validateTaxReturn, validateSSN, validateEIN, validateRoutingNumber } from '@/lib/tax-software/validation/irs-rules';
import { TaxReturn } from '@/lib/tax-software/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If just validating a single field
    if (body.field) {
      switch (body.field) {
        case 'ssn':
          return NextResponse.json({
            valid: validateSSN(body.value),
            field: 'ssn'
          });
        case 'ein':
          return NextResponse.json({
            valid: validateEIN(body.value),
            field: 'ein'
          });
        case 'routingNumber':
          return NextResponse.json({
            valid: validateRoutingNumber(body.value),
            field: 'routingNumber'
          });
        default:
          return NextResponse.json({ valid: true, field: body.field });
      }
    }
    
    // Full return validation
    const taxReturn: TaxReturn = {
      taxYear: body.taxYear || 2024,
      efin: process.env.IRS_EFIN || '000000',
      returnId: `VAL${Date.now()}`,
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
      spouse: body.spouse,
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
      totalPayments: 0,
      taxpayerSignature: body.taxpayerSignature,
      spouseSignature: body.spouseSignature
    };
    
    const validation = validateTaxReturn(taxReturn);
    
    return NextResponse.json({
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    });
  } catch (error) {
    logger.error('Validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
