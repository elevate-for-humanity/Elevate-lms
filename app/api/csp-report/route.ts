import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * CSP violation report endpoint.
 * Receives Content-Security-Policy violation reports from browsers.
 */
async function _POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.warn('CSP violation report', {
      blockedUri: body['csp-report']?.['blocked-uri'] || body?.blockedURL,
      violatedDirective: body['csp-report']?.['violated-directive'] || body?.effectiveDirective,
      documentUri: body['csp-report']?.['document-uri'] || body?.documentURL,
      sourceFile: body['csp-report']?.['source-file'] || body?.sourceFile,
    });
  } catch {
    // Silently accept malformed reports
  }

  return new NextResponse(null, { status: 204 });
}
export const POST = withApiAudit('/api/csp-report', _POST);
