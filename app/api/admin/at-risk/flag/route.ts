export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { studentId, enrollmentId } = await request.json();
  if (!studentId) return safeError('studentId required', 400);

  const db = createAdminClient();

  const { error } = await db
    .from('profiles')
    .update({ enrollment_status: 'at_risk', updated_at: new Date().toISOString() })
    .eq('id', studentId);

  if (error) return safeInternalError(error, 'Failed to flag student');

  // Log the intervention — non-fatal if table doesn't exist yet
  await db.from('student_interventions').insert({
    student_id: studentId,
    enrollment_id: enrollmentId ?? null,
    intervention_type: 'flagged_for_review',
    notes: 'Admin-flagged from at-risk dashboard',
    created_at: new Date().toISOString(),
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
