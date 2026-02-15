import { NextResponse } from 'next/server';
import { prepareDeploy } from '@/lib/autopilot/deploy-prep';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Alias for /api/autopilot/deploy
export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const result = await prepareDeploy();
  return NextResponse.json(result);
}

export async function GET() {
  const result = await prepareDeploy();
  return NextResponse.json(result);
}
