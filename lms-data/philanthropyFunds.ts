export type FundType = 'scholarship' | 'emergency' | 'stipend-support' | 'wraparound';

export interface PhilanthropyFund {
  id: string;
  name: string;
  type: FundType;
  description: string;
  // Which Elevate programs this fund most directly supports
  programIds: string[];
  // Whether this fund can be combined with state/federal supports
  canStackWith: ('WRG' | 'WEX' | 'OJT' | 'JRI' | 'VITA' | 'Employer' | 'None')[];
  typicalAwardUsd?: {
    min: number;
    max: number;
  };
  isActive: boolean;
  internalNotes?: string;
}

// Seeded example funds – you can adjust labels later
export const philanthropyFunds: PhilanthropyFund[] = [
  {
    id: 'fund-elevate-career-launch',
    name: 'Elevate Career Launch Scholarship',
    type: 'scholarship',
    description:
      'General tuition-support scholarship for learners in approved Elevate programs who have little or no access to state funding but are serious about completing training.',
    programIds: ['prog-cna', 'prog-hvac', 'prog-cdl', 'prog-business-apprentice'],
    canStackWith: ['WEX', 'OJT', 'Employer'],
    typicalAwardUsd: {
      min: 500,
      max: 2000,
    },
    isActive: true,
    internalNotes:
      "Can be used as a gap-filler when WRG/WIOA doesn't cover full tuition or learner doesn't qualify.",
  },
  {
    id: 'fund-selfish-emergency',
    name: 'SELFISH Inc. Emergency Support Fund',
    type: 'emergency',
    description:
      'Short-term emergency fund administered through the nonprofit arm to help learners stay in programs when facing crisis situations (transportation, utilities, etc.).',
    programIds: ['prog-cna', 'prog-tax-vita', 'prog-barber', 'prog-esthetics-apprentice'],
    canStackWith: ['WRG', 'JRI', 'VITA', 'Employer'],
    typicalAwardUsd: {
      min: 100,
      max: 600,
    },
    isActive: true,
    internalNotes: 'Document usage carefully for compliance. Not tuition – support only.',
  },
  {
    id: 'fund-earn-while-you-learn-boost',
    name: 'Earn-While-You-Learn Boost Stipend',
    type: 'stipend-support',
    description:
      'Supplemental stipend support for learners in WEX/OJT placements where wages are low but expectations are high, to reduce pressure to drop out.',
    programIds: ['prog-hvac', 'prog-cdl', 'prog-business-apprentice'],
    canStackWith: ['WEX', 'OJT', 'WRG', 'Employer'],
    typicalAwardUsd: {
      min: 250,
      max: 1000,
    },
    isActive: true,
    internalNotes:
      'Pair with written WEX/OJT agreements and clear expectations; can be paid in milestones.',
  },
  {
    id: 'fund-wraparound-barber-beauty',
    name: 'Barber & Beauty Wraparound Support',
    type: 'wraparound',
    description:
      'Small grants for barber and beauty apprentices to cover kit, supplies, licensing fees, or required exam costs.',
    programIds: ['prog-barber', 'prog-esthetics-apprentice'],
    canStackWith: ['Apprenticeship', 'Employer', 'Philanthropy'],
    typicalAwardUsd: {
      min: 150,
      max: 800,
    },
    isActive: true,
    internalNotes: 'May be reimbursed directly to learner or shop depending on documentation.',
  },
];
