import type { SupabaseClient } from '@supabase/supabase-js';
import { theoryDateInTimeZone } from '@/lib/beauty-apprenticeship/daily-theory';

/**
 * Returns whether RTI/theory hours may be credited for the user on the given date.
 * If table is missing (migration not applied), allows credit (fail-open for dev).
 */
export async function canCreditTheoryHoursForDate(
  db: SupabaseClient,
  userId: string,
  programSlug: string,
  theoryDate?: string,
): Promise<{ allowed: boolean; bestScore: number | null; reason?: string }> {
  const date = theoryDate ?? theoryDateInTimeZone();
  const { data, error } = await db
    .from('apprenticeship_daily_theory')
    .select('passed, best_score')
    .eq('user_id', userId)
    .eq('program_slug', programSlug)
    .eq('theory_date', date)
    .maybeSingle();

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === '42P01' || error.message?.includes('does not exist')) {
      return { allowed: true, bestScore: null };
    }
    return { allowed: false, bestScore: null, reason: error.message };
  }

  if (data?.passed === true) {
    return { allowed: true, bestScore: Number(data.best_score) };
  }

  return {
    allowed: false,
    bestScore: data?.best_score != null ? Number(data.best_score) : null,
    reason: 'daily_theory_not_passed',
  };
}
