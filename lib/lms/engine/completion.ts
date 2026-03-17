/**
 * recordStepCompletion / recordStepUncompletion / recordCheckpointAttempt
 *
 * Write-side of the engine. These are the only functions that mutate
 * learner progress state. All other writes (enrollment progress %,
 * certificate issuance) are triggered from here.
 *
 * recordStepCompletion    — marks a lesson complete, recalculates progress %.
 * recordStepUncompletion  — marks a lesson incomplete, recalculates progress %.
 * recordCheckpointAttempt — writes a checkpoint_scores row.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { StepCompletionResult, CheckpointAttemptResult } from './types';
import { issueCertificateIfEligible } from './certificate';
import { isCheckpointGateError, CheckpointGateError } from './gate';

// ─── recordStepCompletion ─────────────────────────────────────────────────────

export async function recordStepCompletion(
  userId: string,
  lessonId: string,
  courseId: string,
  enrollmentId: string,
  timeSpentSeconds: number = 0
): Promise<StepCompletionResult> {
  const db = createAdminClient();

  // Upsert lesson_progress.
  // The DB trigger trg_enforce_lesson_progress_checkpoint_gate fires here.
  // If the gate blocks, Postgres raises ERRCODE 23514 — normalize it to a
  // structured CheckpointGateError so callers get a consistent domain error.
  const { error: progressError } = await db
    .from('lesson_progress')
    .upsert(
      {
        user_id:            userId,
        lesson_id:          lessonId,
        course_id:          courseId,
        enrollment_id:      enrollmentId,
        completed:          true,
        completed_at:       new Date().toISOString(),
        time_spent_seconds: Math.max(0, timeSpentSeconds),
        updated_at:         new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );

  if (progressError) {
    if (isCheckpointGateError(progressError)) {
      const gateErr: CheckpointGateError = {
        code:               'CHECKPOINT_NOT_PASSED',
        message:            'You must pass the required checkpoint before continuing.',
        checkpointLessonId: '',
        checkpointTitle:    '',
        requiredScore:      80,
        bestScore:          null,
      };
      throw gateErr;
    }
    throw new Error(`recordStepCompletion: ${progressError.message}`);
  }

  // Recalculate progress %
  const [{ data: allLessons }, { data: completedLessons }] = await Promise.all([
    db.from('curriculum_lessons').select('id').eq('course_id', courseId).eq('status', 'published'),
    db.from('lesson_progress').select('id').eq('user_id', userId).eq('course_id', courseId).eq('completed', true),
  ]);

  const totalLessons    = allLessons?.length ?? 0;
  const completedCount  = completedLessons?.length ?? 0;
  const progressPercent = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;
  const courseCompleted = progressPercent === 100 && totalLessons > 0;

  // Persist progress % on enrollment
  const { error: rpcError } = await db.rpc('update_enrollment_progress_manual', {
    p_user_id:  userId,
    p_course_id: courseId,
    p_progress: progressPercent,
  });
  if (rpcError) {
    // Fallback direct update
    await db
      .from('training_enrollments')
      .update({ progress: progressPercent, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('course_id', courseId);
  }

  // Auto-issue certificate when course is complete
  let certificateNumber: string | null = null;
  if (courseCompleted) {
    try {
      certificateNumber = await issueCertificateIfEligible(userId, courseId, enrollmentId);
    } catch (certErr) {
      // Non-fatal — lesson completion is already recorded
      logger.error('[engine] Certificate issuance failed (non-fatal):', certErr);
    }
  }

  return {
    lessonId,
    courseId,
    progressPercent,
    courseCompleted,
    certificateIssued: certificateNumber !== null,
    certificateNumber,
  };
}

// ─── recordStepUncompletion ───────────────────────────────────────────────────

export async function recordStepUncompletion(
  userId: string,
  lessonId: string,
  courseId: string
): Promise<{ progressPercent: number }> {
  const db = createAdminClient();

  const { error } = await db
    .from('lesson_progress')
    .update({
      completed:    false,
      completed_at: null,
      updated_at:   new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('lesson_id', lessonId);

  if (error) throw new Error(`recordStepUncompletion: ${error.message}`);

  // Recalculate progress %
  const [{ data: allLessons }, { data: completedLessons }] = await Promise.all([
    db.from('curriculum_lessons').select('id').eq('course_id', courseId).eq('status', 'published'),
    db.from('lesson_progress').select('id').eq('user_id', userId).eq('course_id', courseId).eq('completed', true),
  ]);

  const totalLessons    = allLessons?.length ?? 0;
  const completedCount  = completedLessons?.length ?? 0;
  const progressPercent = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  const { error: rpcError } = await db.rpc('update_enrollment_progress_manual', {
    p_user_id:   userId,
    p_course_id: courseId,
    p_progress:  progressPercent,
  });
  if (rpcError) {
    await db
      .from('training_enrollments')
      .update({ progress: progressPercent, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('course_id', courseId);
  }

  return { progressPercent };
}

// ─── recordCheckpointAttempt ──────────────────────────────────────────────────

export async function recordCheckpointAttempt(
  userId: string,
  lessonId: string,
  courseId: string,
  moduleOrder: number,
  score: number,
  passingScore: number,
  answers: Record<string, number> = {}
): Promise<CheckpointAttemptResult> {
  const db = createAdminClient();

  // Determine next attempt number
  const { data: prior } = await db
    .from('checkpoint_scores')
    .select('attempt_number')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const attemptNumber = (prior?.attempt_number ?? 0) + 1;
  const passed = score >= passingScore;

  const { error } = await db.from('checkpoint_scores').insert({
    user_id:       userId,
    lesson_id:     lessonId,
    course_id:     courseId,
    module_order:  moduleOrder,
    score,
    passing_score: passingScore,
    attempt_number: attemptNumber,
    answers,
  });

  if (error) {
    throw new Error(`recordCheckpointAttempt: ${error.message}`);
  }

  return { lessonId, score, passed, passingScore, attemptNumber };
}
