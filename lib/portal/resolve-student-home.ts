import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ACTIVE_ENROLLMENT_STATES,
  portalPathForProgramSlug,
  portalTypeForProgramSlug,
} from '@/lib/portal/apprenticeship-portal-paths';
import { PORTAL_PATHS, PORTAL_FALLBACK, type PortalKey } from '@/lib/portal/router';

const MARKETING_URL = 'https://www.elevateforhumanity.org';

/** Prefix a portal path with the marketing origin so it resolves to www, not app. */
function marketingUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${MARKETING_URL}${path}`;
}

/**
 * Resolves where a student should land after login.
 * Priority: (1) program_slug in active enrollment, (2) program lookup by program_id,
 * (3) cached portal_type, (4) student default.
 */
export async function resolveStudentHomePath(
  supabase: SupabaseClient,
  userId: string,
  cachedPortalType?: string | null,
): Promise<string> {
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('program_slug, program_id')
    .eq('user_id', userId)
    .in('enrollment_state', [...ACTIVE_ENROLLMENT_STATES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Try program_slug directly first
  let slugPath = portalPathForProgramSlug(enrollment?.program_slug);
  if (slugPath) {
    const portalType = portalTypeForProgramSlug(enrollment?.program_slug);
    if (portalType) {
      await supabase.from('profiles').update({ portal_type: portalType }).eq('id', userId);
    }
    return marketingUrl(slugPath);
  }

  // Fallback: look up program by program_id if program_slug is empty
  if (enrollment?.program_id) {
    const { data: program } = await supabase
      .from('programs')
      .select('slug')
      .eq('id', enrollment.program_id)
      .maybeSingle();

    if (program?.slug) {
      slugPath = portalPathForProgramSlug(program.slug);
      if (slugPath) {
        const portalType = portalTypeForProgramSlug(program.slug);
        if (portalType) {
          await supabase.from('profiles').update({ portal_type: portalType }).eq('id', userId);
        }
        return marketingUrl(slugPath);
      }
    }
  }

  // Try cached portal_type
  if (cachedPortalType) {
    const canonical = PORTAL_PATHS[cachedPortalType as PortalKey];
    if (canonical) return marketingUrl(canonical);
    // Per-program portal_type values (barber, cosmetology, …)
    if (/^[a-z0-9-]+$/.test(cachedPortalType)) {
      return marketingUrl(`/portal/${cachedPortalType}`);
    }
  }

  return marketingUrl(PORTAL_FALLBACK);
}
