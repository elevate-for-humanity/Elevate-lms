import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['approved', 'rejected', 'revision_requested', 'under_review'] as const;

/**
 * PATCH /api/lms/evidence/[evidenceId]/review
 * Evaluator/admin reviews a learner's evidence submission.
 * Updates status, evaluator_notes, reviewed_at.
 * On approval, increments student_practical_progress.approved_attempts.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { evidenceId: string } }
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  const { evidenceId } = params;
  if (!evidenceId) return safeError('evidenceId required', 400);

  let body: Record<string, any>;
  try { body = await request.json(); }
  catch { return safeError('Invalid JSON', 400); }

  const { status, evaluator_notes } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return safeError(`status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }

  const db = createAdminClient();

  const { data: evidence, error: fetchErr } = await db
    .from('student_lesson_evidence')
    .select('id, user_id, course_id, lesson_id, status')
    .eq('id', evidenceId)
    .maybeSingle();

  if (fetchErr) return safeDbError(fetchErr, 'Failed to fetch evidence');
  if (!evidence) return safeError('Evidence not found', 404);

  const { data: updated, error: updateErr } = await db
    .from('student_lesson_evidence')
    .update({
      status,
      evaluator_id:    user.id,
      evaluator_notes: evaluator_notes ?? null,
      reviewed_at:     new Date().toISOString(),
    })
    .eq('id', evidenceId)
    .select()
    .single();

  if (updateErr) return safeDbError(updateErr, 'Failed to update evidence');

  // On approval: increment approved_attempts in student_practical_progress
  if (status === 'approved') {
    const { data: existing } = await db
      .from('student_practical_progress')
      .select('id, approved_attempts, accumulated_hours')
      .eq('user_id', evidence.user_id)
      .eq('lesson_id', evidence.lesson_id)
      .maybeSingle();

    if (existing) {
      await db
        .from('student_practical_progress')
        .update({
          approved_attempts: (existing.approved_attempts ?? 0) + 1,
          status:            'in_progress',
          last_updated_at:   new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await db.from('student_practical_progress').insert({
        user_id:           evidence.user_id,
        course_id:         evidence.course_id,
        lesson_id:         evidence.lesson_id,
        approved_attempts: 1,
        accumulated_hours: 0,
        status:            'in_progress',
      });
    }
  }

  return NextResponse.json({ evidence: updated });
}
