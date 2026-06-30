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
      .from('program_completion_certificates')
      .select('id, user_id, program_id, certificate_number, issued_at, verification_code, status', { count: 'exact' })
      .order('issued_at', { ascending: false })
      .limit(limit);
    if (error) return safeDbError(error, 'Completion report failed');
    return NextResponse.json({ report: 'completions', total: count ?? data?.length ?? 0, rows: data ?? [] });
  } catch (error) {
    return safeInternalError(error, 'Completion report failed');
  }
}
