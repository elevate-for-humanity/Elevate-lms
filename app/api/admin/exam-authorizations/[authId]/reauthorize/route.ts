// POST /api/admin/exam-authorizations/[authId]/reauthorize
// Staff-triggered re-authorization after expiry.
// Calls reauthorize_exam_if_ready() which runs a fresh readiness evaluation —
// does not reuse the original authorization's readiness state.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ authId: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { authId } = await params;

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Resolve the expired authorization to get user_id + program_id
  const { data: existing, error: fetchErr } = await db
    .from('exam_authorizations')
    .select('id, user_id, program_id, status')
    .eq('id', authId)
    .single();

  if (fetchErr || !existing) {
    return safeError('Authorization not found', 404);
  }

  if (existing.status !== 'expired') {
    return safeError(
      `Cannot re-authorize: status is '${existing.status}'. Only expired authorizations can be re-authorized.`,
      409
    );
  }

  const { data: result, error: rpcErr } = await db.rpc('reauthorize_exam_if_ready', {
    p_user_id:    existing.user_id,
    p_program_id: existing.program_id,
    p_staff_id:   auth.user.id,
  });

  if (rpcErr) {
    return safeDbError(rpcErr, 'Re-authorization failed');
  }

  const row = Array.isArray(result) ? result[0] : result;

  if (!row?.success) {
    logger.info('Re-authorization denied — learner not ready', {
      authId,
      userId:    existing.user_id,
      programId: existing.program_id,
      reason:    row?.reason,
      staffId:   auth.user.id,
    });
    return safeError(row?.reason ?? 'Learner does not meet readiness requirements', 422);
  }

  logger.info('Re-authorization issued', {
    originalAuthId:  authId,
    newAuthId:       row.authorization_id,
    userId:          existing.user_id,
    programId:       existing.program_id,
    staffId:         auth.user.id,
  });

  return NextResponse.json({
    success: true,
    authorization_id: row.authorization_id,
    message: row.reason,
  });
}
