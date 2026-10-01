/**
 * CANONICAL PROGRAM DATA
 *
 * Registered-apprenticeship status and completion rules must resolve from the
 * registered-program contract. Numeric state/licensure hours remain separate
 * compatibility fields and must not be presented as the DOL completion basis
 * for competency-based occupations.
 */

import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { INDIANA_RULES } from '@/lib/licensureRules/IN';

export interface ProgramData {
  slug: string;
  name: string;
  shortName: string;
  totalHours: number;
  relatedInstructionHours: number;
  ojtHours: number;
  durationRange: string;
  durationMonths: { min: number; max: number };
  credential: string;
  credentialFull: string;
  administrator: string;
  administratorStatement: string;
  fundingOptions: string[];
  startingWage: string;
  wageRange: string;
  careerOutcomeRange: string;
  stateRequirements: string;
  category: 'apprenticeship' | 'training' | 'certification';
  isRegisteredApprenticeship: boolean;
  rapidsCodes?: string[];
  apprenticeshipApproach?: 'competency-based' | 'time-based' | 'hybrid';
  competencyCount?: number;
  probationaryHours?: number;
  apprenticeToMentorRatio?: string;
  wageMilestones?: readonly { completedCompetencies: number; hourlyRate: number }[];
  dolProgressStatement?: string;
}

export const ADMINISTRATOR_STATEMENT =
  'Elevate for Humanity coordinates training, employer participation, and funding access for its workforce and apprenticeship pathways. Registered status is stated only when an approved registered-program standard is present in the canonical registry.';

export const STATE_VARIATION_DISCLAIMER =
  'State licensing requirements and DOL registered-apprenticeship standards are separate controls. The applicable approved program and jurisdiction rules govern.';

const BARBER = getRegisteredProgramStandard('barber-apprenticeship');
if (!BARBER) throw new Error('REGISTERED_BARBER_CONTRACT_MISSING');
const ESTHETICIAN = getRegisteredProgramStandard('esthetician-apprenticeship');

function registeredFields(contract: NonNullable<ReturnType<typeof getRegisteredProgramStandard>>) {
  const standard = contract.standard;
  return {
    isRegisteredApprenticeship: true,
    rapidsCodes: [standard.rapidsCode],
    apprenticeshipApproach: 'competency-based' as const,
    competencyCount: contract.completion.competencyCount,
    probationaryHours: standard.probationaryHours,
    apprenticeToMentorRatio: standard.apprenticeToMentorRatio,
    wageMilestones: standard.wageMilestones,
    relatedInstructionHours: contract.completion.requiredRtiHours,
    startingWage: `$${standard.startingHourlyRate.toFixed(2)}/hour registered baseline, subject to any higher employer-specific schedule or legal wage floor`,
    wageRange: standard.wageMilestones
      .map((milestone) => `$${milestone.hourlyRate.toFixed(2)} after ${milestone.completedCompetencies} competencies`)
      .join(' · '),
    dolProgressStatement: `DOL progress is competency-based: ${contract.completion.competencyCount} verified competencies plus ${contract.completion.requiredRtiHours} verified RTI hours, with a ${standard.apprenticeToMentorRatio} mentor ratio and ${standard.probationaryHours}-hour probationary period. Work/OJL hours are auditable evidence and are not a fixed completion denominator.`,
  };
}

export const PROGRAMS: Record<string, ProgramData> = {
  'barber-apprenticeship': {
    slug: BARBER.programSlug,
    name: 'Barber Apprenticeship',
    shortName: 'Barber',
    totalHours: INDIANA_RULES.required_total_hours,
    ojtHours: INDIANA_RULES.required_total_hours,
    durationRange: 'Varies by competency progression, RTI completion, approved work schedule, and applicable licensing requirements',
    durationMonths: { min: 12, max: 24 },
    credential: 'Indiana Barber License',
    credentialFull: 'Indiana Barber License following registered-program completion and applicable state licensing requirements',
    administrator: RAPIDS_CONFIG.programBrand,
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['WIOA where authorized', 'WorkOne OJT where authorized', 'Employer Sponsorship', 'Self-Pay'],
    careerOutcomeRange: 'Varies by employer, experience, location, clientele, commission structure, and business model',
    stateRequirements:
      'DOL completion follows the approved competency-based registered standard. Indiana licensing-hour/exam requirements are tracked separately and do not replace registered RTI, competencies, wage, ratio, or probation requirements.',
    category: 'apprenticeship',
    ...registeredFields(BARBER),
  },

  'cosmetology-apprenticeship': {
    slug: 'cosmetology-apprenticeship',
    name: 'Hair Stylist Apprenticeship',
    shortName: 'Hair Stylist / Cosmetologist',
    totalHours: 2000,
    relatedInstructionHours: 154,
    ojtHours: 0,
    durationRange: 'Registered hybrid term: 2,000–2,500 hours',
    durationMonths: { min: 12, max: 24 },
    credential: 'Indiana Cosmetologist License',
    credentialFull: 'Indiana Cosmetologist License following registered-program completion and applicable state licensing requirements',
    administrator: RAPIDS_CONFIG.programBrand,
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['Funding eligibility must be verified for the current program and participant', 'Employer Sponsorship', 'Self-Pay'],
    startingWage: 'Employer and legal wage requirements apply; use the current employer-specific registered wage schedule when applicable',
    wageRange: 'Employer/market dependent',
    careerOutcomeRange: 'Employer/market dependent',
    stateRequirements: 'RAPIDS occupation 0096HY V1 is registered as Hair Stylist (existing title: Cosmetologist) using a hybrid 2,000–2,500-hour term with 154 RTI hours and a 500-hour probationary period. Indiana examination and licensing requirements remain separate.',
    category: 'apprenticeship',
    isRegisteredApprenticeship: true,
    rapidsCodes: ['0096HY'],
    apprenticeshipApproach: 'hybrid',
    probationaryHours: 500,
    apprenticeToMentorRatio: '1:1',
    dolProgressStatement: 'DOL progress follows the registered Hair Stylist hybrid standard: 2,000–2,500-hour term, 154 verified RTI hours, required work-process completion, 1:1 supervision, and a 500-hour probationary period. Do not treat 500 hours as program completion.',
  },

  'esthetician-apprenticeship': {
    slug: 'esthetician-apprenticeship',
    name: 'Esthetician Apprenticeship',
    shortName: 'Esthetician',
    totalHours: ESTHETICIAN?.completion.requiredRtiHours ?? 0,
    ojtHours: 0,
    durationRange: 'Varies by competency progression, RTI completion, approved work schedule, and applicable licensing requirements',
    durationMonths: { min: 6, max: 18 },
    credential: 'Indiana Esthetician License',
    credentialFull: 'Indiana Esthetician License following registered-program completion and applicable state requirements',
    administrator: RAPIDS_CONFIG.programBrand,
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['Funding eligibility must be verified for the current program and participant', 'Employer Sponsorship', 'Self-Pay'],
    careerOutcomeRange: 'Employer/market dependent',
    stateRequirements: 'State licensing/training requirements are tracked separately from the approved competency-based registered standard.',
    category: 'apprenticeship',
    ...(ESTHETICIAN
      ? registeredFields(ESTHETICIAN)
      : {
          relatedInstructionHours: 0,
          startingWage: 'Employer and legal wage requirements apply',
          wageRange: 'Employer/market dependent',
          isRegisteredApprenticeship: false,
        }),
  },

  'hvac-apprenticeship': {
    slug: 'hvac-apprenticeship',
    name: 'HVAC Technician Apprenticeship Pathway',
    shortName: 'HVAC',
    totalHours: 8000,
    relatedInstructionHours: 576,
    ojtHours: 7424,
    durationRange: 'Varies by the approved pathway/employer arrangement',
    durationMonths: { min: 36, max: 48 },
    credential: 'HVAC credential pathway',
    credentialFull: 'EPA 608 and other credentials as specifically assigned/earned',
    administrator: RAPIDS_CONFIG.programBrand,
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['Funding eligibility must be verified for the current program and participant', 'Employer Sponsorship'],
    startingWage: 'Employer and legal wage requirements apply',
    wageRange: 'Employer/market dependent',
    careerOutcomeRange: 'Employer/market dependent',
    stateRequirements: 'EPA 608 applies to covered refrigerant work. Do not describe this pathway as federally registered unless an approved registered-program standard is present in the canonical registry.',
    category: 'apprenticeship',
    isRegisteredApprenticeship: false,
  },

  'electrical-apprenticeship': {
    slug: 'electrical-apprenticeship',
    name: 'Electrical Apprenticeship Pathway',
    shortName: 'Electrical',
    totalHours: 8000,
    relatedInstructionHours: 576,
    ojtHours: 7424,
    durationRange: 'Varies by the approved pathway/employer arrangement and local licensing jurisdiction',
    durationMonths: { min: 48, max: 60 },
    credential: 'Electrical credential/licensing pathway',
    credentialFull: 'Credential or license depends on the applicable jurisdiction and approved program',
    administrator: RAPIDS_CONFIG.programBrand,
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['Funding eligibility must be verified for the current program and participant', 'Employer Sponsorship'],
    startingWage: 'Employer and legal wage requirements apply',
    wageRange: 'Employer/market dependent',
    careerOutcomeRange: 'Employer/market dependent',
    stateRequirements: 'Electrical licensing requirements vary by Indiana jurisdiction. Do not describe this pathway as federally registered unless an approved registered-program standard is present in the canonical registry.',
    category: 'apprenticeship',
    isRegisteredApprenticeship: false,
  },
};

export function getProgram(slug: string): ProgramData | undefined {
  return PROGRAMS[slug];
}

export function getProgramHours(slug: string): number {
  return PROGRAMS[slug]?.totalHours ?? 0;
}

export function getProgramDuration(slug: string): string {
  return PROGRAMS[slug]?.durationRange ?? 'Varies';
}

export function formatHours(hours: number): string {
  return hours.toLocaleString();
}

export function formatHoursWithDuration(program: ProgramData): string {
  if (program.apprenticeshipApproach === 'competency-based' && program.dolProgressStatement) {
    return program.dolProgressStatement;
  }
  return `${formatHours(program.totalHours)} pathway/state-tracking hours (${program.durationRange})`;
}

export function getApprenticeshipPrograms(): ProgramData[] {
  return Object.values(PROGRAMS).filter((p) => p.category === 'apprenticeship');
}

export function validateProgramHours(slug: string, displayedHours: number): boolean {
  const program = PROGRAMS[slug];
  if (!program) return false;
  return program.totalHours === displayedHours;
}
