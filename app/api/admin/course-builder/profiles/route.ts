import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { COMPLIANCE_PROFILES } from '@/lib/course-builder/compliance-profiles';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  return NextResponse.json({ ok: true, profiles: Object.values(COMPLIANCE_PROFILES) });
}
