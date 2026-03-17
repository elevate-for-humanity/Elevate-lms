import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { validateTaxReturn } from '@/lib/tax-software/validation/irs-rules';
import { createMeFSubmission } from '@/lib/tax-software/mef/xml-generator';
import { createTransmitter } from '@/lib/tax-software/mef/transmission';
import { validateAgainstXsd } from '@/lib/tax-software/schemas/schema-validator';
import { TaxReturn } from '@/lib/tax-software/types';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { assertRuntimeReadyForSubmission } from '@/lib/tax-software/config/runtime-readiness';

async function _POST(request: NextRequest) {
  try {
    // Hard-block if runtime is not ready (missing EFIN, schemas, xmllint)
    try {
      assertRuntimeReadyForSubmission();
    } catch (error) {
      const issues =
        error && typeof error === "object" && "issues" in error
          ? (error as { issues: unknown }).issues
          : [];
      return NextResponse.json(
        {
          ok: false,
          code: "MEF_RUNTIME_NOT_READY",
          message: "Submission blocked because the MeF runtime is not fully configured.",
          issues,
        },
        { status: 503 }
      );
    }

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
      priorYearAGI: body.priorYearAGI,
      ipPin: body.ipPin,
      spouseIpPin: body.spouseIpPin,
      taxpayerSignature: body.taxpayerSignature,
      spouseSignature: body.spouseSignature,
      preparerSignature: body.preparerSignature
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
    
    // IRS_SOFTWARE_ID is assigned after ATS certification.
    // Falls back to 'PENDING' until IRS issues the identifier.
    const softwareId = process.env.IRS_SOFTWARE_ID || 'PENDING';

    // Create MeF submission
    const submission = createMeFSubmission(taxReturn, softwareId);

    // XSD validation via xmllint — assertRuntimeReadyForSubmission above guarantees
    // schemas and xmllint are present before we reach this point.
    const tmpXml = `/tmp/mef-${submission.submissionId}.xml`;
    const fs = await import('node:fs/promises');
    await fs.writeFile(tmpXml, submission.xmlContent, 'utf-8');
    let xsdResult;
    try {
      xsdResult = validateAgainstXsd(tmpXml);
    } finally {
      await fs.unlink(tmpXml).catch(() => {});
    }
    if (!xsdResult.valid) {
      logger.error('MeF XML schema validation failed:', xsdResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'XML schema validation failed. Return cannot be transmitted.',
          schemaErrors: xsdResult.errors,
        },
        { status: 422 }
      );
    }
    
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
