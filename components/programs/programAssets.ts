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
  healthcare: '/hero-images/healthcare-hero.jpg',
  'skilled-trades': '/hero-images/skilled-trades-hero.jpg',
  technology: '/hero-images/technology-hero.jpg',
  business: '/hero-images/business-hero.jpg',
  beauty: '/hero-images/barber-beauty-cat-new.jpg',
  transportation: '/hero-images/cdl-cat-new.jpg',
  general: '/hero-images/programs-hero.jpg',
};

/**
 * Program-specific hero images
 */
export const PROGRAM_HEROES: Record<string, string> = {
  // Beauty & Barber
  'barber-apprenticeship': '/hero-images/barber-hero.jpg',
  'barber': '/hero-images/barber-hero.jpg',
  'cosmetology-apprenticeship': '/hero-images/barber-beauty-cat-new.jpg',
  'esthetician-apprenticeship': '/hero-images/barber-beauty-cat-new.jpg',
  'nail-technician-apprenticeship': '/hero-images/barber-beauty-cat-new.jpg',
  'beauty': '/hero-images/barber-beauty-cat-new.jpg',

  // Healthcare
  'cna-certification': '/hero-images/healthcare-hero.jpg',
  'cna': '/hero-images/healthcare-hero.jpg',
  'phlebotomy': '/hero-images/healthcare-hero.jpg',
  'medical-assistant': '/hero-images/healthcare-hero.jpg',
  'direct-support-professional': '/hero-images/healthcare-hero.jpg',
  'drug-collector': '/hero-images/healthcare-hero.jpg',
  'cpr-first-aid-hsi': '/hero-images/healthcare-hero.jpg',
  'healthcare': '/hero-images/healthcare-hero.jpg',

  // Skilled Trades
  'hvac-technician': '/images/pages/hvac-technician.jpg',
  'hvac': '/images/pages/hvac-unit.jpg',
  'electrical': '/images/pages/electrical.jpg',
  'plumbing': '/images/pages/plumbing.jpg',
  'welding': '/images/pages/welding-sparks.jpg',
  'diesel-mechanic': '/images/pages/hvac-tools.jpg',
  'skilled-trades': '/hero-images/skilled-trades-hero.jpg',

  // Transportation
  'cdl-training': '/images/pages/cdl-training.jpg',
  'cdl': '/images/pages/cdl-truck-highway.jpg',
  'cdl-transportation': '/hero-images/cdl-cat-new.jpg',

  // Technology
  'cybersecurity': '/hero-images/technology-hero.jpg',
  'it-support': '/hero-images/technology-hero.jpg',
  'technology': '/hero-images/technology-hero.jpg',

  // Business
  'tax-preparation': '/hero-images/business-hero.jpg',
  'tax-entrepreneurship': '/hero-images/business-hero.jpg',
  'business': '/hero-images/business-hero.jpg',
  'business-financial': '/hero-images/business-hero.jpg',

  // Special Programs
  'jri': '/hero-images/programs-hero.jpg',
  'federal-funded': '/hero-images/programs-hero.jpg',
  'apprenticeships': '/hero-images/apprenticeships-hero.jpg',
  'micro-programs': '/hero-images/programs-hero.jpg',
};

/**
 * Program to category mapping
 */
export const PROGRAM_CATEGORIES: Record<string, ProgramCategory> = {
  // Beauty
  'barber-apprenticeship': 'beauty',
  'barber': 'beauty',
  'cosmetology-apprenticeship': 'beauty',
  'esthetician-apprenticeship': 'beauty',
  'nail-technician-apprenticeship': 'beauty',
  'beauty': 'beauty',

  // Healthcare
  'cna-certification': 'healthcare',
  'cna': 'healthcare',
  'phlebotomy': 'healthcare',
  'medical-assistant': 'healthcare',
  'direct-support-professional': 'healthcare',
  'drug-collector': 'healthcare',
  'cpr-first-aid-hsi': 'healthcare',
  'healthcare': 'healthcare',

  // Skilled Trades
  'hvac-technician': 'skilled-trades',
  'hvac': 'skilled-trades',
  'electrical': 'skilled-trades',
  'plumbing': 'skilled-trades',
  'welding': 'skilled-trades',
  'diesel-mechanic': 'skilled-trades',
  'skilled-trades': 'skilled-trades',

  // Transportation
  'cdl-training': 'transportation',
  'cdl': 'transportation',
  'cdl-transportation': 'transportation',

  // Technology
  'cybersecurity': 'technology',
  'it-support': 'technology',
  'technology': 'technology',

  // Business
  'tax-preparation': 'business',
  'tax-entrepreneurship': 'business',
  'business': 'business',
  'business-financial': 'business',

  // General
  'jri': 'general',
  'federal-funded': 'general',
  'apprenticeships': 'general',
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
export const DEFAULT_SNAPSHOTS: Record<ProgramCategory, {
  programType: string;
  duration: string;
  format: string;
  cost: string;
  credential: string;
}> = {
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
export const DEFAULT_OUTCOMES: Record<ProgramCategory, {
  knowledge: string[];
  skills: string[];
  compliance: string[];
}> = {
  healthcare: {
    knowledge: ['Medical terminology and procedures', 'Patient care fundamentals', 'Healthcare regulations and ethics'],
    skills: ['Clinical skills and techniques', 'Patient communication', 'Documentation and record-keeping'],
    compliance: ['HIPAA compliance', 'Infection control protocols', 'State certification requirements'],
  },
  'skilled-trades': {
    knowledge: ['Trade theory and principles', 'Safety regulations and codes', 'Blueprint reading'],
    skills: ['Hands-on technical skills', 'Tool and equipment operation', 'Problem-solving and troubleshooting'],
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
    compliance: ['Industry regulations', 'Professional ethics', 'Continuing education requirements'],
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
  { step: 1, title: 'Apply or Request Info', description: 'Submit your application or request more information about the program.' },
  { step: 2, title: 'Eligibility Review', description: 'We review your application and determine funding eligibility.' },
  { step: 3, title: 'Enrollment & Onboarding', description: 'Complete enrollment, payment, and orientation.' },
  { step: 4, title: 'Training & Coursework', description: 'Complete required instruction, labs, and practical training.' },
  { step: 5, title: 'Completion & Next Steps', description: 'Receive your credential and career placement support.' },
];
