// POST /api/admin/exam-authorizations/[authId]/outcome
// Records sat vs no-show on the most recent exam_scheduling row.
// No-show policy: first no-show → reschedule allowed.
//                 Second no-show → status set to 'revoked', requires staff re-approval.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ authId: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { authId } = await params;
  const body = await request.json().catch(() => ({}));
  const { outcome } = body;

  if (!['sat', 'no_show'].includes(outcome)) {
    return safeError("outcome must be 'sat' or 'no_show'", 400);
  }

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Get most recent scheduling row
  const { data: schedRow, error: schedErr } = await db
    .from('exam_scheduling')
    .select('id, outcome')
    .eq('authorization_id', authId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (schedErr || !schedRow) return safeError('No scheduling record found for this authorization', 404);
  if (schedRow.outcome) return safeError('Outcome already recorded for this scheduling row', 409);

  // Record outcome on scheduling row
  const { error: updateSchedErr } = await db
    .from('exam_scheduling')
    .update({
      outcome,
      outcome_recorded_at: new Date().toISOString(),
    })
    .eq('id', schedRow.id);

  if (updateSchedErr) return safeDbError(updateSchedErr, 'Failed to record outcome');

  if (outcome === 'no_show') {
    // Count prior no-shows for this authorization
    const { count } = await db
      .from('exam_scheduling')
      .select('id', { count: 'exact', head: true })
      .eq('authorization_id', authId)
      .eq('outcome', 'no_show');

    const noShowCount = count ?? 0;

    if (noShowCount >= 2) {
      // Second no-show: revoke — requires staff re-approval before re-authorization
      await db
        .from('exam_authorizations')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
          notes: `Revoked after ${noShowCount} no-shows. Requires staff re-approval.`,
        })
        .eq('id', authId);

      return NextResponse.json({
        success: true,
        outcome,
        action_taken: 'revoked',
        message: `Authorization revoked after ${noShowCount} no-shows. Staff re-approval required before re-authorization.`,
      });
    }

    // First no-show: keep authorized, allow reschedule
    return NextResponse.json({
      success: true,
      outcome,
      action_taken: 'reschedule_allowed',
      message: 'First no-show recorded. Learner may be rescheduled.',
    });
  }

  // Sat: no status change needed — result will be recorded separately
  return NextResponse.json({ success: true, outcome, action_taken: 'awaiting_result' });
}
