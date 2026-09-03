import type { SupabaseClient } from '@/lib/supabase';

export type ProgramEnrollmentState = 'open' | 'waitlist' | 'closed';

/**
 * Resolve the enrollment state for a program from the DB.
 *
 * This is the single source of truth for program state enforcement.
 * All API routes that accept intake (applications, waitlist, enroll) must
 * call this before processing any submission.
 *
 * Falls back to 'open' if the program is not found, to preserve backward
 * compatibility with programs that predate the state engine.
 */
export async function getProgramEnrollmentState(
  supabase: SupabaseClient,
  programSlug: string,
): Promise<ProgramEnrollmentState> {
  const { data, error } = await supabase
    .from('programs')
    .select('enrollment_state')
    .eq('slug', programSlug)
    .maybeSingle();

  if (error || !data) {
    // Program not found or DB error — default to open for backward compat
    return 'open';
  }

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
  const { data, error } = await supabase
    .from('programs')
    .select('enrollment_state, waitlist_enabled')
    .eq('slug', programSlug)
    .maybeSingle();

  if (error || !data) return false;
  return data.enrollment_state === 'waitlist' && data.waitlist_enabled === true;
}
