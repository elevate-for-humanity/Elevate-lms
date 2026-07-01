import 'server-only';
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

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { setAuditContext } from '@/lib/audit-context';
import type { StepCompletionResult, CheckpointAttemptResult } from './types';
import { issueCertificateIfEligible } from './certificate';
import { isCheckpointGateError, CheckpointGateError } from './gate';
import { calcProgressPercent, isCourseComplete } from '@/lib/lms/progress-calc';

// ─── recordStepCompletion ─────────────────────────────────────────────────────

export async function recordStepCompletion(
  userId: string,
  lessonId: string,
  courseId: string,
  enrollmentId: string,
  timeSpentSeconds: number = 0,
): Promise<StepCompletionResult> {
  const db = await requireAdminClient();

  // Upsert lesson_progress.
  // The DB trigger trg_enforce_lesson_progress_checkpoint_gate fires here.
  // If the gate blocks, Postgres raises ERRCODE 23514 — normalize it to a
  // structured CheckpointGateError so callers get a consistent domain error.
  const { error: progressError } = await db.from('lesson_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      enrollment_id: enrollmentId,
      completed: true,
      completed_at: new Date().toISOString(),
      time_spent_seconds: Math.max(0, timeSpentSeconds),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' },
  );

  if (progressError) {
    if (isCheckpointGateError(progressError)) {
      const gateErr: CheckpointGateError = {
        code: 'CHECKPOINT_NOT_PASSED',
        message: 'You must pass the required checkpoint before continuing.',
        checkpointLessonId: '',
        checkpointTitle: '',
        requiredScore: 80,
        bestScore: null,
      };
      throw gateErr;
    }
    throw new Error(`recordStepCompletion: ${progressError.message}`);
  }

  // Recalculate progress % — canonical table: course_lessons
  const [{ data: allLessons }, { data: completedLessons }] = await Promise.all([
    db.from('course_lessons').select('id').eq('course_id', courseId),
    db
      .from('lesson_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('completed', true),
  ]);

  const totalLessons = allLessons?.length ?? 0;
  const completedCount = completedLessons?.length ?? 0;
  const progressPercent = calcProgressPercent(completedCount, totalLessons);
  const courseCompleted = isCourseComplete(progressPercent, totalLessons);

  // Persist progress % — canonical table: program_enrollments
  // Try by course_id first (direct enrollment), then by program_id (program-level enrollment).
  // NOTE: Supabase returns error=null when an UPDATE matches zero rows — check the returned
  // data length instead of the error to detect a no-op update and trigger the fallback.
  await setAuditContext(db, { actorUserId: userId, systemActor: 'lms_completion_engine' });
  const { data: directUpdated, error: directUpdateError } = await db
    .from('program_enrollments')
    .update({ progress_percent: progressPercent, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select('id');

  if (directUpdateError || !directUpdated?.length) {
    // Fallback: program-level enrollment — resolve program_id from courses
    const { data: courseRow } = await db
      .from('courses')
      .select('program_id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseRow?.program_id) {
      const { data: fallbackUpdated, error: fallbackError } = await db
        .from('program_enrollments')
        .update({ progress_percent: progressPercent, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('program_id', courseRow.program_id)
        .select('id');

      if (fallbackError) {
        logger.error('[engine] progress_percent fallback update failed', { userId, courseId, fallbackError });
      } else if (!fallbackUpdated?.length) {
        // No enrollment row matched by course_id or program_id — the DB trigger will
        // handle it if lesson_progress.course_id is set, but log for diagnostics.
        logger.warn('[engine] progress_percent update matched no enrollment rows', { userId, courseId });
      }
    } else {
      logger.warn('[engine] progress_percent update: no program_id found for course', { userId, courseId });
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
  courseId: string,
): Promise<{ progressPercent: number }> {
  const db = await requireAdminClient();

  const { error } = await db
    .from('lesson_progress')
    .update({
      completed: false,
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('lesson_id', lessonId);

  if (error) throw new Error(`recordStepUncompletion: ${error.message}`);

  // Recalculate progress % — canonical table: course_lessons
  const [{ data: allLessons }, { data: completedLessons }] = await Promise.all([
    db.from('course_lessons').select('id').eq('course_id', courseId),
    db
      .from('lesson_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('completed', true),
  ]);

  const totalLessons = allLessons?.length ?? 0;
  const completedCount = completedLessons?.length ?? 0;
  const progressPercent = calcProgressPercent(completedCount, totalLessons);

  // Persist progress % — canonical table: program_enrollments
  // Same zero-row fallback pattern as recordStepCompletion.
  const { data: directUpdated2, error: directUpdateError2 } = await db
    .from('program_enrollments')
    .update({ progress_percent: progressPercent, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select('id');

  if (directUpdateError2 || !directUpdated2?.length) {
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
  answers: Record<string, number> = {},
  options?: { supabase?: SupabaseClient | null },
): Promise<CheckpointAttemptResult> {
  let resolvedModuleOrder = moduleOrder;
  const db = options?.supabase ?? (await requireAdminClient());

  if (!resolvedModuleOrder) {
    const { data: lessonRow } = await db
      .from('course_lessons')
      .select('course_modules(order_index)')
      .eq('id', lessonId)
      .maybeSingle();
    resolvedModuleOrder = (lessonRow as any)?.course_modules?.order_index ?? 1;
  }

  // Learner path: SECURITY DEFINER RPC (auth.uid() must match session user).
  if (options?.supabase) {
    const { data, error } = await options.supabase.rpc('record_checkpoint_attempt', {
      p_lesson_id: lessonId,
      p_course_id: courseId,
      p_module_order: resolvedModuleOrder,
      p_score: score,
      p_passing_score: passingScore,
      p_answers: answers,
    });

    if (error) {
      throw new Error(`recordCheckpointAttempt: ${error.message}`);
    }

    const row = data as {
      lessonId?: string;
      score?: number;
      passed?: boolean;
      passingScore?: number;
      attemptNumber?: number;
    } | null;

    return {
      lessonId: row?.lessonId ?? lessonId,
      score: row?.score ?? score,
      passed: row?.passed ?? score >= passingScore,
      passingScore: row?.passingScore ?? passingScore,
      attemptNumber: row?.attemptNumber ?? 1,
    };
  }

  const admin = await requireAdminClient();

  const { data: prior } = await admin
    .from('checkpoint_scores')
    .select('attempt_number')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const attemptNumber = (prior?.attempt_number ?? 0) + 1;
  const passed = score >= passingScore;

  const { error } = await admin.from('checkpoint_scores').insert({
    user_id: userId,
    lesson_id: lessonId,
    course_id: courseId,
    module_order: resolvedModuleOrder,
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

// ── Canonical re-exports ──────────────────────────────────────────────────────
// Course-level completion check and credential pipeline are co-located here
// so callers can import from a single canonical path.
export {
  checkCourseCompletion,
  completeCourse,
  getCourseProgress,
  type CourseCompletionStatus,
} from '@/lib/course-completion';

export {
  startCredentialAttempt,
  resolvePaymentResponsibility,
  getLearnerCredentialLifecycle,
  issueCompletionCertificate,
  checkCertificateIssuanceEligibility,
} from '@/lib/services/credential-pipeline';
