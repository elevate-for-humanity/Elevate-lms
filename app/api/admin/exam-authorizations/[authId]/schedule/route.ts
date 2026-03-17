// POST /api/admin/exam-authorizations/[authId]/schedule
// Records a scheduled exam date. Transitions authorization status to 'scheduled'.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

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
  const { scheduled_date, scheduled_time, testing_center, confirmation_number } = body;

  if (!scheduled_date) return safeError('scheduled_date is required', 400);

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: existing, error: fetchErr } = await db
    .from('exam_authorizations')
    .select('id, status, user_id, program_id')
    .eq('id', authId)
    .single();

  if (fetchErr || !existing) return safeError('Authorization not found', 404);
  if (!['authorized', 'pending', 'fee_charged'].includes(existing.status)) {
    return safeError(`Cannot schedule: status is '${existing.status}'`, 409);
  }

  // Insert scheduling record
  const { error: schedErr } = await db.from('exam_scheduling').insert({
    authorization_id:    authId,
    user_id:             existing.user_id,
    program_id:          existing.program_id,
    scheduled_date,
    scheduled_time:      scheduled_time || null,
    testing_center:      testing_center || null,
    confirmation_number: confirmation_number || null,
  });

  if (schedErr) return safeDbError(schedErr, 'Failed to save schedule');

  // Transition authorization to scheduled
  const { error: updateErr } = await db
    .from('exam_authorizations')
    .update({ status: 'scheduled', updated_at: new Date().toISOString() })
    .eq('id', authId);

  if (updateErr) return safeDbError(updateErr, 'Failed to update authorization status');

  return NextResponse.json({ success: true, scheduled_date });
}
