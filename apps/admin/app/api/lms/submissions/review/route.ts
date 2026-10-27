import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { reviewPractical } from '@/lib/lms/practical-workflow';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['instructor', 'admin', 'super_admin', 'staff'];
const VALID_STATUSES = ['under_review', 'approved', 'rejected', 'revision_requested'] as const;
type ReviewStatus = (typeof VALID_STATUSES)[number];

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

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  const userId = auth.id;

  // Require instructor or admin role
  const db = await requireAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', userId).maybeSingle();

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
    .select(
      'id, user_id, course_lesson_id, lesson_id, course_id, step_type, status, competency_key',
    )
    .eq('id', submission_id)
    .maybeSingle();

  if (fetchErr || !submission) return safeError('Submission not found', 404);

  const action =
    status === 'approved' ? 'approve' :
    status === 'rejected' ? 'reject' :
    status === 'revision_requested' ? 'request_revision' :
    'mark_under_review';
  const result = await reviewPractical(db, {
    submissionId: submission_id,
    instructorId: userId,
    action,
    note,
  });
  if (!result.success) return safeError(result.error || 'Practical review failed', 422);

  return NextResponse.json({
    submission: {
      id: submission_id,
      status,
      competency_key: submission.competency_key ?? null,
    },
    lessonUnlocked: result.lessonUnlocked,
    competencyAchieved: result.competencyAchieved,
  });
}
