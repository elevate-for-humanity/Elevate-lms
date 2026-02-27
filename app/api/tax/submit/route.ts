import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { validateTaxReturn } from '@/lib/tax-software/validation/irs-rules';
import { createMeFSubmission } from '@/lib/tax-software/mef/xml-generator';
import { createTransmitter } from '@/lib/tax-software/mef/transmission';
import { TaxReturn } from '@/lib/tax-software/types';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    
    // Build complete tax return
    const taxReturn: TaxReturn = {
      taxYear: body.taxYear || 2024,
      efin: process.env.IRS_EFIN || '000000',
      returnId: `RET${Date.now()}`,
      filingStatus: body.filingStatus,
      taxpayer: body.taxpayer,
      address: body.address,
      spouse: body.spouse,
      dependents: body.dependents || [],
      w2Income: body.w2Income || [],
      form1099INT: body.form1099INT,
      form1099DIV: body.form1099DIV,
      form1099MISC: body.form1099MISC,
      form1099NEC: body.form1099NEC,
      scheduleCBusiness: body.scheduleCBusiness,
      deductionType: body.deductionType || 'standard',
      itemizedDeductions: body.itemizedDeductions,
      adjustments: body.adjustments,
      totalIncome: body.totalIncome || 0,
      adjustedGrossIncome: body.adjustedGrossIncome || 0,
      taxableIncome: body.taxableIncome || 0,
      taxBeforeCredits: body.taxBeforeCredits || 0,
      credits: body.credits || {
        childTaxCredit: 0,
        creditForOtherDependents: 0,
        earnedIncomeCredit: 0,
        additionalChildTaxCredit: 0
      },
      totalCredits: body.totalCredits || 0,
      federalWithholding: body.federalWithholding || 0,
      estimatedTaxPayments: body.estimatedTaxPayments,
      totalTax: body.totalTax || 0,
      totalPayments: body.totalPayments || 0,
      refundAmount: body.refundAmount,
      amountOwed: body.amountOwed,
      directDeposit: body.directDeposit,
      taxpayerSignature: body.taxpayerSignature,
      spouseSignature: body.spouseSignature
    };
    
    // Validate the return
    const validation = validateTaxReturn(taxReturn);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      }, { status: 400 });
    }
    
    // Create MeF submission
    const softwareId = process.env.IRS_SOFTWARE_ID || 'PENDING';
    const submission = createMeFSubmission(taxReturn, softwareId);
    
    // Transmit to IRS (test mode by default)
    const transmitter = createTransmitter({
      softwareId,
      environment: (process.env.IRS_ENVIRONMENT as 'test' | 'production') || 'test'
    });
    
    const result = await transmitter.transmit({
      submissionId: submission.submissionId,
      taxYear: submission.taxYear,
      submissionType: submission.submissionType,
      xmlContent: submission.xmlContent
    });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        submissionId: result.submissionId,
        transmittedAt: result.transmittedAt,
        acknowledgment: result.acknowledgment,
        message: 'Return successfully transmitted to IRS'
      });
    } else {
      return NextResponse.json({
        success: false,
        submissionId: result.submissionId,
        error: result.error,
        message: 'Failed to transmit return to IRS'
      }, { status: 500 });
    }
  } catch (error) {
    logger.error('Tax submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit tax return' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/tax/submit', _POST);
