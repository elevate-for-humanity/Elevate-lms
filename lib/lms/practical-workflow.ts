/**
 * lib/lms/practical-workflow.ts
 *
 * Orchestrates the full practical submission lifecycle:
 *   learner submits → instructor reviews → approve/revision/reject → unlock
 *
 * This is the single source of truth for practical workflow logic.
 * The API routes (submissions/route.ts, submissions/review/route.ts) delegate
 * to these functions rather than implementing logic inline.
 *
 * Submission statuses:
 *   draft              — saved but not submitted
 *   submitted          — awaiting instructor review
 *   pending_review     — instructor has opened it
 *   revision_requested — instructor sent back for changes
 *   approved           — instructor signed off
 *   rejected           — instructor rejected (with required note)
 *
 * On approval, this module:
 *   1. Updates step_submissions.status = 'approved'
 *   2. Writes competency_audit_log entry
 *   3. Calls markCompetencyAchieved for each competency_key on the submission
 *   4. Checks competency gate — if all checks pass, writes lesson_progress
 *   5. Sends in-app notification to learner
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { checkCompetencyGate } from './competency-gate';
import { markCompetencyAchieved } from '@/lib/course-builder/competency-mapper';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'revision_requested'
  | 'approved'
  | 'rejected';

export type ReviewAction = 'approve' | 'request_revision' | 'reject' | 'mark_under_review';

export type SubmitPracticalParams = {
  userId: string;
  courseLessonId: string;
  courseId: string;
  stepType: 'lab' | 'assignment';
  submissionText?: string;
  fileUrls?: string[];
  competencyKey?: string;
};

export type SubmitPracticalResult = {
  success: boolean;
  submissionId?: string;
  error?: string;
};

export type ReviewPracticalParams = {
  submissionId: string;
  instructorId: string;
  action: ReviewAction;
  note?: string;
};

export type ReviewPracticalResult = {
  success: boolean;
  lessonUnlocked: boolean;
  competencyAchieved: boolean;
  error?: string;
};

// ─── Status mapping ───────────────────────────────────────────────────────────

const ACTION_TO_STATUS: Record<ReviewAction, SubmissionStatus> = {
  approve:           'approved',
  request_revision:  'revision_requested',
  reject:            'rejected',
  mark_under_review: 'pending_review',
};

// ─── Submit practical ─────────────────────────────────────────────────────────

/**
 * Creates a step_submissions row for a learner's practical submission.
 * Validates enrollment before inserting.
 */
export async function submitPractical(
  db: SupabaseClient,
  params: SubmitPracticalParams,
): Promise<SubmitPracticalResult> {
  const { userId, courseLessonId, courseId, stepType, submissionText, fileUrls, competencyKey } = params;

  // Verify enrollment
  const ACCESS_STATES = ['active', 'in_progress', 'enrolled', 'confirmed', 'pending_funding_verification'];
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, status, enrollment_state')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  const hasAccess =
    enrollment &&
    (ACCESS_STATES.includes(enrollment.status ?? '') ||
      ACCESS_STATES.includes(enrollment.enrollment_state ?? ''));

  if (!hasAccess) {
    return { success: false, error: 'Not enrolled in this course' };
  }

  const { data: submission, error } = await db
    .from('step_submissions')
    .insert({
      user_id:          userId,
      lesson_id:        courseLessonId,
      course_lesson_id: courseLessonId,
      course_id:        courseId,
      step_type:        stepType,
      submission_text:  submissionText?.trim() || null,
      file_urls:        fileUrls ?? [],
      status:           'submitted',
      competency_key:   competencyKey ?? null,
      updated_at:       new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    logger.error('[practical-workflow] submitPractical failed', { userId, courseLessonId, error: error.message });
    return { success: false, error: error.message };
  }

  return { success: true, submissionId: submission.id };
}

// ─── Review practical ─────────────────────────────────────────────────────────

/**
 * Instructor reviews a submission. On approval:
 *   - Updates submission status
 *   - Writes audit log
 *   - Marks competency achieved (if competency_key set)
 *   - Checks gate and writes lesson_progress if all checks pass
 *   - Sends learner notification
 */
export async function reviewPractical(
  db: SupabaseClient,
  params: ReviewPracticalParams,
): Promise<ReviewPracticalResult> {
  const { submissionId, instructorId, action, note } = params;

  // Require note for rejection and revision
  if ((action === 'reject' || action === 'request_revision') && !note?.trim()) {
    return { success: false, lessonUnlocked: false, competencyAchieved: false, error: 'A note is required for rejection or revision requests' };
  }

  // Load submission
  const { data: submission, error: fetchErr } = await db
    .from('step_submissions')
    .select('id, user_id, course_lesson_id, lesson_id, course_id, step_type, competency_key')
    .eq('id', submissionId)
    .single();

  if (fetchErr || !submission) {
    return { success: false, lessonUnlocked: false, competencyAchieved: false, error: 'Submission not found' };
  }

  const newStatus = ACTION_TO_STATUS[action];
  const now = new Date().toISOString();
  const lessonId = submission.course_lesson_id ?? submission.lesson_id;

  // Update submission
  const { error: updateErr } = await db
    .from('step_submissions')
    .update({
      status:              newStatus,
      instructor_note:     note?.trim() || null,
      instructor_id:       instructorId,
      instructor_status:   action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending',
      instructor_feedback: note?.trim() || null,
      reviewed_by:         instructorId,
      reviewed_at:         now,
      updated_at:          now,
    })
    .eq('id', submissionId);

  if (updateErr) {
    logger.error('[practical-workflow] reviewPractical update failed', { submissionId, error: updateErr.message });
    return { success: false, lessonUnlocked: false, competencyAchieved: false, error: updateErr.message };
  }

  // Write audit log
  await db.from('competency_audit_log').insert({
    submission_id:  submissionId,
    user_id:        submission.user_id,
    lesson_id:      lessonId,
    course_id:      submission.course_id,
    competency_key: submission.competency_key ?? null,
    action:         newStatus,
    actor_id:       instructorId,
    note:           note?.trim() || null,
    created_at:     now,
  }).then(({ error }) => {
    if (error) logger.warn('[practical-workflow] audit log insert failed (non-fatal)', { error: error.message });
  });

  let competencyAchieved = false;
  let lessonUnlocked = false;

  if (action === 'approve') {
    // Mark competency achieved if this submission has a competency_key
    if (submission.competency_key) {
      const compResult = await markCompetencyAchieved(db, {
        userId:                submission.user_id,
        courseId:              submission.course_id,
        competencyKey:         submission.competency_key,
        achievedVia:           'observation',
        verifiedBy:            instructorId,
        lessonId,
        evidenceSubmissionId:  submissionId,
      });
      competencyAchieved = compResult.success;
      if (!compResult.success) {
        logger.warn('[practical-workflow] markCompetencyAchieved failed (non-fatal)', {
          competencyKey: submission.competency_key,
          error: compResult.error,
        });
      }
    }

    // Check competency gate — if all required checks are now approved, unlock lesson
    const gate = await checkCompetencyGate(db, { userId: submission.user_id, lessonId });

    if (gate.allowed) {
      // Resolve enrollment_id (NOT NULL on lesson_progress)
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('id')
        .eq('user_id', submission.user_id)
        .eq('course_id', submission.course_id)
        .maybeSingle();

      const { error: progressErr } = await db
        .from('lesson_progress')
        .upsert({
          user_id:       submission.user_id,
          lesson_id:     lessonId,
          course_id:     submission.course_id,
          enrollment_id: enrollment?.id ?? null,
          completed:     true,
          completed_at:  now,
          updated_at:    now,
        }, { onConflict: 'user_id,lesson_id' });

      if (progressErr) {
        logger.error('[practical-workflow] lesson_progress upsert failed', { lessonId, error: progressErr.message });
      } else {
        lessonUnlocked = true;
      }
    }

    // In-app notification to learner
    const notifMessage = lessonUnlocked
      ? 'Your practical submission was approved and the lesson is now complete.'
      : gate.missingKeys.length > 0
        ? `Submission approved. Still waiting on: ${gate.missingKeys.join(', ')}`
        : 'Your practical submission was approved.';

    await db.from('notifications').insert({
      user_id:    submission.user_id,
      type:       'submission_reviewed',
      title:      'Practical Submission Approved',
      message:    notifMessage,
      action_url: `/lms/courses/${submission.course_id}/lessons/${lessonId}`,
    }).then(({ error }) => {
      if (error) logger.warn('[practical-workflow] notification insert failed (non-fatal)', { error: error.message });
    });

  } else if (action === 'request_revision' || action === 'reject') {
    // Notify learner of revision request or rejection
    const title = action === 'reject' ? 'Practical Submission Rejected' : 'Revision Requested';
    const message = note?.trim() ?? (action === 'reject' ? 'Your submission was rejected.' : 'Your instructor has requested revisions.');

    await db.from('notifications').insert({
      user_id:    submission.user_id,
      type:       'submission_reviewed',
      title,
      message,
      action_url: `/lms/courses/${submission.course_id}/lessons/${lessonId}`,
    }).then(({ error }) => {
      if (error) logger.warn('[practical-workflow] notification insert failed (non-fatal)', { error: error.message });
    });
  }

  return { success: true, lessonUnlocked, competencyAchieved };
}

// ─── Get submission status for a learner + lesson ─────────────────────────────

export type SubmissionSummary = {
  submissionId: string;
  status: SubmissionStatus;
  competencyKey?: string;
  submittedAt: string;
  reviewedAt?: string;
  instructorNote?: string;
};

export async function getSubmissionsForLesson(
  db: SupabaseClient,
  opts: { userId: string; lessonId: string },
): Promise<SubmissionSummary[]> {
  const { data, error } = await db
    .from('step_submissions')
    .select('id, status, competency_key, created_at, reviewed_at, instructor_note')
    .eq('user_id', opts.userId)
    .eq('course_lesson_id', opts.lessonId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getSubmissionsForLesson: ${error.message}`);

  return (data ?? []).map(row => ({
    submissionId:   row.id,
    status:         row.status as SubmissionStatus,
    competencyKey:  row.competency_key ?? undefined,
    submittedAt:    row.created_at,
    reviewedAt:     row.reviewed_at ?? undefined,
    instructorNote: row.instructor_note ?? undefined,
  }));
}
