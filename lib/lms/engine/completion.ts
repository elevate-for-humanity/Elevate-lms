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
import { setAuditContext } from '@/lib/audit-context';
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

  // Recalculate progress % — canonical table: course_lessons
  const [{ data: allLessons }, { data: completedLessons }] = await Promise.all([
    db.from('course_lessons').select('id').eq('course_id', courseId),
    db.from('lesson_progress').select('id').eq('user_id', userId).eq('course_id', courseId).eq('completed', true),
  ]);

  const totalLessons    = allLessons?.length ?? 0;
  const completedCount  = completedLessons?.length ?? 0;
  const progressPercent = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;
  const courseCompleted = progressPercent === 100 && totalLessons > 0;

  // Persist progress % — canonical table: program_enrollments
  // Try by course_id first (direct enrollment), then by program_id (program-level enrollment).
  await setAuditContext(db, { actorUserId: userId, systemActor: 'lms_completion_engine' });
  const { error: directUpdateError } = await db
    .from('program_enrollments')
    .update({ progress_percent: progressPercent, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (directUpdateError) {
    // Fallback: program-level enrollment — resolve program_id from courses
    const { data: courseRow } = await db
      .from('courses')
      .select('program_id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseRow?.program_id) {
      await db
        .from('program_enrollments')
        .update({ progress_percent: progressPercent, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('program_id', courseRow.program_id);
    }
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

  // Recalculate progress % — canonical table: course_lessons
  const [{ data: allLessons }, { data: completedLessons }] = await Promise.all([
    db.from('course_lessons').select('id').eq('course_id', courseId),
    db.from('lesson_progress').select('id').eq('user_id', userId).eq('course_id', courseId).eq('completed', true),
  ]);

  const totalLessons    = allLessons?.length ?? 0;
  const completedCount  = completedLessons?.length ?? 0;
  const progressPercent = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  // Persist progress % — canonical table: program_enrollments
  const { error: directUpdateError } = await db
    .from('program_enrollments')
    .update({ progress_percent: progressPercent, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (directUpdateError) {
    const { data: courseRow } = await db
      .from('courses')
      .select('program_id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseRow?.program_id) {
      await db
        .from('program_enrollments')
        .update({ progress_percent: progressPercent, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('program_id', courseRow.program_id);
    }
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

  // Resolve module_order from course_modules if not provided or zero.
  // module_order is required (NOT NULL) on checkpoint_scores.
  let resolvedModuleOrder = moduleOrder;
  if (!resolvedModuleOrder) {
    const { data: lessonRow } = await db
      .from('course_lessons')
      .select('course_modules(order_index)')
      .eq('id', lessonId)
      .maybeSingle();
    resolvedModuleOrder = (lessonRow as any)?.course_modules?.order_index ?? 1;
  }

  // NOTE: checkpoint_scores.passed is a generated column (score >= passing_score).
  // Do NOT include it in the insert — Postgres computes it automatically.
  const { error } = await db.from('checkpoint_scores').insert({
    user_id:        userId,
    lesson_id:      lessonId,
    course_id:      courseId,
    module_order:   resolvedModuleOrder,
    score,
    passing_score:  passingScore,
    attempt_number: attemptNumber,
    answers,
  });

  if (error) {
    throw new Error(`recordCheckpointAttempt: ${error.message}`);
  }

  return { lessonId, score, passed, passingScore, attemptNumber };
}
