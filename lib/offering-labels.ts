/**
 * Canonical offering taxonomy for user-facing labels.
 *
 * Programs   = funded ETPL / workforce pathways (WIOA, WRG, WorkOne eligible)
 * Short-Term Courses = direct-purchase, standalone courses (NRF, CareerSafe, HSI)
 * Certification / Testing = exam issuers only (Certiport)
 * Curriculum Partner = content/platform partners
 *
 * provider_type values come from partner_lms_providers.provider_type in Supabase.
 */

export type OfferingKind =
  | 'program'
  | 'short_term_course'
  | 'credential_partner'
  | 'curriculum_partner';

/** Map provider_type DB values → OfferingKind */
const PROVIDER_TYPE_MAP: Record<string, OfferingKind> = {
  // Short-term direct-purchase courses
  nrf:         'short_term_course',
  careersafe:  'short_term_course',
  hsi:         'short_term_course',
  // Credential / testing infrastructure
  certiport:   'credential_partner',
  // Curriculum / content partners
  // milady removed — theory delivered via Elevate LMS
  // Funded workforce pathways — default
  etpl:        'program',
  wioa:        'program',
  workforce:   'program',
};

export function getOfferingKind(providerType: string | null | undefined): OfferingKind {
  if (!providerType) return 'short_term_course';
  return PROVIDER_TYPE_MAP[providerType.toLowerCase()] ?? 'short_term_course';
}

/** User-facing display label */
export function offeringLabel(kind: OfferingKind): string {
  switch (kind) {
    case 'program':           return 'Funding Eligible Program';
    case 'short_term_course': return 'Short-Term Course';
    case 'credential_partner':return 'Certification / Testing';
    case 'curriculum_partner':return 'Curriculum Partner';
  }
}

/** CTA label for enrollment button */
export function offeringCTA(kind: OfferingKind): string {
  switch (kind) {
    case 'program':           return 'Check Eligibility';
    case 'short_term_course': return 'Enroll Now';
    case 'credential_partner':return 'Request Voucher';
    case 'curriculum_partner':return 'Learn More';
  }
}

/** Sub-label shown under the CTA */
export function offeringSubLabel(kind: OfferingKind): string {
  switch (kind) {
    case 'program':           return 'Not available for direct online purchase';
    case 'short_term_course': return 'Direct Purchase · Login Required to Enroll';
    case 'credential_partner':return 'Exam voucher issued after program completion';
    case 'curriculum_partner':return 'Included with program enrollment';
  }
}
