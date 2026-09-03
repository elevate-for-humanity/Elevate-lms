// Seeded analytics so the dashboard has something real-looking
// Later: replace with live Supabase queries.

export interface ProgramAnalytics {
  programId: string;
  label: string;
  enrolled: number;
  active: number;
  completed: number;
  completionRatePct: number;
  avgTimeToCompleteWeeks: number;
  jobPlacementRatePct: number;
  usesWEX: boolean;
  usesOJT: boolean;
  usesWRGOrWIOA: boolean;
  usesPhilanthropy: boolean;
}

export interface FundingAnalyticsSummary {
  totalLearners: number;
  usingWRGOrWIOA: number;
  usingEmployerSponsored: number;
  usingPhilanthropy: number;
  usingOutOfPocket: number;
  activeEmployers: number;
}

export const programAnalytics: ProgramAnalytics[] = [
  {
    programId: 'prog-cna',
    label: 'CNA Training',
    enrolled: 35,
    active: 22,
    completed: 9,
    completionRatePct: (9 / 35) * 100,
    avgTimeToCompleteWeeks: 10,
    jobPlacementRatePct: 70,
    usesWEX: false,
    usesOJT: false,
    usesWRGOrWIOA: false,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-barber',
    label: 'Barber Apprenticeship',
    enrolled: 18,
    active: 14,
    completed: 3,
    completionRatePct: (3 / 18) * 100,
    avgTimeToCompleteWeeks: 40,
    jobPlacementRatePct: 85,
    usesWEX: false,
    usesOJT: false,
    usesWRGOrWIOA: false,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-tax-vita',
    label: 'Tax & VITA Track',
    enrolled: 40,
    active: 28,
    completed: 12,
    completionRatePct: (12 / 40) * 100,
    avgTimeToCompleteWeeks: 6,
    jobPlacementRatePct: 65,
    usesWEX: false,
    usesOJT: false,
    usesWRGOrWIOA: true,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-hvac',
    label: 'HVAC Technician Pathway',
    enrolled: 24,
    active: 18,
    completed: 5,
    completionRatePct: (5 / 24) * 100,
    avgTimeToCompleteWeeks: 18,
    jobPlacementRatePct: 78,
    usesWEX: true,
    usesOJT: true,
    usesWRGOrWIOA: true,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-cdl',
    label: 'CDL Training Pathway',
    enrolled: 20,
    active: 15,
    completed: 4,
    completionRatePct: (4 / 20) * 100,
    avgTimeToCompleteWeeks: 12,
    jobPlacementRatePct: 82,
    usesWEX: true,
    usesOJT: true,
    usesWRGOrWIOA: true,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-business-apprentice',
    label: 'Business Support Apprenticeship',
    enrolled: 16,
    active: 13,
    completed: 2,
    completionRatePct: (2 / 16) * 100,
    avgTimeToCompleteWeeks: 24,
    jobPlacementRatePct: 75,
    usesWEX: true,
    usesOJT: true,
    usesWRGOrWIOA: true,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-ems-apprentice',
    label: 'EMS & Healthcare Support Apprenticeship',
    enrolled: 14,
    active: 11,
    completed: 1,
    completionRatePct: (1 / 14) * 100,
    avgTimeToCompleteWeeks: 32,
    jobPlacementRatePct: 70,
    usesWEX: true,
    usesOJT: true,
    usesWRGOrWIOA: true,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-building-tech-apprentice',
    label: 'Building Maintenance & Technician Apprenticeship',
    enrolled: 10,
    active: 8,
    completed: 1,
    completionRatePct: (1 / 10) * 100,
    avgTimeToCompleteWeeks: 28,
    jobPlacementRatePct: 72,
    usesWEX: true,
    usesOJT: true,
    usesWRGOrWIOA: true,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-culinary-apprentice',
    label: 'Culinary & Kitchen Apprenticeship',
    enrolled: 12,
    active: 9,
    completed: 2,
    completionRatePct: (2 / 12) * 100,
    avgTimeToCompleteWeeks: 20,
    jobPlacementRatePct: 68,
    usesWEX: true,
    usesOJT: true,
    usesWRGOrWIOA: false,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-esthetics-apprentice',
    label: 'Esthetics Apprenticeship',
    enrolled: 9,
    active: 7,
    completed: 1,
    completionRatePct: (1 / 9) * 100,
    avgTimeToCompleteWeeks: 30,
    jobPlacementRatePct: 80,
    usesWEX: false,
    usesOJT: false,
    usesWRGOrWIOA: false,
    usesPhilanthropy: true,
  },
  {
    programId: 'prog-nails-apprentice',
    label: 'Nail Technician Apprenticeship',
    enrolled: 8,
    active: 6,
    completed: 1,
    completionRatePct: (1 / 8) * 100,
    avgTimeToCompleteWeeks: 26,
    jobPlacementRatePct: 78,
    usesWEX: false,
    usesOJT: false,
    usesWRGOrWIOA: false,
    usesPhilanthropy: true,
  },
];

export const fundingAnalyticsSummary: FundingAnalyticsSummary = {
  totalLearners: programAnalytics.reduce((sum, p) => sum + p.enrolled, 0),
  usingWRGOrWIOA: 0,
  usingEmployerSponsored: 0,
  usingPhilanthropy: 0,
  usingOutOfPocket: 0,
  activeEmployers: 12,
};
