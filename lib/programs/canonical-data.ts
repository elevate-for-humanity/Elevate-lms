/**
 * CANONICAL PROGRAM DATA - Single Source of Truth
 *
 * DOL Registered Apprenticeship requirements come from RAPIDS_CONFIG, which
 * derives occupation-specific values from the approved Appendix A. State
 * licensure-hour rules remain a separate state-licensing concern and must not
 * be presented as the DOL completion model for competency-based occupations.
 */

import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
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
  'Elevate for Humanity serves as the Program Administrator for registered apprenticeship pathways, coordinating training, employer participation, and funding access.';

export const STATE_VARIATION_DISCLAIMER =
  'State licensing requirements and DOL registered-apprenticeship standards are separate controls. The applicable approved program and jurisdiction rules govern.';

const BARBER_RAPIDS = RAPIDS_CONFIG.programs.barber;

export const PROGRAMS: Record<string, ProgramData> = {
  'barber-apprenticeship': {
    slug: BARBER_RAPIDS.slug,
    name: BARBER_RAPIDS.name,
    shortName: 'Barber',
    // Compatibility/state-licensure tracking only. DOL progress is competency-based
    // and MUST use the Appendix A fields below rather than this numeric hour value.
    totalHours: INDIANA_RULES.required_total_hours,
    relatedInstructionHours: BARBER_RAPIDS.relatedInstructionHours,
    ojtHours: INDIANA_RULES.required_total_hours,
    durationRange: 'Varies by competency progression, approved work schedule, RTI completion, and applicable licensing requirements',
    durationMonths: { min: 12, max: 24 },
    credential: 'Indiana Barber License',
    credentialFull: 'Indiana Barber License following registered-apprenticeship completion and applicable state licensing requirements',
    administrator: RAPIDS_CONFIG.programBrand,
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['WIOA', 'WorkOne OJT', 'Employer Training Grant', 'Workforce Ready Grant where authorized', 'Employer Sponsorship', 'Self-Pay'],
    startingWage: `$${BARBER_RAPIDS.startingHourlyRate.toFixed(2)}/hour Appendix A rate, subject to any higher applicable legal minimum`,
    wageRange: BARBER_RAPIDS.wageMilestones
      .map((milestone) => `$${milestone.hourlyRate.toFixed(2)} after ${milestone.completedCompetencies} competencies`)
      .join(' · '),
    careerOutcomeRange: 'Varies by employer, experience, location, clientele, commission structure, and business model',
    stateRequirements:
      'DOL apprenticeship completion follows the approved competency-based Appendix A. Indiana licensing-hour/exam requirements are tracked separately and do not replace Appendix A RTI, competencies, wages, ratio, or probation requirements.',
    category: 'apprenticeship',
    isRegisteredApprenticeship: true,
    rapidsCodes: [BARBER_RAPIDS.rapidsCode],
    apprenticeshipApproach: BARBER_RAPIDS.approach,
    competencyCount: BARBER_RAPIDS.competencyCount,
    probationaryHours: BARBER_RAPIDS.probationaryHours,
    apprenticeToMentorRatio: BARBER_RAPIDS.apprenticeToMentorRatio,
    wageMilestones: BARBER_RAPIDS.wageMilestones,
    dolProgressStatement: `DOL progress is competency-based: ${BARBER_RAPIDS.competencyCount} Appendix A competencies plus ${BARBER_RAPIDS.relatedInstructionHours} RTI hours, with a ${BARBER_RAPIDS.apprenticeToMentorRatio} mentor ratio and ${BARBER_RAPIDS.probationaryHours}-hour probationary period.`,
  },

  'cosmetology-apprenticeship': {
    slug: 'cosmetology-apprenticeship',
    name: 'Cosmetology Apprenticeship',
    shortName: 'Cosmetology',
    totalHours: 1500,
    relatedInstructionHours: 144,
    ojtHours: 1356,
    durationRange: '12-18 months',
    durationMonths: { min: 12, max: 18 },
    credential: 'Indiana Cosmetology License',
    credentialFull: 'Indiana Cosmetologist License (State Board Certified)',
    administrator: 'Elevate for Humanity Career & Technical Institute',
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['WIOA', 'Workforce Ready Grant', 'Employer Sponsorship', 'Self-Pay'],
    startingWage: '$10-12/hour + tips',
    wageRange: '$10-16/hour during training',
    careerOutcomeRange: '$30,000-$55,000+/year',
    stateRequirements:
      'Indiana requires 2,000 hours of apprenticeship training for cosmetology licensure.',
    category: 'apprenticeship',
    isRegisteredApprenticeship: true,
  },

  'esthetician-apprenticeship': {
    slug: 'esthetician-apprenticeship',
    name: 'Esthetician Apprenticeship',
    shortName: 'Esthetician',
    totalHours: 700,
    relatedInstructionHours: 100,
    ojtHours: 600,
    durationRange: '6-12 months',
    durationMonths: { min: 6, max: 12 },
    credential: 'Indiana Esthetician License',
    credentialFull: 'Indiana Licensed Esthetician (State Board Certified)',
    administrator: 'Elevate for Humanity Career & Technical Institute',
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['WIOA', 'Workforce Ready Grant', 'Self-Pay'],
    startingWage: '$12-14/hour',
    wageRange: '$12-18/hour during training',
    careerOutcomeRange: '$28,000-$50,000+/year',
    stateRequirements: 'Indiana requires 700 hours of training for esthetician licensure.',
    category: 'apprenticeship',
    isRegisteredApprenticeship: true,
  },

  'hvac-apprenticeship': {
    slug: 'hvac-apprenticeship',
    name: 'HVAC Technician Apprenticeship',
    shortName: 'HVAC',
    totalHours: 8000,
    relatedInstructionHours: 576,
    ojtHours: 7424,
    durationRange: '3-4 years',
    durationMonths: { min: 36, max: 48 },
    credential: 'HVAC Journeyman Certification',
    credentialFull: 'EPA 608 Certification + HVAC Journeyman',
    administrator: 'Elevate for Humanity Career & Technical Institute',
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['WIOA', 'Apprenticeship Grant', 'Employer Sponsorship'],
    startingWage: '$15-18/hour',
    wageRange: '$15-25/hour during training',
    careerOutcomeRange: '$45,000-$75,000+/year',
    stateRequirements: 'EPA 608 certification required. State journeyman requirements vary.',
    category: 'apprenticeship',
    isRegisteredApprenticeship: true,
  },

  'electrical-apprenticeship': {
    slug: 'electrical-apprenticeship',
    name: 'Electrical Apprenticeship',
    shortName: 'Electrical',
    totalHours: 8000,
    relatedInstructionHours: 576,
    ojtHours: 7424,
    durationRange: '4-5 years',
    durationMonths: { min: 48, max: 60 },
    credential: 'Journeyman Electrician License',
    credentialFull: 'Indiana Journeyman Electrician License',
    administrator: 'Elevate for Humanity Career & Technical Institute',
    administratorStatement: ADMINISTRATOR_STATEMENT,
    fundingOptions: ['WIOA', 'Apprenticeship Grant', 'Employer Sponsorship'],
    startingWage: '$16-20/hour',
    wageRange: '$16-28/hour during training',
    careerOutcomeRange: '$50,000-$85,000+/year',
    stateRequirements: 'Indiana requires 8,000 hours for journeyman electrician license.',
    category: 'apprenticeship',
    isRegisteredApprenticeship: true,
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
  return `${formatHours(program.totalHours)} OJL hours (${program.durationRange})`;
}

export function getApprenticeshipPrograms(): ProgramData[] {
  return Object.values(PROGRAMS).filter((p) => p.category === 'apprenticeship');
}

export function validateProgramHours(slug: string, displayedHours: number): boolean {
  const program = PROGRAMS[slug];
  if (!program) return false;
  return program.totalHours === displayedHours;
}
