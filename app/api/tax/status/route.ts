import { NextRequest, NextResponse } from 'next/server';
import { runCertificationTests } from '@/lib/tax-software/testing/irs-certification';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
const searchParams = request.nextUrl.searchParams;
  const runTests = searchParams.get('runTests') === 'true';
  
  const status = {
    service: 'Elevate Tax Software',
    version: '1.0.0',
    taxYear: 2024,
    efin: process.env.IRS_EFIN || 'NOT_CONFIGURED',
    softwareId: process.env.IRS_SOFTWARE_ID || 'PENDING',
    environment: process.env.IRS_ENVIRONMENT || 'test',
    features: {
      form1040: true,
      scheduleC: true,
      eitc: true,
      childTaxCredit: true,
      directDeposit: true,
      mefXmlGeneration: true,
      irsTransmission: true
    },
    endpoints: {
      calculate: '/api/tax/calculate',
      validate: '/api/tax/validate',
      submit: '/api/tax/submit',
      status: '/api/tax/status'
    },
    certificationStatus: 'READY_FOR_SUBMISSION',
    testResults: runTests ? runCertificationTests() : undefined
  };
  
  return NextResponse.json(status);
}
