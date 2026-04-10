/**
 * updateProgramProgress — writes a durable summary row to lms_progress
 * after any LMS activity (quiz submit, lesson complete, assignment submit).
 *
 * Reads from the engine's getLearnerProgress so the calculation is
 * consistent with the rest of the system.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { getLearnerProgress } from '@/lib/lms/engine';
import { logger } from '@/lib/logger';

/**
 * Recalculates and persists progress for a user+course pair.
 * Safe to call after every LMS mutation — idempotent via upsert.
 *
 * @param userId     - auth.users.id
 * @param courseId   - courses.id
 */
export async function updateProgramProgress(
  userId: string,
  courseId: string,
): Promise<void> {
  const db = await getAdminClient();
  if (!db) {
    logger.error('updateProgramProgress: admin client unavailable');
    return;
  }

  let progressPercent = 0;
  let courseCompleted = false;

  try {
    const progress = await getLearnerProgress(userId, courseId);
    progressPercent = progress.progressPercent;
    courseCompleted = progress.courseCompleted;
  } catch (err) {
    logger.error('updateProgramProgress: getLearnerProgress failed', err instanceof Error ? err : undefined);
    // Do not throw — progress update is best-effort and must not block the caller
    return;
  }

  const { error } = await db
    .from('lms_progress')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        progress_percent: progressPercent,
        status: courseCompleted ? 'completed' : 'in_progress',
        last_activity_at: new Date().toISOString(),
        ...(courseCompleted ? { completed_at: new Date().toISOString() } : {}),
      },
      { onConflict: 'user_id,course_id' },
    );

  if (error) {
    logger.error('updateProgramProgress: upsert failed', error);
    // Do not throw — caller must not fail because of a progress write
  }
}

/**
 * Resolves the course_id for a quiz, then calls updateProgramProgress.
 * Use this from quiz submit where only the quiz_id is known.
 *
 * @param userId  - auth.users.id
 * @param quizId  - quizzes.id  (or course_lessons.id for checkpoint quizzes)
 */
export async function updateProgressAfterQuiz(
  userId: string,
  quizId: string,
): Promise<void> {
  const db = await getAdminClient();
  if (!db) return;

  // Try quizzes table first
  const { data: quiz } = await db
    .from('quizzes')
    .select('course_id, lesson_id')
    .eq('id', quizId)
    .maybeSingle();

  let courseId: string | null = quiz?.course_id ?? null;

  // Resolve via lesson → module → course if course_id is missing
  if (!courseId && quiz?.lesson_id) {
    const { data: lesson } = await db
      .from('curriculum_lessons')
      .select('module_id')
      .eq('id', quiz.lesson_id)
      .maybeSingle();

    if (lesson?.module_id) {
      const { data: mod } = await db
        .from('course_modules')
        .select('course_id')
        .eq('id', lesson.module_id)
        .maybeSingle();
      courseId = mod?.course_id ?? null;
    }
  }

  // Fallback: treat quizId as a course_lessons.id (checkpoint quiz)
  if (!courseId) {
    const { data: cl } = await db
      .from('course_lessons')
      .select('course_id')
      .eq('id', quizId)
      .maybeSingle();
    courseId = cl?.course_id ?? null;
  }

  if (!courseId) {
    logger.error(`updateProgressAfterQuiz: could not resolve course_id for quiz ${quizId}`);
    return;
  }

  await updateProgramProgress(userId, courseId);
}
