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
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') ?? 100)));
    const { data, error, count } = await db
      .from('credentials')
      .select('id, student_id, credential_type, status, issued_at, expires_at, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) return safeDbError(error, 'Credential report failed');
    return NextResponse.json({ report: 'credentials', total: count ?? data?.length ?? 0, rows: data ?? [] });
  } catch (error) {
    return safeInternalError(error, 'Credential report failed');
  }
}
