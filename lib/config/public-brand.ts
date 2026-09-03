/**
 * Canonical public-facing institute identity (marketing + compliance copy).
 */

export const PUBLIC_ORG_SHORT = 'Elevate for Humanity';

export const PUBLIC_INSTITUTE_NAME =
  'Elevate for Humanity Career & Technical Institute';

export function publicOrgAlt(suffix: string): string {
  return suffix ? `${PUBLIC_ORG_SHORT} ${suffix}` : PUBLIC_ORG_SHORT;
}
