import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return NextResponse.json({ ok: true, namespace: 'admin', user: { id: auth.id, role: auth.role }, endpoints: ['/api/admin/users', '/api/admin/reports/generate', '/api/admin/impersonate'] });
}
