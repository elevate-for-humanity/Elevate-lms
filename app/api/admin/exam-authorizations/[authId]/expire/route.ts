// POST /api/admin/exam-authorizations/[authId]/expire
// Manual expiration by staff. Only valid for active statuses.
// Expired authorizations require a fresh readiness eval to re-authorize.
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
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { authId } = await params;
  const body = await request.json().catch(() => ({}));
  const { reason } = body;

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: existing, error: fetchErr } = await db
    .from('exam_authorizations')
    .select('id, status')
    .eq('id', authId)
    .single();

  if (fetchErr || !existing) return safeError('Authorization not found', 404);

  if (['expired', 'revoked', 'passed', 'failed'].includes(existing.status)) {
    return safeError(`Cannot expire: status is '${existing.status}'`, 409);
  }

  const { error: updateErr } = await db
    .from('exam_authorizations')
    .update({
      status:     'expired',
      updated_at: new Date().toISOString(),
      notes:      `Manually expired by staff (${auth.user.id}) on ${new Date().toISOString().slice(0, 10)}${reason ? ': ' + reason : ''}.`,
    })
    .eq('id', authId);

  if (updateErr) return safeDbError(updateErr, 'Failed to expire authorization');

  return NextResponse.json({ success: true, status: 'expired' });
}
