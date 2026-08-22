// pre-auth-registry: exempt - authenticated testing-center operation; apiRequireTestingCenter runs before the privileged exam_results insert.
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireTestingCenter } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ authId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireTestingCenter(request);
  if (auth.error) return auth.error;

  const { authId } = await params;
  const body = await request.json().catch(() => ({}));
  const { passed, score, exam_date, certificate_number } = body;
  if (passed === undefined || passed === '') return safeError('passed is required', 400);
  if (!exam_date) return safeError('exam_date is required', 400);

  const passedBool = passed === true || passed === 'true';
  const parsedScore = score === undefined || score === null || score === '' ? null : Number(score);
  if (parsedScore !== null && !Number.isFinite(parsedScore)) return safeError('score must be numeric', 400);

  const db = await requireAdminClient();
  const { data: existing, error: fetchErr } = await db
    .from('exam_authorizations')
    .select('id,status,user_id,program_id')
    .eq('id', authId)
    .maybeSingle();
  if (fetchErr || !existing) return safeError('Authorization not found', 404);

  const { data: existingResult } = await db
    .from('exam_results')
    .select('id')
    .eq('authorization_id', authId)
    .maybeSingle();
  if (existingResult) return safeError('Result already recorded for this authorization', 409);

  const { error: insertErr } = await db.from('exam_results').insert({
    authorization_id: authId,
    user_id: existing.user_id,
    passed: passedBool,
    score: parsedScore,
    exam_date,
    certificate_number: certificate_number || null,
    recorded_by: auth.id,
    issued_at: passedBool ? new Date().toISOString() : null,
  });
  if (insertErr) return safeDbError(insertErr, 'Failed to record result');

  const { error: updateErr } = await db
    .from('exam_authorizations')
    .update({ status: passedBool ? 'passed' : 'failed', updated_at: new Date().toISOString() })
    .eq('id', authId);
  if (updateErr) return safeDbError(updateErr, 'Failed to update authorization status');

  await logAdminAudit({
    action: passedBool ? AdminAction.EXAM_RESULT_PASSED : AdminAction.EXAM_RESULT_FAILED,
    actorId: auth.id,
    entityType: 'exam_authorizations',
    entityId: authId,
    metadata: {
      passed: passedBool,
      score: parsedScore,
      exam_date,
      user_id: existing.user_id,
      program_id: existing.program_id,
    },
    req: request,
  }).catch((error) => logger.warn('[exam-result] Audit log failed', error));

  // Recording a passing exam result does not issue an Elevate completion
  // certificate. Course/program issuance is allowed only after the canonical
  // completion evaluators verify every lesson, assessment, seat-time, external
  // module, competency, and program requirement.
  return NextResponse.json({
    success: true,
    passed: passedBool,
    status: passedBool ? 'passed' : 'failed',
    external_certificate_number: certificate_number || undefined,
  });
}
