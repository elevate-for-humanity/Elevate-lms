import 'server-only';
/**
 * Canonical LMS write engine.
 *
 * This module owns lesson_progress and checkpoint_scores mutations only.
 * Program progress is recomputed by the database trigger across all required
 * program courses. Course/program certificate issuance is deliberately outside
 * this engine so a raw 100% lesson count cannot bypass seat-time, exam, external
 * module, competency, or program-completion gates.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@/lib/supabase';
import type { StepCompletionResult, CheckpointAttemptResult } from './types';
import { isCheckpointGateError, CheckpointGateError } from './gate';
import { calcProgressPercent, isCourseComplete } from '@/lib/lms/progress-calc';

export async function recordStepCompletion(
  userId: string,
  lessonId: string,
  courseId: string,
  enrollmentId: string,
  timeSpentSeconds: number = 0,
): Promise<StepCompletionResult> {
  const db = await requireAdminClient();
  const now = new Date().toISOString();

  const { error: progressError } = await db.from('lesson_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      enrollment_id: enrollmentId,
      completed: true,
      completed_at: now,
      time_spent_seconds: Math.max(0, timeSpentSeconds),
      updated_at: now,
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

  const [{ data: allLessons, error: lessonsError }, { data: completedLessons, error: completedError }] =
    await Promise.all([
      db
        .from('course_lessons')
        .select('id')
        .eq('course_id', courseId)
        .eq('is_required', true)
        .eq('is_published', true),
      db
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true),
    ]);
  if (lessonsError) throw lessonsError;
  if (completedError) throw completedError;

  const requiredLessonIds = new Set((allLessons ?? []).map((lesson) => lesson.id));
  const completedCount = new Set(
    (completedLessons ?? [])
      .map((row) => row.lesson_id)
      .filter((lessonId) => requiredLessonIds.has(lessonId)),
  ).size;
  const totalLessons = requiredLessonIds.size;
  const progressPercent = calcProgressPercent(completedCount, totalLessons);
  const courseCompleted = isCourseComplete(progressPercent, totalLessons);

  return {
    lessonId,
    courseId,
    progressPercent,
    courseCompleted,
    certificateIssued: false,
    certificateNumber: null,
  };
}

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
    .eq('lesson_id', lessonId)
    .eq('course_id', courseId);
  if (error) throw new Error(`recordStepUncompletion: ${error.message}`);

  const [{ data: allLessons, error: lessonsError }, { data: completedLessons, error: completedError }] =
    await Promise.all([
      db
        .from('course_lessons')
        .select('id')
        .eq('course_id', courseId)
        .eq('is_required', true)
        .eq('is_published', true),
      db
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true),
    ]);
  if (lessonsError) throw lessonsError;
  if (completedError) throw completedError;

  const requiredLessonIds = new Set((allLessons ?? []).map((lesson) => lesson.id));
  const completedCount = new Set(
    (completedLessons ?? [])
      .map((row) => row.lesson_id)
      .filter((completedLessonId) => requiredLessonIds.has(completedLessonId)),
  ).size;

  return { progressPercent: calcProgressPercent(completedCount, requiredLessonIds.size) };
}

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

  if (options?.supabase) {
    const { data, error } = await options.supabase.rpc('record_checkpoint_attempt', {
      p_lesson_id: lessonId,
      p_course_id: courseId,
      p_module_order: resolvedModuleOrder,
      p_score: score,
      p_passing_score: passingScore,
      p_answers: answers,
    });
    if (error) throw new Error(`recordCheckpointAttempt: ${error.message}`);

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
  const { data: prior, error: priorError } = await admin
    .from('checkpoint_scores')
    .select('attempt_number')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (priorError) throw priorError;

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
  if (error) throw new Error(`recordCheckpointAttempt: ${error.message}`);

  return { lessonId, score, passed, passingScore, attemptNumber };
}

export { checkCourseCompletion, getCourseProgress, type CourseCompletionStatus } from '@/lib/course-completion';

export {
  startCredentialAttempt,
  resolvePaymentResponsibility,
  getLearnerCredentialLifecycle,
  issueCompletionCertificate,
  checkCertificateIssuanceEligibility,
} from '@/lib/services/credential-pipeline';
