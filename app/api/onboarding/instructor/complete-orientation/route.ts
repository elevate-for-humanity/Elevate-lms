import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Database unavailable', 503);

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', auth.id)
    .maybeSingle();

  if (!profile || !['instructor', 'admin', 'staff'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  const { error } = await db.from('orientation_completions').upsert(
    {
      user_id: auth.id,
      orientation_type: 'instructor',
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,orientation_type', ignoreDuplicates: false },
  );

  if (error) return safeInternalError(error, 'Failed to record orientation completion');

  return NextResponse.json({ ok: true });
}
