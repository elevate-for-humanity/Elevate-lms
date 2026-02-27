/**
 * RAPIDS Registration Configuration
 * 
 * Centralized source of truth for USDOL Registered Apprenticeship data.
 * This file is the authoritative reference for all RAPIDS-related information.
 */

export const RAPIDS_CONFIG = {
  // Sponsor Information
  // RAPIDS registered sponsor is the legal entity; brand is the program name
  sponsorOfRecord: '2Exclusive LLC-S', // Legal entity on RAPIDS registration
  programBrand: 'Elevate for Humanity Career & Technical Institute', // DBA of 2Exclusive LLC-S
  
  // Registration Details
  registrationId: process.env.RAPIDS_REGISTRATION_ID || '2025-IN-132301',
  programNumber: process.env.NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER || '2025-IN-132301',
  
  // Program Details
  programs: {
    barber: {
      slug: 'barber-apprenticeship',
      name: 'Barber Apprenticeship',
      occupation: 'Barber',
      occupationCode: '330.371-010', // DOT code
      state: 'IN',
      totalHours: 2000,
      relatedInstructionHours: 144,
      fundingType: 'self_pay',
      tuition: 4980,
    },
  },
  
  // State Information
  state: 'Indiana',
  stateCode: 'IN',
  licensingAgency: 'Indiana Professional Licensing Agency',
  
  // Compliance Flags
  isStateFunded: false,
  wagesGuaranteed: false,
  employmentGuaranteed: false,
} as const;

/**
 * Get RAPIDS metadata for Stripe checkout sessions (internal audit trail)
 */
export function getRAPIDSMetadata(programSlug: string) {
  const program = Object.values(RAPIDS_CONFIG.programs).find(
    p => p.slug === programSlug
  );
  
  if (!program) return null;
  
  return {
    rapids_sponsor_legal: RAPIDS_CONFIG.sponsorOfRecord, // Legal entity on RAPIDS
    rapids_program_brand: RAPIDS_CONFIG.programBrand, // Program brand name
    rapids_program: program.name,
    rapids_state: RAPIDS_CONFIG.stateCode,
    rapids_registration_id: RAPIDS_CONFIG.registrationId, // Internal only
    rapids_occupation_code: program.occupationCode,
    funding_type: program.fundingType,
  };
}

/**
 * Get RAPIDS enrollment data for database records
 */
export function getRAPIDSEnrollmentData(programSlug: string) {
  const program = Object.values(RAPIDS_CONFIG.programs).find(
    p => p.slug === programSlug
  );
  
  if (!program) return null;
  
  return {
    rapids_sponsor: RAPIDS_CONFIG.sponsorOfRecord,
    rapids_program: program.name,
    rapids_state: RAPIDS_CONFIG.stateCode,
    rapids_registration_on_file: true,
    rapids_occupation_code: program.occupationCode,
    total_hours_required: program.totalHours,
    related_instruction_hours: program.relatedInstructionHours,
  };
}

/**
 * Check if a program is RAPIDS-registered
 */
export function isRAPIDSProgram(programSlug: string): boolean {
  return Object.values(RAPIDS_CONFIG.programs).some(
    p => p.slug === programSlug
  );
}

/**
 * Get public-safe registration details (no sensitive IDs or registration numbers)
 */
export function getPublicRegistrationDetails() {
  return {
    sponsorLegalEntity: RAPIDS_CONFIG.sponsorOfRecord,
    programBrand: RAPIDS_CONFIG.programBrand,
    publicStatement: `${RAPIDS_CONFIG.programBrand} is a DBA of ${RAPIDS_CONFIG.sponsorOfRecord}, the registered Sponsor of Record.`,
    state: RAPIDS_CONFIG.state,
    isStateFunded: RAPIDS_CONFIG.isStateFunded,
    licensingAgency: RAPIDS_CONFIG.licensingAgency,
    registrationAvailable: 'upon request',
  };
}
