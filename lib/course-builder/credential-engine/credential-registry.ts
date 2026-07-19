/**
 * Credential Registry
 * 
 * Official certifications and their metadata.
 * Used by the Credential Intelligence Engine to build exam-aligned courses.
 */

export type CredentialCategory = 
  | 'hvac'
  | 'healthcare'
  | 'trades'
  | 'technology'
  | 'safety'
  | 'food'
  | 'transportation'
  | 'business'
  | 'beauty';

export interface ExamSection {
  name: string;
  questions: number;
  passingScore: number;
  topics: string[];
}

export interface CredentialBlueprint {
  id: string;
  slug: string;
  name: string;
  provider: string;
  category: CredentialCategory;
  description: string;
  examSections: ExamSection[];
  totalQuestions: number;
  passingScore: number;
  examFormat: string;
  retakePolicy: string;
  renewalRequirements?: string;
  referenceDocuments?: string[];
  sosCodes?: string[];  // O*NET SOC codes
  relatedCredentials?: string[];
}

export const CREDENTIAL_REGISTRY: Record<string, CredentialBlueprint> = {
  // ─────────────────────────────────────────────────────────────────
  // HVAC / REFRIGERATION
  // ─────────────────────────────────────────────────────────────────
  'epa-608-universal': {
    id: 'epa-608-universal',
    slug: 'epa-608-universal',
    name: 'EPA 608 Universal',
    provider: 'ESCO Institute / Mainstream Engineering',
    category: 'hvac',
    description: 'EPA Section 608 Technician Certification - Universal (Core + Type I + II + III)',
    examSections: [
      {
        name: 'Core',
        questions: 25,
        passingScore: 70,
        topics: [
          'Ozone depletion & environmental impact',
          'Clean Air Act Section 608',
          'Montreal Protocol',
          'Refrigerant classifications (CFC, HCFC, HFC, HFO)',
          'Recovery, recycling, reclamation',
          'Leak detection',
          'Safety procedures',
          'Cylinder handling',
        ],
      },
      {
        name: 'Type I',
        questions: 25,
        passingScore: 70,
        topics: [
          'Small appliances (≤5 lbs)',
          '90%/80%/0% recovery requirements',
          'Self-contained vs system-dependent recovery',
          'Disposal requirements',
        ],
      },
      {
        name: 'Type II',
        questions: 25,
        passingScore: 70,
        topics: [
          'High-pressure systems',
          'Recovery to 500 microns',
          'Leak repair requirements (30%/20% thresholds)',
          '30-day repair timeline',
          'Record keeping (3 years)',
          'System charge determination',
        ],
      },
      {
        name: 'Type III',
        questions: 25,
        passingScore: 70,
        topics: [
          'Low-pressure systems (R-11, R-123)',
          'Centrifugal chillers',
          'Recovery to 25 mm Hg absolute',
          'Purge units',
          'Vacuum operation',
        ],
      },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 multiple choice, closed book, PT chart allowed',
    retakePolicy: 'Retake failed sections only, immediate retake allowed',
    renewalRequirements: 'No renewal - lifetime certification',
    referenceDocuments: ['hvac-epa608-prep.json'],
    sosCodes: ['49-9021.00'], // HVAC Mechanics
  },

  // ─────────────────────────────────────────────────────────────────
  // HEALTHCARE - NHA
  // ─────────────────────────────────────────────────────────────────
  'nha-cpt': {
    id: 'nha-cpt',
    slug: 'nha-cpt',
    name: 'NHA Certified Phlebotomy Technician (CPT)',
    provider: 'National Healthcareer Association',
    category: 'healthcare',
    description: 'Phlebotomy technician certification',
    examSections: [
      {
        name: 'Collection',
        questions: 59,
        passingScore: 70,
        topics: ['Venipuncture', 'Capillary puncture', 'Specimen handling', 'Order of draw'],
      },
      {
        name: 'Procedures',
        questions: 29,
        passingScore: 70,
        topics: ['Patient preparation', 'Safety', 'Quality assurance'],
      },
      {
        name: 'Safety',
        questions: 12,
        passingScore: 70,
        topics: ['OSHA compliance', 'Infection control', 'Needle safety'],
      },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, 1 hour 50 minutes',
    retakePolicy: 'After 14 days',
    sosCodes: ['31-9097.00'], // Phlebotomists
  },

  'nha-ccma': {
    id: 'nha-ccma',
    slug: 'nha-ccma',
    name: 'NHA Certified Clinical Medical Assistant (CCMA)',
    provider: 'National Healthcareer Association',
    category: 'healthcare',
    description: 'Clinical medical assistant certification',
    examSections: [
      { name: 'Foundations', questions: 25, passingScore: 70, topics: [] },
      { name: 'Clinical Patient Care', questions: 55, passingScore: 70, topics: [] },
      { name: 'General Wishbone', questions: 20, passingScore: 70, topics: [] },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, 2 hours',
    retakePolicy: 'After 30 days',
    sosCodes: ['31-9092.00'], // Medical Assistants
  },

  // ─────────────────────────────────────────────────────────────────
  // SAFETY
  // ─────────────────────────────────────────────────────────────────
  'osha-10': {
    id: 'osha-10',
    slug: 'osha-10',
    name: 'OSHA 10-Hour General Industry',
    provider: 'OSHA Training Institute',
    category: 'safety',
    description: 'General industry safety certification',
    examSections: [
      { name: 'Mandatory', questions: 0, passingScore: 100, topics: ['Introduction to OSHA', 'Walking and Working Surfaces'] },
      { name: 'Elective', questions: 0, passingScore: 100, topics: ['Hazard Communication', 'Electrical', 'Personal Protective Equipment'] },
      { name: 'Optional', questions: 0, passingScore: 100, topics: ['Bloodborne Pathogens', 'Fall Protection'] },
    ],
    totalQuestions: 0,
    passingScore: 100,
    examFormat: 'No exam - completion card issued',
    retakePolicy: 'N/A - completion only',
    renewalRequirements: 'No renewal',
  },

  'osha-30': {
    id: 'osha-30',
    slug: 'osha-30',
    name: 'OSHA 30-Hour General Industry',
    provider: 'OSHA Training Institute',
    category: 'safety',
    description: 'General industry safety certification - supervisor level',
    examSections: [
      { name: 'Mandatory', questions: 0, passingScore: 100, topics: ['Introduction to OSHA', 'Managing Safety and Health'] },
      { name: 'Elective', questions: 0, passingScore: 100, topics: ['Hazard Communication', 'Electrical', 'PPE', 'Fall Protection'] },
    ],
    totalQuestions: 0,
    passingScore: 100,
    examFormat: 'No exam - completion card issued',
    retakePolicy: 'N/A - completion only',
    renewalRequirements: 'No renewal',
  },

  // ─────────────────────────────────────────────────────────────────
  // FOOD SAFETY
  // ─────────────────────────────────────────────────────────────────
  'servsafe': {
    id: 'servsafe',
    slug: 'servsafe',
    name: 'ServSafe Food Protection Manager',
    provider: 'National Restaurant Association',
    category: 'food',
    description: 'Food safety manager certification',
    examSections: [
      {
        name: 'Food Safety',
        questions: 80,
        passingScore: 75,
        topics: ['Personal Hygiene', 'Time/Temperature', 'Cross-Contamination', 'Cleaning/Sanitizing'],
      },
      { name: 'Hazards', questions: 0, passingScore: 75, topics: [] },
      { name: 'Regulations', questions: 0, passingScore: 75, topics: [] },
    ],
    totalQuestions: 80,
    passingScore: 75,
    examFormat: '80 questions, 2 hours',
    retakePolicy: 'After 30 days',
    renewalRequirements: 'Every 5 years',
  },

  // ─────────────────────────────────────────────────────────────────
  // TRADES
  // ─────────────────────────────────────────────────────────────────
  'nccer-core': {
    id: 'nccer-core',
    slug: 'nccer-core',
    name: 'NCCER Core Curriculum',
    provider: 'NCCER',
    category: 'trades',
    description: 'Introductory craft skills for all construction trades',
    examSections: [
      { name: 'Basic Safety', questions: 0, passingScore: 70, topics: [] },
      { name: 'Introduction to Construction Math', questions: 0, passingScore: 70, topics: [] },
      { name: 'Hand Tools', questions: 0, passingScore: 70, topics: [] },
      { name: 'Power Tools', questions: 0, passingScore: 70, topics: [] },
      { name: 'Construction Drawings', questions: 0, passingScore: 70, topics: [] },
      { name: 'Basic Rigging', questions: 0, passingScore: 70, topics: [] },
    ],
    totalQuestions: 0,
    passingScore: 70,
    examFormat: 'Module assessments + final exam',
    retakePolicy: 'Per module',
    sosCodes: ['47-2061.00'], // Construction Laborers
  },

  // ─────────────────────────────────────────────────────────────────
  // STATE LICENSURE - BARBER
  // ─────────────────────────────────────────────────────────────────
  'indiana-barber': {
    id: 'indiana-barber',
    slug: 'indiana-barber',
    name: 'Indiana Barber License',
    provider: 'Indiana State Board of Cosmetology and Barbering',
    category: 'beauty',
    description: 'Indiana barber examination for state licensure',
    examSections: [
      {
        name: 'Infection Control',
        questions: 30,
        passingScore: 70,
        topics: ['Sanitation', 'Disinfection', 'HIV/AIDS', 'State rules'],
      },
      {
        name: 'Hair Care',
        questions: 30,
        passingScore: 70,
        topics: ['Haircutting', 'Shampooing', 'Hair treatments'],
      },
      {
        name: 'Shaving',
        questions: 20,
        passingScore: 70,
        topics: ['Facial shaving', ' Beard trims'],
      },
      {
        name: 'State Rules',
        questions: 20,
        passingScore: 70,
        topics: ['Indiana Administrative Code', 'Licensing requirements'],
      },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions + practical exam',
    retakePolicy: 'After 30 days',
    sosCodes: ['39-5011.00'], // Barbers
  },
};

/**
 * Find credentials by category
 */
export function getCredentialsByCategory(category: CredentialCategory): CredentialBlueprint[] {
  return Object.values(CREDENTIAL_REGISTRY).filter(c => c.category === category);
}

/**
 * Find credentials by SOC code
 */
export function getCredentialsBySOC(socCode: string): CredentialBlueprint[] {
  return Object.values(CREDENTIAL_REGISTRY).filter(c => 
    c.sosCodes?.includes(socCode)
  );
}

/**
 * Get credential by slug
 */
export function getCredential(slug: string): CredentialBlueprint | undefined {
  return CREDENTIAL_REGISTRY[slug];
}

/**
 * Search credentials by keyword
 */
export function searchCredentials(query: string): CredentialBlueprint[] {
  const lower = query.toLowerCase();
  return Object.values(CREDENTIAL_REGISTRY).filter(c => 
    c.name.toLowerCase().includes(lower) ||
    c.slug.toLowerCase().includes(lower) ||
    c.provider.toLowerCase().includes(lower) ||
    c.category.toLowerCase().includes(lower)
  );
}

/**
 * Get all credential slugs
 */
export function getAllCredentialSlugs(): string[] {
  return Object.keys(CREDENTIAL_REGISTRY);
}
