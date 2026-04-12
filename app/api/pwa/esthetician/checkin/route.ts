import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  try { const rl = await applyRateLimit(request, 'api'); if (rl) return rl; } catch {}

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { error } = await db.from('attendance_log').insert({
    user_id: auth.user.id,
    action: 'checkin',
    details: {
      program: 'esthetician',
      lat: body?.lat ?? null,
      lng: body?.lng ?? null,
      accuracy: body?.accuracy ?? null,
    },
  });

  if (error) return safeDbError(error, 'Failed to record check-in');
  return NextResponse.json({ success: true });
}
