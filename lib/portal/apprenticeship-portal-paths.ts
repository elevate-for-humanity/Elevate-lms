import { LMS_HOST } from '@/lib/routing/portal-map';

/**
 * Apprenticeship program slugs all resolve to the single operational
 * /apprentice dashboard. Program context is retained as a query parameter;
 * no program owns a separate dashboard implementation.
 */
export const APPRENTICESHIP_SLUG_TO_PORTAL_PATH: Record<string, string> = {
  'barber-apprenticeship': `${LMS_HOST}/apprentice?program=barber-apprenticeship`,
  'cosmetology-apprenticeship': `${LMS_HOST}/apprentice?program=cosmetology-apprenticeship`,
  'esthetician-apprenticeship': `${LMS_HOST}/apprentice?program=esthetician-apprenticeship`,
  'nail-technician-apprenticeship': `${LMS_HOST}/apprentice?program=nail-technician-apprenticeship`,
  'culinary-apprenticeship': `${LMS_HOST}/apprentice?program=culinary-apprenticeship`,
  electrical: `${LMS_HOST}/apprentice?program=electrical`,
  plumbing: `${LMS_HOST}/apprentice?program=plumbing`,
};

/** program_slug → profiles.portal_type value retained for database compatibility. */
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
  return APPRENTICESHIP_SLUG_TO_PORTAL_PATH[programSlug] ?? `${LMS_HOST}/apprentice`;
}

export function portalTypeForProgramSlug(programSlug: string | null | undefined): string | null {
  if (!programSlug) return null;
  return APPRENTICESHIP_SLUG_TO_PORTAL_TYPE[programSlug] ?? null;
}
