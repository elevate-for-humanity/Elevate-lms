import type { SupabaseClient } from '@supabase/supabase-js';

/** Award definitions live in credential_registry, the award's actual FK target. */
export function loadEarnedCredentials(db: SupabaseClient, learnerId: string) {
  return db.from('learner_credentials')
    .select('id, issued_at, verification_code, credentials:credential_registry(name)')
    .eq('learner_id', learnerId)
    .eq('status', 'active')
    .order('issued_at', { ascending: false });
}

/** Legacy quiz IDs have no PostgREST relationship; resolve their titles explicitly. */
export async function loadRecentQuizAttempts(db: SupabaseClient, learnerId: string) {
  const attempts = await db.from('quiz_attempts')
    .select('id, score, passed, completed_at, quiz_id')
    .eq('user_uuid', learnerId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(5);
  if (attempts.error) return { data: null, error: attempts.error };
  const ids = [...new Set((attempts.data ?? []).map(row => row.quiz_id)
    .filter((id): id is number => typeof id === 'number'))];
  const titles = ids.length
    ? await db.from('quizzes').select('id, title').in('id', ids)
    : { data: [], error: null };
  // The attempt remains useful if a legacy quiz was deleted or its title is unavailable.
  const byId = new Map((titles.data ?? []).map(row => [row.id, row.title]));
  return {
    data: (attempts.data ?? []).map(row => ({
      ...row,
      quizzes: byId.has(row.quiz_id) ? { title: byId.get(row.quiz_id) } : null,
    })),
    error: titles.error,
  };
}
