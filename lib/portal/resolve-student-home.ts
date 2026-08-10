import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ACTIVE_ENROLLMENT_STATES,
  portalPathForProgramSlug,
  portalTypeForProgramSlug,
} from '@/lib/portal/apprenticeship-portal-paths';
import { PORTAL_PATHS, PORTAL_FALLBACK, type PortalKey } from '@/lib/portal/router';
import { LMS_HOST, MARKETING_HOST } from '@/lib/routing/portal-map';

function absolutePortalUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (path === '/apprentice' || path.startsWith('/apprentice?') || path.startsWith('/lms/')) {
    return `${LMS_HOST}${path}`;
  }
  return `${MARKETING_HOST}${path}`;
}

/**
 * Resolve the post-login learner destination from the canonical enrollment.
 * Apprenticeship routes always land on the LMS /apprentice workspace; legacy
 * per-trade portal_type values are retained only as program context.
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
    return absolutePortalUrl(slugPath);
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
        return absolutePortalUrl(slugPath);
      }
    }
  }

  if (cachedPortalType) {
    const canonical = PORTAL_PATHS[cachedPortalType as PortalKey];
    if (canonical) return absolutePortalUrl(canonical);

    // Historical per-program portal_type values should no longer recreate a
    // Marketing /portal/<trade> route. Resolve them back to the canonical LMS
    // apprentice workspace instead.
    const slugByPortalType: Record<string, string> = {
      barber: 'barber-apprenticeship',
      cosmetology: 'cosmetology-apprenticeship',
      esthetician: 'esthetician-apprenticeship',
      'nail-technician': 'nail-technician-apprenticeship',
      culinary: 'culinary-apprenticeship',
      electrical: 'electrical',
      plumbing: 'plumbing',
    };
    const cachedSlug = slugByPortalType[cachedPortalType];
    if (cachedSlug) return `${LMS_HOST}/apprentice?program=${encodeURIComponent(cachedSlug)}`;
  }

  return absolutePortalUrl(PORTAL_FALLBACK);
}
