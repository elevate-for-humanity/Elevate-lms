import { NextResponse } from "next/server";
import { apiRequireAdmin } from '@/lib/authGuards';

export const dynamic = "force-dynamic";

export async function GET() {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
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
