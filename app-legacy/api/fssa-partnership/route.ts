// PUBLIC ROUTE: 410 tombstone — endpoint moved to SNAP intake workflows, no auth needed
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  return NextResponse.json(
    { error: 'This endpoint has moved to SNAP intake workflows.' },
    { status: 410 },
  );
}
