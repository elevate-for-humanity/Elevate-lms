import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getProductionHostingPlatform } from '@/lib/platform/hosting';

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const payload = {
    now: new Date().toISOString(),
    platform: getProductionHostingPlatform(),
    env: process.env.NODE_ENV ?? null,
    commit: process.env.COMMIT_REF ?? null,
  };

  const res = NextResponse.json(payload);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
export const GET = withApiAudit('/api/build', _GET);
