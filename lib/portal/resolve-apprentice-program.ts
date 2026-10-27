import 'server-only';

import type { SupabaseClient } from '@/lib/supabase';

/**
 * Resolve the apprentice's canonical program from enrollment data.
 *
 * IMPORTANT: apprentice authorization must come from program_enrollments, not
 * from a hard-coded list of program slugs or a program-specific billing table.
 * The runtime context uses the same identity model (user_id OR student_id).
 */
export async function resolveApprenticeProgramSlug(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: enrollment, error } = await supabase
    .from('program_enrollments')
    .select('program_slug,status,enrollment_state,created_at')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .not('program_slug', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  const activeStates = new Set(['active', 'enrolled', 'in_progress', 'confirmed']);
  const active = (enrollment || []).find((row: any) => {
    const status = String(row.status || row.enrollment_state || '').toLowerCase();
    return activeStates.has(status);
  });

  if (active?.program_slug) return String(active.program_slug);

  // Backward compatibility for legacy records that predate normalized status
  // values. Presence of a real enrollment still establishes portal identity;
  // downstream runtime checks determine which operational actions are enabled.
  const legacy = (enrollment || []).find((row: any) => row.program_slug);
  return legacy?.program_slug ? String(legacy.program_slug) : null;
}
