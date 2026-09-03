export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { studentId, userId, riskId } = await request.json();
  const learnerId = userId ?? studentId;
  if (!learnerId) return safeError('userId required', 400);

  const db = await requireAdminClient();

  const { error } = await db
    .from('profiles')
    .update({ enrollment_status: 'at_risk', updated_at: new Date().toISOString() })
    .eq('id', learnerId);

  if (error) return safeInternalError(error, 'Failed to flag student');

  // Non-fatal audit/intervention write. Supabase returns database errors in the
  // result object rather than via Promise.catch on the query builder.
  const { error: interventionError } = await db.from('student_interventions').insert({
    user_id: learnerId,
    at_risk_id: riskId ?? null,
    intervention_type: 'other',
    status: 'pending',
    notes: 'Admin-flagged from at-risk dashboard',
    created_by: auth.id,
  });
  if (interventionError) return safeInternalError(interventionError, 'Student was flagged but the intervention record could not be created');

  return NextResponse.json({ ok: true });
}
