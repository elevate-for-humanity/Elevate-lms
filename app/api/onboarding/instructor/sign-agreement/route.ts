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

  // Verify caller is an instructor (or admin)
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', auth.id)
    .maybeSingle();

  if (!profile || !['instructor', 'admin', 'staff'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  // Idempotent — upsert so double-clicks don't error
  const { error } = await db.from('license_agreement_acceptances').upsert(
    {
      user_id: auth.id,
      agreement_type: 'instructor_services',
      accepted_at: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
    },
    { onConflict: 'user_id,agreement_type', ignoreDuplicates: false },
  );

  if (error) return safeInternalError(error, 'Failed to record agreement');

  return NextResponse.json({ ok: true });
}
