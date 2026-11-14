import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireTestingCenter } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ authId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireTestingCenter(request);
  if (auth.error) return auth.error;

  const { authId } = await params;
  const db = await requireAdminClient();
  const { data: existing, error: fetchErr } = await db
    .from('exam_authorizations')
    .select('id, user_id, program_id, status')
    .eq('id', authId)
    .maybeSingle();
  if (fetchErr || !existing) return safeError('Authorization not found', 404);
  if (existing.status !== 'expired') {
    return safeError(`Cannot re-authorize: status is '${existing.status}'. Only expired authorizations can be re-authorized.`, 409);
  }

  const { data: result, error: rpcErr } = await db.rpc('reauthorize_exam_if_ready', {
    p_user_id: existing.user_id,
    p_program_id: existing.program_id,
    p_staff_id: auth.id,
  });
  if (rpcErr) return safeDbError(rpcErr, 'Re-authorization failed');

  const row = Array.isArray(result) ? result[0] : result;
  if (!row?.success) {
    logger.info('Re-authorization denied — learner not ready', {
      authId,
      userId: existing.user_id,
      programId: existing.program_id,
      reason: row?.reason,
      staffId: auth.id,
    });
    return safeError(row?.reason ?? 'Learner does not meet readiness requirements', 422);
  }

  return NextResponse.json({ success: true, authorization_id: row.authorization_id, message: row.reason });
}
