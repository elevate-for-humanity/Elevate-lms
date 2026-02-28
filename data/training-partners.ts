// Training partner data for the public training sites page.
//
// IMPORTANT: Only add partners here once documentation is on file.
// Each partner must have at least ONE of:
//   - Signed MOU
//   - Training site agreement
//   - RAPIDS-linked employer registration
//   - OJT contract
//   - Clinical affiliation agreement
//   - Written confirmation of partnership + training role
//
// Partners without documentation should NOT be listed publicly.
// Use status: 'pending' for partners in the documentation process.
// Only status: 'active' partners are shown on the public page.

export type PartnerCategory =
  | 'barbershop'
  | 'healthcare'
  | 'cdl'
  | 'skilled-trades'
  | 'technology'
  | 'business'
  | 'social-services';

export type TrainingRole =
  | 'ojt'           // On-the-job training site
  | 'clinical'      // Clinical rotation / externship
  | 'apprenticeship' // RAPIDS-linked apprenticeship employer
  | 'externship'    // Externship placement
  | 'placement'     // Job placement partner (not training)
  | 'lab'           // Lab / skills training facility
  | 'driving';      // CDL driving school / yard

export type DocumentationType =
  | 'mou'
  | 'training-site-agreement'
  | 'rapids-employer'
  | 'ojt-contract'
  | 'clinical-affiliation'
  | 'written-confirmation';

export type PartnerStatus = 'active' | 'pending' | 'inactive';

export interface TrainingPartner {
  name: string;
  category: PartnerCategory;
  trainingRole: TrainingRole;
  status: PartnerStatus;
  city: string;
  state: string;
  // What documentation is on file (internal tracking — not shown publicly)
  documentation: DocumentationType[];
  // Programs this partner supports
  programs: string[];
  // Optional public-facing description
  description?: string;
  // Optional website
  website?: string;
}

// ─── PARTNER DATA ────────────────────────────────────────────────────────────
// Populate this array with documented partners only.
// The public page filters to status === 'active'.

export const TRAINING_PARTNERS: TrainingPartner[] = [
  // ── EXAMPLE ENTRIES (replace with real partners) ──────────────────────────
  // {
  //   name: 'Example Barbershop',
  //   category: 'barbershop',
  //   trainingRole: 'apprenticeship',
  //   status: 'active',
  //   city: 'Indianapolis',
  //   state: 'IN',
  //   documentation: ['mou', 'rapids-employer'],
  //   programs: ['Barber Apprenticeship'],
  //   description: 'Licensed barbershop providing OJT hours for barber apprentices.',
  // },
];

// ─── CATEGORY METADATA ───────────────────────────────────────────────────────

export const PARTNER_CATEGORIES: Record<PartnerCategory, {
  label: string;
  description: string;
  trainingDescription: string;
}> = {
  barbershop: {
    label: 'Barbershop & Cosmetology',
    description: 'Licensed barbershops and salons providing apprenticeship training.',
    trainingDescription: 'Apprentices complete 2,000 OJT hours under licensed barber supervision at partner shops.',
  },
  healthcare: {
    label: 'Healthcare',
    description: 'Clinical facilities, nursing homes, and medical offices.',
    trainingDescription: 'Students complete clinical rotations and externships at partner healthcare facilities.',
  },
  cdl: {
    label: 'CDL / Commercial Driving',
    description: 'Driving schools with yard and road training facilities.',
    trainingDescription: 'Students complete behind-the-wheel training at partner driving schools.',
  },
  'skilled-trades': {
    label: 'Skilled Trades',
    description: 'Employer worksites and training labs for HVAC, electrical, welding, and plumbing.',
    trainingDescription: 'Apprentices and trainees complete OJT hours at employer worksites under journeyman supervision.',
  },
  technology: {
    label: 'Technology',
    description: 'IT employers providing internship and placement opportunities.',
    trainingDescription: 'IT programs are delivered fully online. Partners provide internship and job placement.',
  },
  business: {
    label: 'Business & Finance',
    description: 'Tax preparation firms, bookkeeping offices, and business partners.',
    trainingDescription: 'Business programs are delivered online. Partners provide practicum and placement opportunities.',
  },
  'social-services': {
    label: 'Social Services',
    description: 'Community organizations and recovery centers.',
    trainingDescription: 'Peer recovery specialist students complete supervised practicum hours at partner organizations.',
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getActivePartners(): TrainingPartner[] {
  return TRAINING_PARTNERS.filter(p => p.status === 'active');
}

export function getPartnersByCategory(category: PartnerCategory): TrainingPartner[] {
  return getActivePartners().filter(p => p.category === category);
}

export function getPartnerCount(): number {
  return getActivePartners().length;
}

export function getCategoriesWithPartners(): PartnerCategory[] {
  const active = getActivePartners();
  const categories = new Set(active.map(p => p.category));
  return Array.from(categories) as PartnerCategory[];
}
