import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Stub route (503) — auth guard deferred until implementation

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// MOU PDF generation moved to reduce bundle size
export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json(
    { error: 'PDF generation temporarily unavailable', message: 'Please contact support for MOU documents' },
    { status: 503 }
  );
}
