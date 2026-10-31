import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Legacy quiz IDs are integers; current learner/course IDs are UUIDs.
 * There is no quiz_attempts -> quizzes foreign key in production, so a
 * PostgREST embedded join fails even when the learner has no attempts.
 */
export async function loadLearnerQuizGrades(db: SupabaseClient, userId: string) {
  const { data: attempts, error } = await db
    .from('quiz_attempts')
    .select('id,quiz_id,course_id,score,completed_at,submitted_at')
    .eq('user_uuid', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });
  if (error) throw error;
  const quizIds = [...new Set((attempts || []).map(row => row.quiz_id).filter(id => id != null))];
  if (!quizIds.length) return [];
  const { data: quizzes, error: quizError } = await db
    .from('quizzes')
    .select('id,title')
    .in('id', quizIds);
  if (quizError) throw quizError;
  const titles = new Map((quizzes || []).map(quiz => [quiz.id, quiz.title]));
  return (attempts || []).map(attempt => ({
    ...attempt,
    completed_at: attempt.completed_at || attempt.submitted_at,
    quizzes: { title: titles.get(attempt.quiz_id) || 'Quiz' },
  }));
}
