// POST /api/admin/exam-authorizations/[authId]/result
// Records exam result (pass/fail + score) in exam_results.
// Transitions authorization status to 'passed' or 'failed'.
// On pass: issues program_completion_certificates if all checkpoints are met.
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { logger } from '@/lib/logger';
import { issueCertificateIfEligible } from '@/lib/lms/engine/certificate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ authId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { authId } = await params;
  const body = await request.json().catch(() => ({}));
  const { passed, score, exam_date, certificate_number } = body;

  if (passed === undefined || passed === '') return safeError('passed is required', 400);
  if (!exam_date) return safeError('exam_date is required', 400);

  const passedBool = passed === true || passed === 'true';

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: existing, error: fetchErr } = await db
    .from('exam_authorizations')
    .select('id, status, user_id, program_id')
    .eq('id', authId)
    .maybeSingle();

  if (fetchErr || !existing) return safeError('Authorization not found', 404);

  // Check for existing result
  const { data: existingResult } = await db
    .from('exam_results')
    .select('id')
    .eq('authorization_id', authId)
    .maybeSingle();

  if (existingResult) return safeError('Result already recorded for this authorization', 409);

  // Insert exam result
  const { error: insertErr } = await db.from('exam_results').insert({
    authorization_id: authId,
    user_id: existing.user_id,
    passed: passedBool,
    score: score ? parseFloat(score) : null,
    exam_date,
    certificate_number: certificate_number || null,
    recorded_by: auth.id,
    issued_at: passedBool ? new Date().toISOString() : null,
  });

  if (insertErr) return safeDbError(insertErr, 'Failed to record result');

  // Transition authorization status
  const { error: updateErr } = await db
    .from('exam_authorizations')
    .update({
      status: passedBool ? 'passed' : 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', authId);

  if (updateErr) return safeDbError(updateErr, 'Failed to update authorization status');

  await logAdminAudit({
    action: passedBool ? AdminAction.EXAM_RESULT_PASSED : AdminAction.EXAM_RESULT_FAILED,
    actorId: auth.id,
    entityType: 'exam_authorizations',
    entityId: authId,
    metadata: {
      passed: passedBool,
      score: score ?? null,
      exam_date,
      user_id: existing.user_id,
      program_id: existing.program_id,
    },
    req: request,
  }).catch((e) => logger.warn('[exam-result] Audit log failed', e));

  // On pass: attempt certificate issuance if the learner has a matching enrollment.
  // Non-blocking — a missing enrollment or unmet checkpoint requirements returns null silently.
  let certificateNumber: string | null = null;
  if (passedBool && existing.user_id) {
    try {
      // Find the active enrollment for this user + program
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('id, course_id')
        .eq('user_id', existing.user_id)
        .eq('program_id', existing.program_id)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (enrollment?.id && enrollment?.course_id) {
        certificateNumber = await issueCertificateIfEligible(
          existing.user_id,
          enrollment.course_id,
          enrollment.id,
        );
        if (certificateNumber) {
          logger.info('[exam-result] Certificate issued on exam pass', {
            authId,
            userId: existing.user_id,
            certificateNumber,
          });
        }
      }
    } catch (certErr) {
      // Certificate failure must never block the exam result response
      logger.error('[exam-result] Certificate issuance failed (non-blocking)', certErr);
    }
  }

  return NextResponse.json({
    success: true,
    passed: passedBool,
    status: passedBool ? 'passed' : 'failed',
    certificate_number: certificateNumber ?? undefined,
  });
}
