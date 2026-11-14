import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveCanonicalSlug } from '@/lib/programs/slug';

/** A dated course URL is not the authority for its registered program. */
export async function resolveCourseProgramSlug(
  db: SupabaseClient,
  course: { slug?: string | null; program_id?: string | null },
  requestedSlug?: string,
) {
  const requested = resolveCanonicalSlug(requestedSlug || '');
  if (!course.program_id) return requested || resolveCanonicalSlug(course.slug || '');
  const { data, error } = await db.from('programs').select('slug').eq('id', course.program_id).single();
  if (error) throw error;
  if (!data?.slug) throw new Error('COURSE_PROGRAM_IDENTITY_MISSING');
  const canonical = resolveCanonicalSlug(data.slug);
  if (requested && requested !== canonical) throw new Error('COURSE_PROGRAM_IDENTITY_MISMATCH');
  return canonical;
}
