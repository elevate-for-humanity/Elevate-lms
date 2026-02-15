import { NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
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
