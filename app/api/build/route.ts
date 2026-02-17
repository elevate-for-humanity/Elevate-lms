import { NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
const payload = {
    now: new Date().toISOString(),
    platform: 'netlify',
    env: process.env.NODE_ENV ?? null,
    commit: process.env.COMMIT_REF ?? null,
  };

  const res = NextResponse.json(payload);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
