/**
 * getLearnerProgress
 *
 * Fetches all progress state for a learner in a course in a single pass:
 * - lesson_progress rows
 * - checkpoint_scores (best passing attempt per lesson)
 * - step_submissions (latest per lesson)
 * - program_completion_certificates (to detect certified state)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  LearnerProgress, LessonProgress, CheckpointScore, StepSubmission,
} from './types';

export async function getLearnerProgress(
  userId: string,
  courseId: string
): Promise<LearnerProgress> {
  const db = createAdminClient();

  const [
    { data: progressRows },
    { data: checkpointRows },
    { data: submissionRows },
    { data: certRow },
    { data: allLessons },
  ] = await Promise.all([
    db
      .from('lesson_progress')
      .select('lesson_id, completed, completed_at, time_spent_seconds')
      .eq('user_id', userId)
      .eq('course_id', courseId),

    db
      .from('checkpoint_scores')
      .select('lesson_id, score, passed, passing_score, attempt_number, created_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('attempt_number', { ascending: false }),

    db
      .from('step_submissions')
      .select('id, lesson_id, status, created_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false }),

    db
      .from('program_completion_certificates')
      .select('certificate_number')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle(),

    db
      .from('course_lessons')
      .select('id')
      .eq('course_id', courseId),
  ]);

  // Completed lesson IDs
  const completedLessonIds = new Set<string>(
    (progressRows ?? [])
      .filter((r: any) => r.completed)
      .map((r: any) => r.lesson_id)
  );

  // Best checkpoint score per lesson (first row = highest attempt_number due to desc order)
  const checkpointScores = new Map<string, CheckpointScore>();
  for (const row of checkpointRows ?? []) {
    if (!checkpointScores.has(row.lesson_id)) {
      checkpointScores.set(row.lesson_id, {
        lessonId:      row.lesson_id,
        score:         row.score,
        passed:        row.passed,
        passingScore:  row.passing_score,
        attemptNumber: row.attempt_number,
        createdAt:     row.created_at,
      });
    }
  }

  // Latest submission per lesson
  const stepSubmissions = new Map<string, StepSubmission>();
  for (const row of submissionRows ?? []) {
    if (!stepSubmissions.has(row.lesson_id)) {
      stepSubmissions.set(row.lesson_id, {
        id:        row.id,
        lessonId:  row.lesson_id,
        status:    row.status,
        createdAt: row.created_at,
      });
    }
  }

  const totalLessons = allLessons?.length ?? 0;
  const progressPercent = totalLessons > 0
    ? Math.round((completedLessonIds.size / totalLessons) * 100)
    : 0;

  return {
    userId,
    courseId,
    completedLessonIds,
    checkpointScores,
    stepSubmissions,
    progressPercent,
    courseCompleted: progressPercent === 100 && totalLessons > 0,
    certificateNumber: certRow?.certificate_number ?? null,
  };
}
