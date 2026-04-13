// PUBLIC ROUTE: v1 health check
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
// AUTH: Intentionally public — no authentication required

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
export const GET = withApiAudit('/api/v1/health', _GET);
