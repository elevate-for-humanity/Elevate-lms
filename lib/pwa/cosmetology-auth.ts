/**
 * Affirmative program authorization for cosmetology PWA routes.
 *
 * Returns the enrollment record if the user is an active cosmetology apprentice.
 * Returns null if the user is authenticated but not enrolled in this program.
 * Callers must return 403 on null — not empty data.
 */
import { SupabaseClient } from '@supabase/supabase-js';

export async function requireCosmetologyEnrollment(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string; enrolled_at: string } | null> {
  const { data } = await supabase
    .from('program_enrollments')
    .select('id, enrolled_at, programs!inner(slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('programs.slug', 'cosmetology-apprenticeship')
    .limit(1)
    .single();

  return data ?? null;
}
