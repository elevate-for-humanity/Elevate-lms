import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Compliance report PDF generation moved to reduce bundle size
async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

return NextResponse.json(
    { error: 'PDF report generation temporarily unavailable' },
    { status: 503 }
  );
}

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;


  return NextResponse.json(
    { error: 'PDF report generation temporarily unavailable' },
    { status: 503 }
  );
}
export const GET = withApiAudit('/api/board/compliance-report', _GET);
export const POST = withApiAudit('/api/board/compliance-report', _POST);
