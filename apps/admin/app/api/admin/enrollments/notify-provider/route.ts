// AUTH: admin/admin/staff only
// Sets provider_notified_at + provider_notified_by on a program_enrollments row.
// Must be called AFTER the enrollment is recorded here — the timestamp proves
// Elevate owns the student record before the training provider is contacted.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.enrollment_id) {
    return safeError('enrollment_id is required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Confirm the enrollment exists and is CDL
  const { data: enrollment, error: fetchErr } = await db
    .from('program_enrollments')
    .select('id, program_slug, provider_notified_at')
    .eq('id', body.enrollment_id)
    .maybeSingle();

  if (fetchErr) return safeDbError(fetchErr, 'Failed to fetch enrollment');
  if (!enrollment) return safeError('Enrollment not found', 404);
  if (enrollment.program_slug !== 'cdl-training') {
    return safeError('notify-provider is only valid for cdl-training enrollments', 400);
  }

  // Idempotent — if already notified, return the existing timestamp
  if (enrollment.provider_notified_at) {
    return NextResponse.json({
      enrollment_id: body.enrollment_id,
      provider_notified_at: enrollment.provider_notified_at,
      already_set: true,
    });
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await db
    .from('program_enrollments')
    .update({
      provider_notified_at: now,
      provider_notified_by: auth.id,
    })
    .eq('id', body.enrollment_id);

  if (updateErr) return safeDbError(updateErr, 'Failed to set provider_notified_at');

  return NextResponse.json({
    enrollment_id: body.enrollment_id,
    provider_notified_at: now,
    notified_by: auth.id,
  });
}
