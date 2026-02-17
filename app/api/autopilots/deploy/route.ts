import { NextResponse } from 'next/server';
import { prepareDeploy } from '@/lib/autopilot/deploy-prep';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Alias for /api/autopilot/deploy
export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

  const result = await prepareDeploy();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

const result = await prepareDeploy();
  return NextResponse.json(result);
}
