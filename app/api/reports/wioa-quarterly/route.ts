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
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    let query = db
      .from('program_enrollments')
      .select('id, user_id, program_id, status, funding_source, enrolled_at, completed_at', { count: 'exact' })
      .ilike('funding_source', '%wioa%')
      .order('enrolled_at', { ascending: false })
      .limit(1000);
    if (from) query = query.gte('enrolled_at', from);
    if (to) query = query.lte('enrolled_at', to);
    const { data, error, count } = await query;
    if (error) return safeDbError(error, 'WIOA quarterly report failed');
    return NextResponse.json({ report: 'wioa-quarterly', total: count ?? data?.length ?? 0, rows: data ?? [] });
  } catch (error) {
    return safeInternalError(error, 'WIOA quarterly report failed');
  }
}
