import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ACTIVE_ENROLLMENT_STATES,
  portalPathForProgramSlug,
  portalTypeForProgramSlug,
} from '@/lib/portal/apprenticeship-portal-paths';
import { PORTAL_PATHS, PORTAL_FALLBACK, type PortalKey } from '@/lib/portal/router';
import { LMS_HOST } from '@/lib/routing/portal-map';

const LEGACY_APPRENTICE_PORTAL_TYPES = new Set([
  'barber',
  'barber-apprentice',
  'barber_apprentice',
  'cosmetology',
  'cosmetology-apprentice',
  'cosmetology_apprentice',
  'esthetician',
  'nail-technician',
  'nail_technician',
  'culinary',
  'electrical',
  'plumbing',
]);

function appUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${LMS_HOST}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Resolves where a learner should land after login.
 * Apprentices always stay on the LMS host; legacy occupation portals collapse
 * into the single /apprentice runtime.
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

  let slugPath = portalPathForProgramSlug(enrollment?.program_slug);
  if (slugPath) {
    const portalType = portalTypeForProgramSlug(enrollment?.program_slug);
    if (portalType) {
      await supabase.from('profiles').update({ portal_type: portalType }).eq('id', userId);
    }
    return appUrl(slugPath);
  }

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
        return appUrl(slugPath);
      }
    }
  }

  const cached = String(cachedPortalType || '').trim().toLowerCase();
  if (cached) {
    if (LEGACY_APPRENTICE_PORTAL_TYPES.has(cached)) return appUrl('/apprentice');
    const canonical = PORTAL_PATHS[cached as PortalKey];
    if (canonical) return appUrl(canonical);
  }

  return appUrl(PORTAL_FALLBACK);
}
