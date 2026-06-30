import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const q = searchParams.get('q');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));
    let query = db.from('profiles').select('id, full_name, email, role, tenant_id, created_at').order('created_at', { ascending: false }).limit(limit);
    if (role) query = query.eq('role', role);
    if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) return safeDbError(error, 'Admin users list failed');
    return NextResponse.json({ users: data ?? [] });
  } catch (error) {
    return safeInternalError(error, 'Admin users list failed');
  }
}
