import { APPENDIX_A_REGISTRATION, APPENDIX_A_STANDARDS } from '@/lib/compliance/appendix-a-standards';

const BARBER_APPENDIX = APPENDIX_A_STANDARDS.barber;

/**
 * RAPIDS Registration Configuration
 *
 * IMPORTANT: Appendix A is the authoritative source for occupation-specific
 * DOL apprenticeship requirements. Do not duplicate RTI hours, competency
 * counts, wage progression, ratio, or probation values here.
 */
export const RAPIDS_CONFIG = {
  sponsorOfRecord: APPENDIX_A_REGISTRATION.sponsor,
  programBrand: 'Elevate for Humanity Career & Technical Institute',

  registrationId: process.env.RAPIDS_REGISTRATION_ID || APPENDIX_A_REGISTRATION.registrationNumber,
  programNumber: process.env.NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER || APPENDIX_A_REGISTRATION.registrationNumber,
  registrationDate: APPENDIX_A_REGISTRATION.registrationDate,
  revisionDate: APPENDIX_A_REGISTRATION.revisionDate,

  programs: {
    barber: {
      slug: BARBER_APPENDIX.programSlugs[0],
      name: 'Barber Apprenticeship',
      occupation: BARBER_APPENDIX.occupationTitle,
      occupationCode: BARBER_APPENDIX.onetSocCode,
      rapidsCode: BARBER_APPENDIX.rapidsCode,
      state: 'IN',
      approach: BARBER_APPENDIX.approach,
      competencyCount: BARBER_APPENDIX.competencyCount,
      relatedInstructionHours: BARBER_APPENDIX.relatedInstructionHours,
      apprenticeToMentorRatio: BARBER_APPENDIX.apprenticeToMentorRatio,
      probationaryHours: BARBER_APPENDIX.probationaryHours,
      startingHourlyRate: BARBER_APPENDIX.startingHourlyRate,
      mentorHourlyRate: BARBER_APPENDIX.mentorHourlyRate,
      wageMilestones: BARBER_APPENDIX.wageMilestones,
      relatedInstruction: BARBER_APPENDIX.relatedInstruction,
      competencies: BARBER_APPENDIX.competencies,
      rtiProvider: BARBER_APPENDIX.rtiProvider,
      fundingType: 'self_pay',
      tuition: 4980,
    },
  },

  state: 'Indiana',
  stateCode: 'IN',
  licensingAgency: 'Indiana Professional Licensing Agency',

  isStateFunded: false,
  wagesGuaranteed: false,
  employmentGuaranteed: false,
} as const;

export function getRAPIDSMetadata(programSlug: string) {
  const program = Object.values(RAPIDS_CONFIG.programs).find((p) => p.slug === programSlug);
  if (!program) return null;

  return {
    rapids_sponsor_legal: RAPIDS_CONFIG.sponsorOfRecord,
    rapids_program_brand: RAPIDS_CONFIG.programBrand,
    rapids_program: program.name,
    rapids_state: RAPIDS_CONFIG.stateCode,
    rapids_registration_id: RAPIDS_CONFIG.registrationId,
    rapids_occupation_code: program.rapidsCode,
    onet_soc_code: program.occupationCode,
    apprenticeship_approach: program.approach,
    competency_count: program.competencyCount,
    related_instruction_hours: program.relatedInstructionHours,
    funding_type: program.fundingType,
  };
}

export function getRAPIDSEnrollmentData(programSlug: string) {
  const program = Object.values(RAPIDS_CONFIG.programs).find((p) => p.slug === programSlug);
  if (!program) return null;

  return {
    rapids_sponsor: RAPIDS_CONFIG.sponsorOfRecord,
    rapids_program: program.name,
    rapids_state: RAPIDS_CONFIG.stateCode,
    rapids_registration_on_file: true,
    rapids_occupation_code: program.rapidsCode,
    onet_soc_code: program.occupationCode,
    apprenticeship_approach: program.approach,
    competency_count_required: program.competencyCount,
    related_instruction_hours: program.relatedInstructionHours,
    probationary_hours: program.probationaryHours,
    apprentice_to_mentor_ratio: program.apprenticeToMentorRatio,
    starting_hourly_rate: program.startingHourlyRate,
    wage_milestones: program.wageMilestones,
  };
}

export function isRAPIDSProgram(programSlug: string): boolean {
  return Object.values(RAPIDS_CONFIG.programs).some((p) => p.slug === programSlug);
}

export function getPublicRegistrationDetails() {
  return {
    sponsorLegalEntity: RAPIDS_CONFIG.sponsorOfRecord,
    programBrand: RAPIDS_CONFIG.programBrand,
    publicStatement: `${RAPIDS_CONFIG.programBrand} operates under ${RAPIDS_CONFIG.sponsorOfRecord}, the registered Sponsor of Record.`,
    state: RAPIDS_CONFIG.state,
    isStateFunded: RAPIDS_CONFIG.isStateFunded,
    licensingAgency: RAPIDS_CONFIG.licensingAgency,
    registrationAvailable: 'upon request',
  };
}
