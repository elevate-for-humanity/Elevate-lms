import { allPrograms } from '@/lms-data/programs';

export type FundingFlag =
  | 'jri'
  | 'wrg'
  | 'wex'
  | 'ojt'
  | 'apprenticeship'
  | 'employer-pay'
  | 'student-pay'
  | 'philanthropy';

export interface TuitionConfig {
  programId: string;
  displayName: string;
  baseTuition: string;
  notes?: string;
  fundingFlags: FundingFlag[];
  stripeProductId?: string;
  stripePriceFullId?: string;
  stripePriceInstallmentId?: string;
}

export const tuitionConfigs: TuitionConfig[] = [
  {
    programId: 'prog-cna',
    displayName: 'CNA & Healthcare Pathways',
    baseTuition: '$3,000 – $5,500 (varies by partner)',
    fundingFlags: ['jri', 'wrg', 'wex', 'ojt', 'employer-pay', 'philanthropy'],
    notes:
      'Often WRG + JRI eligible when learner meets criteria; employer or philanthropy can cover gaps.',
  },
  {
    programId: 'prog-barber',
    displayName: 'Barber Apprenticeship',
    baseTuition: 'FREE - Earn while you learn',
    fundingFlags: ['apprenticeship'],
    notes: 'Barber apprenticeship where wages + hours are earned in shop.',
  },
  {
    programId: 'prog-tax-vita',
    displayName: 'Tax, VITA & Office Pathway',
    baseTuition: 'Core training often free (VITA); Elevate modules are program fee based',
    fundingFlags: ['jri', 'wex', 'employer-pay', 'philanthropy'],
    notes:
      'IRS VITA / Link & Learn is free; Elevate charges program fee for wraparound training and placement support.',
  },
  {
    programId: 'prog-business-ems-apprenticeship',
    displayName: 'Business EMS Apprenticeship',
    baseTuition: 'FREE - Earn while you learn',
    fundingFlags: ['apprenticeship'],
  },
  {
    programId: 'prog-building-maintenance',
    displayName: 'Building Technician Apprenticeship',
    baseTuition: 'FREE - Earn while you learn',
    fundingFlags: ['apprenticeship'],
  },
];

export function getTuitionForProgram(programId: string): TuitionConfig | undefined {
  return tuitionConfigs.find((t) => t.programId === programId);
}

export function getProgramsWithTuitionMeta() {
  return allPrograms.map((program) => {
    const tuition = getTuitionForProgram(program.id);
    return { program, tuition };
  });
}
