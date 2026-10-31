import type { SupabaseClient } from '@supabase/supabase-js';
import { APPRENTICESHIP_PORTAL_ENROLLMENT_STATES } from '@/lib/enrollment/enrollment-flow';
import { portalPathForProgramSlug } from '@/lib/portal/apprenticeship-portal-paths';
import { PORTAL_MAP } from '@/lib/routing/portal-map';

const STOPPED = new Set(['withdrawn', 'cancelled', 'rejected', 'revoked', 'suspended', 'inactive']);

/** Current enrollment beats profile caches, role aliases, and old bookmarks.
 * Resolves navigation only; every destination retains its authorization gate.
 */
export async function resolveAssignedLearnerHome(db: SupabaseClient, userId: string): Promise<string | null> {
  const states = APPRENTICESHIP_PORTAL_ENROLLMENT_STATES.join(',');
  const { data, error } = await db
    .from('program_enrollments')
    .select('program_slug,program_id,status,enrollment_state')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .or(`enrollment_state.in.(${states}),status.in.(${states})`)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  const enrollment = (data || []).find(row =>
    !STOPPED.has(String(row.status || '').toLowerCase()) &&
    !STOPPED.has(String(row.enrollment_state || '').toLowerCase()),
  );
  if (!enrollment) return null;
  let programSlug = enrollment.program_slug;
  let programType = '';
  if (enrollment.program_id && !portalPathForProgramSlug(programSlug)) {
    const { data: program, error: programError } = await db
      .from('programs')
      .select('slug,program_type')
      .eq('id', enrollment.program_id)
      .maybeSingle();
    if (programError) throw programError;
    programSlug ||= program?.slug;
    programType = program?.program_type || '';
  }
  const path = portalPathForProgramSlug(programSlug);
  if (path) {
    const url = new URL(path, PORTAL_MAP.lms.host);
    return url.pathname + url.search;
  }
  return programType.toLowerCase().trim() === 'apprenticeship'
    ? PORTAL_MAP.apprentice.defaultPath
    : PORTAL_MAP.lms.defaultPath;
}
