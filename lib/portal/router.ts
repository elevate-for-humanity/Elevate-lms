/**
 * Portal Router
 * Single source of truth for field-based learner portal routing.
 */

import type { SupabaseClient } from '@/lib/supabase';

export type PortalKey =
  | 'apprentice'
  | 'healthcare'
  | 'technology'
  | 'business'
  | 'beauty'
  | 'trades'
  | 'social-services'
  | 'hospitality'
  | 'jri';

/**
 * Only /apprentice currently has a dedicated learner runtime. The former
 * /portal/* field pages are not present in apps/lms/app, so sending a valid
 * student session there produces a 404. Keep the field value as metadata while
 * routing standard learners through the canonical LMS dashboard.
 */
export const PORTAL_PATHS: Record<PortalKey, string> = {
  apprentice: '/apprentice',
  healthcare: '/lms/dashboard',
  technology: '/lms/dashboard',
  business: '/lms/dashboard',
  beauty: '/lms/dashboard',
  trades: '/lms/dashboard',
  'social-services': '/lms/dashboard',
  hospitality: '/lms/dashboard',
  jri: '/lms/dashboard',
};

/** Legacy occupation-specific profile values all resolve to the canonical apprentice portal. */
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

/** Canonical fallback for a learner with no specialized portal. */
export const PORTAL_FALLBACK = '/lms/dashboard';

const PROGRAM_TYPE_TO_PORTAL: Record<string, PortalKey> = {
  apprenticeship: 'apprentice',
};

const CATEGORY_TO_PORTAL: Record<string, PortalKey> = {
  beauty: 'beauty',
  'barber & beauty': 'beauty',
  healthcare: 'healthcare',
  'social services': 'social-services',
  technology: 'technology',
  business: 'business',
  trades: 'trades',
  hospitality: 'hospitality',
  special: 'jri',
};

export async function resolvePortalForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('portal_type, role')
      .eq('id', userId)
      .maybeSingle();

    const cachedPortalType = String(profile?.portal_type || '').trim().toLowerCase();
    if (cachedPortalType) {
      if (LEGACY_APPRENTICE_PORTAL_TYPES.has(cachedPortalType)) return PORTAL_PATHS.apprentice;
      const path = PORTAL_PATHS[cachedPortalType as PortalKey];
      if (path) return path;
    }

    if (['apprentice', 'barber_apprentice', 'cosmetology_apprentice'].includes(String(profile?.role || ''))) {
      return PORTAL_PATHS.apprentice;
    }

    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('program_id')
      .eq('user_id', userId)
      .in('enrollment_state', ['active', 'enrolled', 'onboarding', 'confirmed', 'orientation_complete', 'documents_complete'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!enrollment?.program_id) return PORTAL_FALLBACK;

    const { data: program } = await supabase
      .from('programs')
      .select('program_type, category')
      .eq('id', enrollment.program_id)
      .maybeSingle();

    if (!program) return PORTAL_FALLBACK;

    const portalKey = derivePortalKey(program.program_type, program.category);
    if (!portalKey) return PORTAL_FALLBACK;

    await supabase
      .from('profiles')
      .update({ portal_type: portalKey })
      .eq('id', userId);

    return PORTAL_PATHS[portalKey];
  } catch {
    return PORTAL_FALLBACK;
  }
}

export function derivePortalKey(
  programType: string | null | undefined,
  category: string | null | undefined,
): PortalKey | null {
  if (programType) {
    const byType = PROGRAM_TYPE_TO_PORTAL[programType.toLowerCase().trim()];
    if (byType) return byType;
  }

  if (category) {
    const normalised = category.toLowerCase().trim();
    const byCat = CATEGORY_TO_PORTAL[normalised];
    if (byCat) return byCat;
  }

  return null;
}

export async function cachePortalTypeForEnrollment(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
): Promise<void> {
  try {
    const { data: program } = await supabase
      .from('programs')
      .select('program_type, category')
      .eq('id', programId)
      .maybeSingle();

    if (!program) return;

    const portalKey = derivePortalKey(program.program_type, program.category);
    if (!portalKey) return;

    await supabase
      .from('profiles')
      .update({ portal_type: portalKey })
      .eq('id', userId);
  } catch {
    // portal_type is a cache, not an enrollment gate
  }
}
