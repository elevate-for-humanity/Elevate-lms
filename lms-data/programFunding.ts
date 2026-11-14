// High-level map of how each Elevate program is usually funded.
// This is informational for students and staff; it does not process payments.

export type FundingStream =
  | 'OutOfPocket'
  | 'WRG'
  | 'WIOA'
  | 'JRI'
  | 'WEX'
  | 'OJT'
  | 'VITA'
  | 'Apprenticeship'
  | 'EmployerSponsored'
  | 'Philanthropy'
  | 'OtherGrant';

export interface ProgramFundingProfile {
  programId: string;
  label: string;
  isStateFundedPossible: boolean;
  primaryFundingStreams: FundingStream[];
  notesForStudents: string;
  notesForStaff?: string;
}

export const programFundingProfiles: ProgramFundingProfile[] = [
  {
    programId: 'prog-cna',
    label: 'CNA Training',
    isStateFundedPossible: false,
    primaryFundingStreams: ['OutOfPocket', 'EmployerSponsored', 'Philanthropy', 'OtherGrant'],
    notesForStudents:
      'CNA training is not currently state-funded in your configuration. However, you may qualify for employer sponsorship, scholarships, or community grants. Elevate staff can also explore payment plans.',
    notesForStaff:
      'Position CNA as a mix of employer sponsorship + scholarship + flexible payment plans. Use philanthropy funds to close gaps when possible.',
  },
  {
    programId: 'prog-barber',
    label: 'Barber Apprenticeship',
    isStateFundedPossible: true,
    primaryFundingStreams: ['Apprenticeship', 'EmployerSponsored', 'Philanthropy'],
    notesForStudents:
      'Barber apprenticeship is typically funded by the shop/salon that hosts you. You may have little or no tuition, but you will be expected to show up, learn, and grow your skills.',
    notesForStaff:
      'Use apprenticeship and employer-sponsored language. Wraparound funds can support kits, exams, and licensing.',
  },
  {
    programId: 'prog-tax-vita',
    label: 'Tax & VITA Track',
    isStateFundedPossible: true,
    primaryFundingStreams: ['VITA', 'JRI', 'OtherGrant', 'Philanthropy'],
    notesForStudents:
      'Tax & VITA training is usually grant-funded, because it prepares you to serve the community. You rarely pay tuition; instead you give service hours as a volunteer or paid seasonal worker.',
    notesForStaff:
      'Tie to IRS Link & Learn and VITA/TCE expectations. Track hours and completion; do not charge tuition unless it is a separate, advanced track.',
  },
  {
    programId: 'prog-hvac',
    label: 'HVAC Technician Pathway',
    isStateFundedPossible: true,
    primaryFundingStreams: ['WRG', 'WIOA', 'WEX', 'OJT', 'EmployerSponsored', 'Philanthropy'],
    notesForStudents:
      'HVAC can often be covered by state workforce grants (like Workforce Ready Grant) or employer sponsorship. Many learners also participate in WEX/OJT, earning income while they train.',
    notesForStaff:
      'Make sure to screen for WRG/WIOA eligibility early. Pair with WEX/OJT and use philanthropy funds as last-dollar support.',
  },
  {
    programId: 'prog-cdl',
    label: 'CDL Training Pathway',
    isStateFundedPossible: true,
    primaryFundingStreams: ['WRG', 'WIOA', 'EmployerSponsored', 'WEX', 'OJT', 'Philanthropy'],
    notesForStudents:
      'Many transportation employers are willing to sponsor CDL training or reimburse costs after hire. State grants and WEX/OJT can also reduce out-of-pocket expenses.',
    notesForStaff:
      'Work closely with carrier partners. Present multiple funding paths: WRG/WIOA, employer-pay, and scholarship for gaps.',
  },
  {
    programId: 'prog-business-apprentice',
    label: 'Business Support Apprenticeship',
    isStateFundedPossible: true,
    primaryFundingStreams: ['WEX', 'OJT', 'WRG', 'EmployerSponsored', 'Philanthropy'],
    notesForStudents:
      'Business support apprenticeships usually include paid work (earn while you learn) plus class time. Tuition may be covered by grants and employer sponsorship.',
    notesForStaff:
      'Highlight earn-while-you-learn and career ladders into office, admin, and customer service roles.',
  },
  {
    programId: 'prog-esthetics-apprentice',
    label: 'Esthetics Apprenticeship',
    isStateFundedPossible: true,
    primaryFundingStreams: ['Apprenticeship', 'EmployerSponsored', 'Philanthropy'],
    notesForStudents:
      'Most esthetics apprenticeships are set up as a partnership with a spa/salon. Tuition may be low or zero; there may be costs for kits and licensing.',
    notesForStaff:
      'Explain clearly how hours, chair time, and service percentages work, plus what costs are covered by Elevate vs employer vs learner.',
  },
];

export function getProgramFundingProfile(programId: string) {
  return programFundingProfiles.find((p) => p.programId === programId);
}
