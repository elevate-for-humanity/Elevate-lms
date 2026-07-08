/**
 * Per-program apprenticeship portal URLs.
 * Used by login, learner dashboard, and portal router — keep in sync.
 */

export const APPRENTICESHIP_SLUG_TO_PORTAL_PATH: Record<string, string> = {
  'barber-apprenticeship': '/portal/barber',
  'cosmetology-apprenticeship': '/portal/cosmetology',
  'esthetician-apprenticeship': '/portal/esthetician',
  'nail-technician-apprenticeship': '/portal/nail-technician',
  'culinary-apprenticeship': '/portal/culinary',
  electrical: '/portal/electrical',
  plumbing: '/portal/plumbing',
};

/** program_slug → profiles.portal_type value (see migration 20260526000002) */
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
