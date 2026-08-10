/**
 * Canonical apprenticeship portal destinations.
 *
 * All apprenticeship occupations use the LMS /apprentice workspace. The
 * program query parameter is context only; the authenticated enrollment record
 * remains authoritative. Historical /portal/<trade> URLs are compatibility
 * redirects in the Marketing Next config.
 */

export const APPRENTICESHIP_SLUG_TO_PORTAL_PATH: Record<string, string> = {
  'barber-apprenticeship': '/apprentice?program=barber-apprenticeship',
  'cosmetology-apprenticeship': '/apprentice?program=cosmetology-apprenticeship',
  'esthetician-apprenticeship': '/apprentice?program=esthetician-apprenticeship',
  'nail-technician-apprenticeship': '/apprentice?program=nail-technician-apprenticeship',
  'culinary-apprenticeship': '/apprentice?program=culinary-apprenticeship',
  electrical: '/apprentice?program=electrical',
  plumbing: '/apprentice?program=plumbing',
};

/** program_slug → profiles.portal_type compatibility value. */
export const APPRENTICESHIP_SLUG_TO_PORTAL_TYPE: Record<string, string> = {
  'barber-apprenticeship': 'barber',
  'cosmetology-apprenticeship': 'cosmetology',
  'esthetician-apprenticeship': 'esthetician',
  'nail-technician-apprenticeship': 'nail-technician',
  'culinary-apprenticeship': 'culinary',
  electrical: 'electrical',
  plumbing: 'plumbing',
};

export const ACTIVE_ENROLLMENT_STATES = [
  'active',
  'enrolled',
  'onboarding',
  'confirmed',
  'orientation_complete',
  'documents_complete',
] as const;

export function portalPathForProgramSlug(programSlug: string | null | undefined): string | null {
  if (!programSlug) return null;
  return APPRENTICESHIP_SLUG_TO_PORTAL_PATH[programSlug] ?? null;
}

export function portalTypeForProgramSlug(programSlug: string | null | undefined): string | null {
  if (!programSlug) return null;
  return APPRENTICESHIP_SLUG_TO_PORTAL_TYPE[programSlug] ?? null;
}
