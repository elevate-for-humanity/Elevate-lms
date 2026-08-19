import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

const BARBER_CONTRACT = getRegisteredProgramStandard('barber-apprenticeship');
if (!BARBER_CONTRACT) throw new Error('REGISTERED_BARBER_CONTRACT_MISSING');
const BARBER = BARBER_CONTRACT.standard;
const SPONSOR = BARBER_CONTRACT.sponsor;

/**
 * Static RAPIDS/public registration metadata only.
 *
 * The registered-program contract owns the occupation merge boundary.
 * Operational RAPIDS state — employers, employer-specific wage schedules,
 * RTI providers, placements and registrations — is resolved exclusively by
 * resolveRegisteredProgramContract().
 */
export const RAPIDS_CONFIG = {
  sponsorOfRecord: SPONSOR.sponsor,
  programBrand: 'Elevate for Humanity Career & Technical Institute',
  registrationId: process.env.RAPIDS_REGISTRATION_ID || SPONSOR.registrationNumber,
  programNumber: process.env.NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER || SPONSOR.registrationNumber,
  registrationDate: SPONSOR.registrationDate,
  revisionDate: SPONSOR.revisionDate,

  programs: {
    barber: {
      slug: BARBER_CONTRACT.programSlug,
      name: 'Barber Apprenticeship',
      occupation: BARBER.occupationTitle,
      occupationCode: BARBER.onetSocCode,
      rapidsCode: BARBER.rapidsCode,
      state: 'IN',
      approach: BARBER.approach,
      competencyCount: BARBER_CONTRACT.completion.competencyCount,
      relatedInstructionHours: BARBER_CONTRACT.completion.requiredRtiHours,
      apprenticeToMentorRatio: BARBER.apprenticeToMentorRatio,
      probationaryHours: BARBER.probationaryHours,
      startingHourlyRate: BARBER.startingHourlyRate,
      mentorHourlyRate: BARBER.mentorHourlyRate,
      wageMilestones: BARBER.wageMilestones,
      relatedInstruction: BARBER.relatedInstruction,
      competencies: BARBER.competencies,
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
  const registered = getRegisteredProgramStandard(programSlug);
  if (!registered) return null;
  const standard = registered.standard;
  return {
    rapids_sponsor_legal: registered.sponsor.sponsor,
    rapids_program_brand: RAPIDS_CONFIG.programBrand,
    rapids_program: `${standard.occupationTitle} Apprenticeship`,
    rapids_state: RAPIDS_CONFIG.stateCode,
    rapids_registration_id: registered.sponsor.registrationNumber,
    rapids_occupation_code: standard.rapidsCode,
    onet_soc_code: standard.onetSocCode,
    apprenticeship_approach: standard.approach,
    competency_count: registered.completion.competencyCount,
    related_instruction_hours: registered.completion.requiredRtiHours,
  };
}

export function getRAPIDSEnrollmentData(programSlug: string) {
  const registered = getRegisteredProgramStandard(programSlug);
  if (!registered) return null;
  const standard = registered.standard;
  return {
    rapids_sponsor: registered.sponsor.sponsor,
    rapids_program: `${standard.occupationTitle} Apprenticeship`,
    rapids_state: RAPIDS_CONFIG.stateCode,
    rapids_registration_on_file: true,
    rapids_occupation_code: standard.rapidsCode,
    onet_soc_code: standard.onetSocCode,
    apprenticeship_approach: standard.approach,
    competency_count_required: registered.completion.competencyCount,
    related_instruction_hours: registered.completion.requiredRtiHours,
    probationary_hours: standard.probationaryHours,
    apprentice_to_mentor_ratio: standard.apprenticeToMentorRatio,
    starting_hourly_rate: standard.startingHourlyRate,
    wage_milestones: standard.wageMilestones,
  };
}

export function isRAPIDSProgram(programSlug: string): boolean {
  return getRegisteredProgramStandard(programSlug) !== null;
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
