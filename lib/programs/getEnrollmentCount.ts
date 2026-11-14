/**
 * Returns the active enrollment count for a program slug.
 * Used by public program pages to show live learner counts.
 * Returns 0 on any error — never throws.
 */
import { requireAdminClient } from '@/lib/supabase/admin';

export async function getEnrollmentCount(programSlug: string): Promise<number> {
  try {
    const db = await requireAdminClient();
    // Resolve program id from slug
    const { data: program } = await db
      .from('programs')
      .select('id')
      .eq('slug', programSlug)
      .maybeSingle();

    if (!program?.id) return 0;

    const { count } = await db
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program.id)
      .eq('status', 'active');

    return count ?? 0;
  } catch {
    return 0;
  }
}
