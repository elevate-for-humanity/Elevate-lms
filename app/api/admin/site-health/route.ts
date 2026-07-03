import { type NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getSiteHealthSnapshot } from '@/lib/admin/get-site-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  
  const health = await getSiteHealthSnapshot();
  return Response.json(health);
}
