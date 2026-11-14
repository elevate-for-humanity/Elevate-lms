import { resolveCanonicalSlug } from '@/lib/programs/slug';
import type { SupabaseClient } from '@/lib/supabase';
import { isWithdrawnProgram } from './withdrawn-programs.mjs';

export type ProgramEnrollmentState = 'open' | 'waitlist' | 'closed';

/**
 * Resolve the enrollment state for a program from the DB.
 *
 * This is the single source of truth for program state enforcement.
 * All API routes that accept intake (applications, waitlist, enroll) must
 * call this before processing any submission.
 *
 * Missing programs are closed; database failures propagate to the caller.
 */
export async function getProgramEnrollmentState(
  supabase: SupabaseClient,
  programSlug: string,
): Promise<ProgramEnrollmentState> {
  if (isWithdrawnProgram(programSlug)) return 'closed';
  const { data, error } = await supabase
    .from('programs')
    .select('enrollment_state')
    .eq('slug', resolveCanonicalSlug(programSlug))
    .maybeSingle();

  if (error) throw error;
  if (!data) return 'closed';

  const state = data.enrollment_state as string;
  if (state === 'waitlist' || state === 'closed') return state;
  return 'open';
}

/**
 * Check whether a program has an active waitlist.
 * Returns true only when enrollment_state === 'waitlist' AND waitlist_enabled === true.
 */
export async function isProgramWaitlistEnabled(
  supabase: SupabaseClient,
  programSlug: string,
): Promise<boolean> {
  if (isWithdrawnProgram(programSlug)) return false;
  const { data, error } = await supabase
    .from('programs')
    .select('enrollment_state, waitlist_enabled')
    .eq('slug', resolveCanonicalSlug(programSlug))
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;
  return data.enrollment_state === 'waitlist' && data.waitlist_enabled === true;
}
