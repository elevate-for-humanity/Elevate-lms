// PUBLIC ROUTE: CSP violation reports sent by browsers — no auth possible
// No audit logging: this endpoint is browser telemetry, high-frequency by design.
// Audit DB writes here would generate one insert per page load per user, creating
// unnecessary load and drowning real audit events in noise.
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const body = await request.json();
    // Sample at 10% — CSP reports are noisy and most are benign extension conflicts.
    if (Math.random() < 0.1) {
      logger.warn('CSP violation report', {
        blockedUri: body['csp-report']?.['blocked-uri'] || body?.blockedURL,
        violatedDirective: body['csp-report']?.['violated-directive'] || body?.effectiveDirective,
        documentUri: body['csp-report']?.['document-uri'] || body?.documentURL,
        sourceFile: body['csp-report']?.['source-file'] || body?.sourceFile,
      });
    }
  } catch {
    // Silently accept malformed reports
  }

  return new NextResponse(null, { status: 204 });
}
