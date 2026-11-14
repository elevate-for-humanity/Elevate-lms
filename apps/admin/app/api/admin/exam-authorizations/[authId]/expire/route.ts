import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireTestingCenter } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ authId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireTestingCenter(request);
  if (auth.error) return auth.error;

  const { authId } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = String(body.reason ?? '').trim();
  const db = await requireAdminClient();

  const { data: existing, error: fetchErr } = await db
    .from('exam_authorizations')
    .select('id, status')
    .eq('id', authId)
    .maybeSingle();
  if (fetchErr || !existing) return safeError('Authorization not found', 404);
  if (['expired', 'revoked', 'passed', 'failed'].includes(existing.status)) {
    return safeError(`Cannot expire: status is '${existing.status}'`, 409);
  }

  const now = new Date();
  const { error: updateErr } = await db
    .from('exam_authorizations')
    .update({
      status: 'expired',
      updated_at: now.toISOString(),
      notes: `Manually expired by testing staff (${auth.id}) on ${now.toISOString().slice(0, 10)}${reason ? `: ${reason}` : ''}.`,
    })
    .eq('id', authId);
  if (updateErr) return safeDbError(updateErr, 'Failed to expire authorization');

  return NextResponse.json({ success: true, status: 'expired' });
}
