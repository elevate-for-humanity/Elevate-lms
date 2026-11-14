import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

/** Database DDL belongs to versioned deployment migrations. */
export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return NextResponse.json({
    ok: false,
    retired: true,
    message: 'Use the versioned deployment migration workflow.',
  }, { status: 410, headers: { 'Cache-Control': 'no-store' } });
}
