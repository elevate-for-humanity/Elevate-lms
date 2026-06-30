import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPORT_TABLES: Record<string, { table: string; select: string; order?: string }> = {
  enrollments: { table: 'program_enrollments', select: 'id, user_id, program_id, status, funding_source, enrolled_at, completed_at, created_at', order: 'created_at' },
  completions: { table: 'program_completion_certificates', select: 'id, user_id, program_id, certificate_number, issued_at, status', order: 'issued_at' },
  credentials: { table: 'credentials', select: 'id, student_id, credential_type, status, issued_at, expires_at, updated_at', order: 'updated_at' },
  funding: { table: 'program_enrollments', select: 'id, user_id, program_id, status, funding_source, funding_program_id, enrolled_at, completed_at', order: 'enrolled_at' },
};

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as { report_type?: string; limit?: number } | null;
  const reportType = body?.report_type ?? 'enrollments';
  const config = REPORT_TABLES[reportType];
  if (!config) return safeError(`Unsupported report_type: ${reportType}`, 400);

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);
    const limit = Math.min(1000, Math.max(1, Number(body?.limit ?? 250)));
    let query = db.from(config.table).select(config.select, { count: 'exact' }).limit(limit);
    if (config.order) query = query.order(config.order, { ascending: false });
    if (reportType === 'funding') query = query.not('funding_source', 'is', null);
    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
    return NextResponse.json({ ok: true, report_type: reportType, total: count ?? data?.length ?? 0, rows: data ?? [], generated_at: new Date().toISOString() });
  } catch (error) {
    return safeInternalError(error, 'Report generation failed');
  }
}
