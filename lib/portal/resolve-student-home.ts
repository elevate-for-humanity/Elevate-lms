import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ACTIVE_ENROLLMENT_STATES,
  portalPathForProgramSlug,
  portalTypeForProgramSlug,
} from '@/lib/portal/apprenticeship-portal-paths';
import { PORTAL_PATHS, PORTAL_FALLBACK, type PortalKey } from '@/lib/portal/router';

/**
 * Resolves where a student should land after login.
 * Apprenticeship program_slug wins over generic portal_type `apprentice`.
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

  const slugPath = portalPathForProgramSlug(enrollment?.program_slug);
  if (slugPath) {
    const portalType = portalTypeForProgramSlug(enrollment?.program_slug);
    if (portalType) {
      await supabase.from('profiles').update({ portal_type: portalType }).eq('id', userId);
    }
    return slugPath;
  }

  if (cachedPortalType) {
    const canonical = PORTAL_PATHS[cachedPortalType as PortalKey];
    if (canonical) return canonical;
    // Per-program portal_type values (barber, cosmetology, …)
    if (/^[a-z0-9-]+$/.test(cachedPortalType)) {
      return `/portal/${cachedPortalType}`;
    }
  }

  return PORTAL_FALLBACK;
}
