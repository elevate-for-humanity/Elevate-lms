import { NextResponse } from 'next/server';
import { prepareDeploy } from '@/lib/autopilot/deploy-prep';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Alias for /api/autopilot/deploy
async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

  const result = await prepareDeploy();
  return NextResponse.json(result);
}

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

const result = await prepareDeploy();
  return NextResponse.json(result);
}
export const GET = withApiAudit('/api/autopilots/deploy', _GET);
export const POST = withApiAudit('/api/autopilots/deploy', _POST);
