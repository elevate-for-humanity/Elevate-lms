import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Stub route (503) — auth guard deferred until implementation

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// MOU signing moved to reduce bundle size
export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  return NextResponse.json(
    { error: 'MOU signing temporarily unavailable', message: 'Please contact support' },
    { status: 503 }
  );
}
