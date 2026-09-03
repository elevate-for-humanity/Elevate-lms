/**
 * Program Assets Library
 *
 * Central mapping of program slugs to hero images and category defaults.
 * Used by ProgramPageContract to ensure every page has real imagery.
 */

export type ProgramCategory =
  | 'healthcare'
  | 'skilled-trades'
  | 'technology'
  | 'business'
  | 'beauty'
  | 'transportation'
  | 'general';

/**
 * Category default hero images
 */
export const CATEGORY_HEROES: Record<ProgramCategory, string> = {
  healthcare: '/images/pages/healthcare-hero.webp',
  'skilled-trades': '/images/hero/hero-skilled-trades.webp',
  technology: '/images/hero/hero-tech-careers.webp',
  business: '/images/hero/hero-business.webp',
  beauty: '/images/hero/hero-beauty-wellness.webp',
  transportation: '/images/cdl-hero.webp',
  general: '/images/programs-hero-new.webp',
};

/**
 * Program-specific hero images
 */
export const PROGRAM_HEROES: Record<string, string> = {
  // Beauty & Barber
  'barber-apprenticeship': '/images/barber-hero.webp',
  barber: '/images/barber-hero.webp',
  'cosmetology-apprenticeship': '/images/hero/hero-beauty-wellness.webp',
  'esthetician-apprenticeship': '/images/hero/hero-beauty-wellness.webp',
  'nail-technician-apprenticeship': '/images/hero/hero-beauty-wellness.webp',
  beauty: '/images/hero/hero-beauty-wellness.webp',

  // Healthcare
  'cna-certification': '/images/pages/healthcare-hero.webp',
  cna: '/images/pages/healthcare-hero.webp',
  phlebotomy: '/images/pages/healthcare-hero.webp',
  'medical-assistant': '/images/pages/healthcare-hero.webp',
  'direct-support-professional': '/images/pages/healthcare-hero.webp',
  'drug-collector': '/images/pages/healthcare-hero.webp',
  'cpr-first-aid-hsi': '/images/pages/healthcare-hero.webp',
  healthcare: '/images/pages/healthcare-hero.webp',

  // Skilled Trades
  'hvac-technician': '/images/hvac-hero.webp',
  hvac: '/images/hvac-hero.webp',
  electrical: '/images/pages/about-hero.webp',
  plumbing: '/images/pages/about-hero.webp',
  welding: '/images/pages/about-hero.webp',
  'diesel-mechanic': '/images/cdl-hero.webp',
  'skilled-trades': '/images/hero/hero-skilled-trades.webp',

  // Transportation
  'cdl-training': '/images/cdl-hero.webp',
  cdl: '/images/cdl-hero.webp',
  'cdl-transportation': '/images/cdl-hero.webp',

  // Technology
  cybersecurity: '/images/hero/hero-tech-careers.webp',
  'it-support': '/images/hero/hero-tech-careers.webp',
  technology: '/images/hero/hero-tech-careers.webp',

  // Business
  'tax-preparation': '/images/hero/hero-business.webp',
  'tax-entrepreneurship': '/images/hero/hero-business.webp',
  business: '/images/hero/hero-business.webp',
  'business-financial': '/images/hero/hero-business.webp',

  // Special Programs
  jri: '/images/programs-hero-new.webp',
  'federal-funded': '/images/programs-hero-new.webp',
  apprenticeships: '/images/hero/hero-main-welcome.webp',
  'micro-programs': '/images/programs-hero-new.webp',
};

/**
 * Program to category mapping
 */
export const PROGRAM_CATEGORIES: Record<string, ProgramCategory> = {
  // Beauty
  'barber-apprenticeship': 'beauty',
  barber: 'beauty',
  'cosmetology-apprenticeship': 'beauty',
  'esthetician-apprenticeship': 'beauty',
  'nail-technician-apprenticeship': 'beauty',
  beauty: 'beauty',

  // Healthcare
  'cna-certification': 'healthcare',
  cna: 'healthcare',
  phlebotomy: 'healthcare',
  'medical-assistant': 'healthcare',
  'direct-support-professional': 'healthcare',
  'drug-collector': 'healthcare',
  'cpr-first-aid-hsi': 'healthcare',
  healthcare: 'healthcare',

  // Skilled Trades
  'hvac-technician': 'skilled-trades',
  hvac: 'skilled-trades',
  electrical: 'skilled-trades',
  plumbing: 'skilled-trades',
  welding: 'skilled-trades',
  'diesel-mechanic': 'skilled-trades',
  'skilled-trades': 'skilled-trades',

  // Transportation
  'cdl-training': 'transportation',
  cdl: 'transportation',
  'cdl-transportation': 'transportation',

  // Technology
  cybersecurity: 'technology',
  'it-support': 'technology',
  technology: 'technology',

  // Business
  'tax-preparation': 'business',
  'tax-entrepreneurship': 'business',
  business: 'business',
  'business-financial': 'business',

  // General
  jri: 'general',
  'federal-funded': 'general',
  apprenticeships: 'general',
  'micro-programs': 'general',
};

/**
 * Get hero image for a program slug
 */
export function getProgramHero(slug: string): string {
  if (PROGRAM_HEROES[slug]) {
    return PROGRAM_HEROES[slug];
  }

  const category = PROGRAM_CATEGORIES[slug] || 'general';
  return CATEGORY_HEROES[category];
}

/**
 * Get category for a program slug
 */
export function getProgramCategory(slug: string): ProgramCategory {
  return PROGRAM_CATEGORIES[slug] || 'general';
}

/**
 * Default program snapshots by category
 */
export const DEFAULT_SNAPSHOTS: Record<
  ProgramCategory,
  {
    programType: string;
    duration: string;
    format: string;
    cost: string;
    credential: string;
  }
> = {
  healthcare: {
    programType: 'Certificate Program',
    duration: '4-12 weeks',
    format: 'Hybrid (Online + In-Person)',
    cost: 'Self-pay or WIOA funded',
    credential: 'Industry Certification',
  },
  'skilled-trades': {
    programType: 'Workforce Training',
    duration: '8-16 weeks',
    format: 'Hands-on Training',
    cost: 'Self-pay or WIOA funded',
    credential: 'Industry Certification',
  },
  technology: {
    programType: 'Certificate Program',
    duration: '8-16 weeks',
    format: 'Online + Labs',
    cost: 'Self-pay or WIOA funded',
    credential: 'Industry Certification',
  },
  business: {
    programType: 'Certificate Program',
    duration: '4-8 weeks',
    format: 'Online or Hybrid',
    cost: 'Self-pay available',
    credential: 'Certificate of Completion',
  },
  beauty: {
    programType: 'Registered Apprenticeship',
    duration: 'Based on state requirements',
    format: 'On-the-job + Online',
    cost: 'Self-pay or WRG funded',
    credential: 'Completion Certificate + Hours',
  },
  transportation: {
    programType: 'CDL Training',
    duration: '4-8 weeks',
    format: 'Classroom + Behind-the-wheel',
    cost: 'Self-pay or WIOA funded',
    credential: 'Class A CDL',
  },
  general: {
    programType: 'Training Program',
    duration: 'Varies',
    format: 'Varies',
    cost: 'Contact for details',
    credential: 'Certificate of Completion',
  },
};

/**
 * Default outcomes by category
 */
export const DEFAULT_OUTCOMES: Record<
  ProgramCategory,
  {
    knowledge: string[];
    skills: string[];
    compliance: string[];
  }
> = {
  healthcare: {
    knowledge: [
      'Medical terminology and procedures',
      'Patient care fundamentals',
      'Healthcare regulations and ethics',
    ],
    skills: [
      'Clinical skills and techniques',
      'Patient communication',
      'Documentation and record-keeping',
    ],
    compliance: [
      'HIPAA compliance',
      'Infection control protocols',
      'State certification requirements',
    ],
  },
  'skilled-trades': {
    knowledge: ['Trade theory and principles', 'Safety regulations and codes', 'Blueprint reading'],
    skills: [
      'Hands-on technical skills',
      'Tool and equipment operation',
      'Problem-solving and troubleshooting',
    ],
    compliance: ['OSHA safety standards', 'Industry certifications', 'Code compliance'],
  },
  technology: {
    knowledge: ['Technical fundamentals', 'Industry best practices', 'Security principles'],
    skills: ['Hands-on technical skills', 'Problem-solving', 'System administration'],
    compliance: ['Industry certifications', 'Security protocols', 'Professional standards'],
  },
  business: {
    knowledge: ['Business fundamentals', 'Industry regulations', 'Financial principles'],
    skills: ['Professional communication', 'Software proficiency', 'Client management'],
    compliance: [
      'Industry regulations',
      'Professional ethics',
      'Continuing education requirements',
    ],
  },
  beauty: {
    knowledge: ['Theory and techniques', 'Sanitation and safety', 'State regulations'],
    skills: ['Hands-on service skills', 'Client consultation', 'Business operations'],
    compliance: ['State licensing requirements', 'Sanitation protocols', 'Professional standards'],
  },
  transportation: {
    knowledge: ['DOT regulations', 'Vehicle systems', 'Trip planning and logistics'],
    skills: ['Vehicle operation', 'Pre-trip inspections', 'Defensive driving'],
    compliance: ['CDL requirements', 'Hours of service', 'Safety regulations'],
  },
  general: {
    knowledge: ['Program-specific knowledge', 'Industry fundamentals', 'Professional standards'],
    skills: ['Practical application skills', 'Communication', 'Problem-solving'],
    compliance: ['Industry requirements', 'Professional ethics', 'Continuing education'],
  },
};

/**
 * Default path steps
 */
export const DEFAULT_PATH = [
  {
    step: 1,
    title: 'Apply or Request Info',
    description: 'Submit your application or request more information about the program.',
  },
  {
    step: 2,
    title: 'Eligibility Review',
    description: 'We review your application and determine funding eligibility.',
  },
  {
    step: 3,
    title: 'Enrollment & Onboarding',
    description: 'Complete enrollment, payment, and orientation.',
  },
  {
    step: 4,
    title: 'Training & Coursework',
    description: 'Complete required instruction, labs, and practical training.',
  },
  {
    step: 5,
    title: 'Completion & Next Steps',
    description: 'Receive your credential and career placement support.',
  },
];
