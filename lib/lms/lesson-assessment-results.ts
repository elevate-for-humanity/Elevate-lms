import 'server-only';

import type { SupabaseClient } from '@/lib/supabase';

/** Read the assessment ledger written by /api/lessons/[lessonId]/checkpoint. */
export async function loadLessonAssessmentResults(
  db: SupabaseClient,
  userId: string,
  courseIds: string[],
) {
  if (!courseIds.length) return [];
  const { data: lessons, error: lessonError } = await db
    .from('course_lessons')
    .select('id,course_id,title,lesson_type,passing_score,order_index')
    .in('course_id', courseIds)
    .eq('is_published', true)
    .or('lesson_type.in.(checkpoint,quiz,exam),quiz_questions.not.eq.[]')
    .order('order_index');
  if (lessonError) throw lessonError;
  const { data: attempts, error: attemptError } = await db
    .from('checkpoint_scores')
    .select('lesson_id,score,passed,created_at')
    .eq('user_id', userId)
    .in('course_id', courseIds)
    .order('created_at', { ascending: false });
  if (attemptError) throw attemptError;
  return (lessons || []).map((lesson) => {
    const scores = (attempts || []).filter((attempt) => attempt.lesson_id === lesson.id);
    return {
      ...lesson,
      attempts: scores.length,
      lastAttemptAt: scores[0]?.created_at || null,
      bestScore: scores.length ? Math.max(...scores.map((attempt) => Number(attempt.score))) : null,
      passed: scores.some((attempt) => attempt.passed === true),
    };
  });
}
