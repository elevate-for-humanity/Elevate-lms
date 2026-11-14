import { allPrograms } from '@/lms-data/programs';

export type FundingFlag =
  | 'jri'
  | 'wrg'
  | 'wex'
  | 'ojt'
  | 'apprenticeship'
  | 'state-grant'
  | 'federal-grant'
  | 'employer-pay'
  | 'self-pay';

export interface ProgramEnrollmentConfig {
  programId: string;
  label: string;
  shortDescription: string;
  isStateFunded: boolean;
  isApprenticeship: boolean;
  typicalDurationWeeks?: number;
  typicalHoursPerWeek?: number;
  tuitionRange?: string;
  fundingFlags: FundingFlag[];
}

/**
 * Enrollment metadata for key programs.
 * 🔴 You can edit these to match exact tuition/duration later.
 */
export const enrollmentConfigs: ProgramEnrollmentConfig[] = [
  {
    programId: 'prog-cna',
    label: 'CNA & Healthcare Pathways',
    shortDescription:
      'Prepares you for entry-level roles in long-term care and healthcare settings, aligned with Choice Medical Institute.',
    isStateFunded: false,
    isApprenticeship: false,
    typicalDurationWeeks: 6,
    typicalHoursPerWeek: 15,
    tuitionRange: '$1,500 – $3,000 (varies by cohort)',
    fundingFlags: ['state-grant', 'employer-pay', 'self-pay'],
  },
  {
    programId: 'prog-barber',
    label: 'Barber Apprenticeship',
    shortDescription:
      'FREE apprenticeship - earn hours in a real barbershop while completing Milady-aligned coursework.',
    isStateFunded: true,
    isApprenticeship: true,
    typicalDurationWeeks: 24,
    typicalHoursPerWeek: 20,
    tuitionRange: 'FREE - Earn while you learn',
    fundingFlags: ['apprenticeship'],
  },
  {
    programId: 'prog-nail-technician-apprenticeship',
    label: 'Nails & Esthetics Apprenticeship',
    shortDescription: 'FREE salon-based apprenticeship mixing on-the-job learning with theory.',
    isStateFunded: true,
    isApprenticeship: true,
    typicalDurationWeeks: 26,
    typicalHoursPerWeek: 20,
    tuitionRange: 'FREE - Earn while you learn',
    fundingFlags: ['apprenticeship'],
  },
  {
    programId: 'prog-hvac-technician',
    label: 'HVAC Technician Pathway',
    shortDescription:
      'Pre-apprenticeship or helper track that leads into HVAC training with partner schools and employers.',
    isStateFunded: true,
    isApprenticeship: false,
    typicalDurationWeeks: 16,
    typicalHoursPerWeek: 20,
    tuitionRange: 'Partner-based; often grant eligible',
    fundingFlags: ['wex', 'ojt', 'state-grant', 'employer-pay'],
  },
  {
    programId: 'prog-building-technician-apprenticeship',
    label: 'Building Technician Apprenticeship',
    shortDescription: 'FREE apprenticeship in property and facilities maintenance roles.',
    isStateFunded: true,
    isApprenticeship: true,
    typicalDurationWeeks: 24,
    typicalHoursPerWeek: 25,
    tuitionRange: 'FREE - Earn while you learn',
    fundingFlags: ['apprenticeship'],
  },
  {
    programId: 'prog-tax-vita',
    label: 'Tax, VITA & Bookkeeping Pathway',
    shortDescription:
      'Prep for tax season volunteering and entry-level roles using IRS Link & Learn, VITA, and Intuit resources.',
    isStateFunded: true,
    isApprenticeship: false,
    typicalDurationWeeks: 10,
    typicalHoursPerWeek: 8,
    tuitionRange: 'Usually free to learner; funded by partners',
    fundingFlags: ['jri', 'federal-grant', 'wex'],
  },
  {
    programId: 'prog-it-support-helpdesk',
    label: 'IT Support & Helpdesk',
    shortDescription: 'IT fundamentals plus soft skills for helpdesk and tech support roles.',
    isStateFunded: true,
    isApprenticeship: false,
    typicalDurationWeeks: 12,
    typicalHoursPerWeek: 10,
    tuitionRange: 'Grant-eligible; employer and self-pay options',
    fundingFlags: ['wex', 'ojt', 'state-grant', 'employer-pay'],
  },
  {
    programId: 'prog-customer-service-contact-center',
    label: 'Customer Service & Contact Center',
    shortDescription:
      'Customer-facing skills for call centers, front desks, and hospitality roles.',
    isStateFunded: true,
    isApprenticeship: false,
    typicalDurationWeeks: 8,
    typicalHoursPerWeek: 10,
    tuitionRange: 'Often covered by grants or employer partnerships',
    fundingFlags: ['jri', 'wex', 'state-grant'],
  },
  {
    programId: 'prog-business-ems-apprenticeship',
    label: 'Business EMS Apprenticeship',
    shortDescription: 'FREE apprenticeship for office roles and business operations support.',
    isStateFunded: true,
    isApprenticeship: true,
    typicalDurationWeeks: 24,
    typicalHoursPerWeek: 20,
    tuitionRange: 'FREE - Earn while you learn',
    fundingFlags: ['apprenticeship'],
  },
  {
    programId: 'prog-culinary-apprenticeship',
    label: 'Culinary Apprenticeship',
    shortDescription:
      'FREE kitchen-based apprenticeship mixing paid line work with structured learning.',
    isStateFunded: true,
    isApprenticeship: true,
    typicalDurationWeeks: 24,
    typicalHoursPerWeek: 20,
    tuitionRange: 'FREE - Earn while you learn',
    fundingFlags: ['apprenticeship'],
  },
];

export function getEnrollmentConfigForProgram(programId: string) {
  return enrollmentConfigs.find((c) => c.programId === programId);
}

export function getProgramsWithEnrollmentMeta() {
  return allPrograms
    .map((p) => {
      const cfg = getEnrollmentConfigForProgram(p.id);
      return { program: p, enrollment: cfg };
    })
    .filter((row) => row.enrollment);
}
