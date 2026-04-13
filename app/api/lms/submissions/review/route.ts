import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { checkCompetencyGate } from '@/lib/lms/competency-gate';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['instructor', 'admin', 'super_admin', 'staff'];
const VALID_STATUSES = ['under_review', 'approved', 'rejected', 'revision_requested'] as const;
type ReviewStatus = typeof VALID_STATUSES[number];

/**
 * PATCH /api/lms/submissions/review
 *
 * Instructor signs off on a lab or assignment submission.
 * Sets status, instructor_note, reviewed_at, reviewed_by.
 *
 * Body: { submission_id, status, note? }
 */
export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard();
  const { user } = auth;

  // Require instructor or admin role
  const db = await getAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  let body: { submission_id: string; status: ReviewStatus; note?: string };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { submission_id, status, note } = body;

  if (!submission_id) return safeError('submission_id is required', 400);
  if (!status || !VALID_STATUSES.includes(status)) {
    return safeError(`status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }

  // Rejection and revision_requested require a note
  if ((status === 'rejected' || status === 'revision_requested') && !note?.trim()) {
    return safeError('A note is required when rejecting or requesting revision.', 400);
  }

  // Fetch the submission to verify it exists
  const { data: submission, error: fetchErr } = await db
    .from('step_submissions')
    .select('id, user_id, course_lesson_id, lesson_id, course_id, step_type, status, competency_key')
    .eq('id', submission_id)
    .single();

  if (fetchErr || !submission) return safeError('Submission not found', 404);

  const now = new Date().toISOString();
  const instructorStatus: 'approved' | 'rejected' | 'pending' =
    status === 'approved' ? 'approved' :
    status === 'rejected' ? 'rejected' : 'pending';

  const { data: updated, error: updateErr } = await db
    .from('step_submissions')
    .update({
      status,
      instructor_note:     note?.trim() || null,
      instructor_id:       user.id,
      instructor_status:   instructorStatus,
      instructor_feedback: note?.trim() || null,
      reviewed_by:         user.id,
      reviewed_at:         now,
      updated_at:          now,
    })
    .eq('id', submission_id)
    .select('id, status, reviewed_at, competency_key')
    .single();

  if (updateErr) return safeDbError(updateErr, 'Failed to update submission');

  // Write audit log entry
  await db.from('competency_audit_log').insert({
    submission_id,
    user_id:        submission.user_id,
    lesson_id:      submission.course_lesson_id ?? submission.lesson_id,
    course_id:      submission.course_id,
    competency_key: submission.competency_key ?? null,
    action:         status,
    actor_id:       user.id,
    note:           note?.trim() || null,
    created_at:     now,
  }).then(({ error }) => {
    if (error) logger.warn('[submissions/review] audit log insert failed (non-fatal):', error.message);
  });

  // If approved, check whether all required competency checks for this lesson are now approved.
  // If so, write lesson_progress completion.
  if (status === 'approved') {
    const lessonId = submission.course_lesson_id ?? submission.lesson_id;

    const gate = await checkCompetencyGate(db, { userId: submission.user_id, lessonId });
    const allChecksApproved = gate.allowed;

    if (allChecksApproved) {
      // Resolve enrollment_id — required NOT NULL on lesson_progress
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('id')
        .eq('user_id', submission.user_id)
        .eq('course_id', submission.course_id)
        .maybeSingle();

      await db
        .from('lesson_progress')
        .upsert({
          user_id:       submission.user_id,
          lesson_id:     lessonId,
          course_id:     submission.course_id,
          enrollment_id: enrollment?.id ?? null,
          completed:     true,
          completed_at:  now,
          updated_at:    now,
        }, { onConflict: 'user_id,lesson_id' })
        .then(({ error }) => {
          if (error) logger.error('[submissions/review] lesson_progress upsert failed:', error);
        });
    }
  }

  return NextResponse.json({ submission: updated });
}
