import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { creatorId } = await req.json();
    if (!creatorId) return safeError('creatorId required', 400);

    const db = await requireAdminClient();
    const { error } = await db
      .from('marketplace_creators')
      .update({ status: 'suspended' })
      .eq('id', creatorId);

    if (error) return safeError('Failed to suspend creator', 500);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to suspend creator');
  }
}
