import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireTestingCenter } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ authId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireTestingCenter(request);
  if (auth.error) return auth.error;

  const { authId } = await params;
  const body = await request.json().catch(() => ({}));
  const { outcome } = body;
  if (!['sat', 'no_show'].includes(outcome)) return safeError("outcome must be 'sat' or 'no_show'", 400);

  const db = await requireAdminClient();
  const { data: schedRow, error: schedErr } = await db
    .from('exam_scheduling')
    .select('id, outcome')
    .eq('authorization_id', authId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (schedErr || !schedRow) return safeError('No scheduling record found for this authorization', 404);
  if (schedRow.outcome) return safeError('Outcome already recorded for this scheduling row', 409);

  const { error: updateSchedErr } = await db
    .from('exam_scheduling')
    .update({ outcome, outcome_recorded_at: new Date().toISOString() })
    .eq('id', schedRow.id);
  if (updateSchedErr) return safeDbError(updateSchedErr, 'Failed to record outcome');

  if (outcome === 'no_show') {
    const { count } = await db
      .from('exam_scheduling')
      .select('id', { count: 'exact', head: true })
      .eq('authorization_id', authId)
      .eq('outcome', 'no_show');
    const noShowCount = count ?? 0;

    if (noShowCount >= 2) {
      const { error: revokeError } = await db
        .from('exam_authorizations')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
          notes: `Revoked after ${noShowCount} no-shows. Requires staff re-approval.`,
        })
        .eq('id', authId);
      if (revokeError) return safeDbError(revokeError, 'Failed to revoke authorization');
      return NextResponse.json({ success: true, outcome, action_taken: 'revoked' });
    }

    return NextResponse.json({ success: true, outcome, action_taken: 'reschedule_allowed' });
  }

  return NextResponse.json({ success: true, outcome, action_taken: 'awaiting_result' });
}
