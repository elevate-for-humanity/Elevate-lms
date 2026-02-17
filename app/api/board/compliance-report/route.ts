import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Compliance report PDF generation moved to reduce bundle size
export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

return NextResponse.json(
    { error: 'PDF report generation temporarily unavailable' },
    { status: 503 }
  );
}

export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;


  return NextResponse.json(
    { error: 'PDF report generation temporarily unavailable' },
    { status: 503 }
  );
}
