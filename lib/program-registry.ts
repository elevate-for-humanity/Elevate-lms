/**
 * Canonical program registry.
 * Single source of truth for slugs, display names, and intake routing.
 * Every form, dropdown, and redirect must consume this list.
 *
 * To add a program: add one entry here. Everything else picks it up.
 */

export type ProgramEntry = {
  slug: string;
  name: string;
  category: string;
  /** Which intake form this program routes to */
  /** 'apply' routes to /apply/student, 'inquiry' routes to /inquiry */
  formType: 'apply' | 'inquiry';
  active: boolean;
  /** If set, /apply?program=slug redirects here instead of the generic form */
  dedicatedApplyPage?: string;
};

export const PROGRAMS: ProgramEntry[] = [
  // Healthcare
  { slug: 'cna', name: 'CNA (Certified Nursing Assistant)', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'medical-assistant', name: 'Medical Assistant', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'phlebotomy', name: 'Phlebotomy Technician', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'home-health-aide', name: 'Home Health Aide', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'emergency-health-safety', name: 'Emergency Health & Safety Technician', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'cpr-first-aid', name: 'CPR, AED & First Aid', category: 'Healthcare', formType: 'apply', active: true },

  // Skilled Trades
  { slug: 'hvac-technician', name: 'HVAC Technician', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'cdl-training', name: 'CDL (Commercial Driver License)', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'building-maintenance-wrg', name: 'Building Maintenance Technician', category: 'Skilled Trades', formType: 'apply', active: true },

  // Barber & Beauty
  { slug: 'barber-apprenticeship', name: 'Barber Apprenticeship', category: 'Barber & Beauty', formType: 'apply', active: true, dedicatedApplyPage: '/programs/barber-apprenticeship/apply' },
  { slug: 'esthetician', name: 'Esthetician & Skincare Specialist', category: 'Barber & Beauty', formType: 'apply', active: true },
  { slug: 'beauty-career-educator', name: 'Beauty & Career Educator', category: 'Barber & Beauty', formType: 'apply', active: true },

  // Business & Financial
  { slug: 'business', name: 'Business Administration', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'tax-prep', name: 'Tax Preparation Program', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'business-startup', name: 'Business Start-up & Marketing', category: 'Business & Financial', formType: 'apply', active: true },

  // Human Services
  { slug: 'peer-recovery-specialist', name: 'Certified Peer Recovery Coach', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'reentry-specialist', name: 'Public Safety Reentry Specialist', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'drug-alcohol-specimen-collector', name: 'Drug & Alcohol Specimen Collector', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'dsp-training', name: 'Direct Support Professional', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'sanitation-infection-control', name: 'Sanitation & Infection Control', category: 'Human Services', formType: 'apply', active: true },

  // Technology
  { slug: 'it-support-specialist', name: 'IT Support Specialist', category: 'Technology', formType: 'apply', active: true },
  { slug: 'cybersecurity-analyst', name: 'Cybersecurity Fundamentals', category: 'Technology', formType: 'apply', active: true },

  // Additional Skilled Trades
  { slug: 'electrical', name: 'Electrical Apprenticeship', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'plumbing', name: 'Plumbing Apprenticeship', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'forklift-operator', name: 'Forklift Operator Certification', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'welding', name: 'Welding Certification', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'diesel-mechanic', name: 'Diesel Mechanic', category: 'Skilled Trades', formType: 'apply', active: true },

  // Additional Barber & Beauty
  { slug: 'cosmetology-apprenticeship', name: 'Cosmetology Apprenticeship', category: 'Barber & Beauty', formType: 'apply', active: true, dedicatedApplyPage: '/programs/cosmetology-apprenticeship/apply' },
  { slug: 'nail-technician', name: 'Nail Technician Apprenticeship', category: 'Barber & Beauty', formType: 'apply', active: true },

  // Additional Programs
  { slug: 'culinary-apprenticeship', name: 'Youth Culinary Apprenticeship', category: 'Skilled Trades', formType: 'apply', active: true },

  // DB-synced programs (active in Supabase)
  { slug: 'administrative-assistant', name: 'Administrative Assistant', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'automotive-technician', name: 'Automotive Technician', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'bookkeeping', name: 'Bookkeeping', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'chw-cert', name: 'Community Health Worker', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'customer-service-representative', name: 'Customer Service Representative', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'data-analytics', name: 'Data Analytics', category: 'Technology', formType: 'apply', active: true },
  { slug: 'dental-assistant', name: 'Dental Assistant', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'emt-apprenticeship', name: 'EMT Apprenticeship', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'entrepreneurship-small-business', name: 'Entrepreneurship & Small Business', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'insurance-agent', name: 'Insurance Agent', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'life-coach-certification-wioa', name: 'Life Coach Certification (WIOA)', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'manufacturing-technician', name: 'Manufacturing Technician', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'nrf-riseup', name: 'NRF RiseUp Retail Certification', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'peer-support', name: 'Peer Support Specialist', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'pharmacy-technician', name: 'Pharmacy Technician', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'real-estate-agent', name: 'Real Estate Agent', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'recovery-coach', name: 'Recovery Coach', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'solar-panel-installation', name: 'Solar Panel Installation', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'web-development', name: 'Web Development', category: 'Technology', formType: 'apply', active: true },
  { slug: 'youth-culinary-apprenticeship', name: 'Youth Culinary Apprenticeship', category: 'Skilled Trades', formType: 'apply', active: true },
];

/** All valid canonical slugs */
export const VALID_SLUGS = new Set(PROGRAMS.map((p) => p.slug));

/** Common aliases → canonical slugs */
const SLUG_ALIASES: Record<string, string> = {
  // Healthcare
  'barber': 'barber-apprenticeship',
  'cna-cert': 'cna',
  'cna-certification': 'cna',
  'hvac': 'hvac-technician',
  'cdl': 'cdl-training',
  'esthetician-apprenticeship': 'esthetician',
  'professional-esthetician': 'esthetician',
  'phlebotomy-technician': 'phlebotomy',
  'tax-preparation': 'tax-prep',
  'tax-entrepreneurship': 'tax-prep',
  'tax-prep-financial-services': 'tax-prep',
  'building-maintenance': 'building-maintenance-wrg',
  'building-maintenance-tech': 'building-maintenance-wrg',
  'building-services-technician': 'building-maintenance-wrg',
  // PRS: legacy DB slug → canonical public slug
  'peer-recovery-specialist-jri': 'peer-recovery-specialist',
  'peer-recovery': 'peer-recovery-specialist',
  'certified-peer-recovery-coach': 'peer-recovery-specialist',
  'nail-technician-apprenticeship': 'nail-technician',
  'nail-tech-apprenticeship':       'nail-technician',
  'nail-tech':                      'nail-technician',
  'cpr-cert': 'cpr-first-aid',
  'cpr-first-aid-hsi': 'cpr-first-aid',
  'cdl-transportation': 'cdl-training',
  'it-support': 'it-support-specialist',
  'cybersecurity': 'cybersecurity-analyst',
  'direct-support-professional': 'dsp-training',
  'forklift': 'forklift-operator',
  'public-safety-reentry-specialist': 'reentry-specialist',
  'emergency-health-safety-tech': 'emergency-health-safety',
  'business-startup-marketing': 'business-startup',
  // Category-level aliases
  'healthcare': 'cna',
  'skilled-trades': 'hvac-technician',
  'technology': 'it-support-specialist',
  'beauty': 'cosmetology-apprenticeship',
  'apprenticeship': 'barber-apprenticeship',
  'federal-funded': 'cna',
  'micro-programs': 'cpr-first-aid',
  'jri': 'peer-recovery-specialist',
  'drug-collector': 'drug-alcohol-specimen-collector',
  'reentry': 'reentry-specialist',
  'home-health': 'home-health-aide',
  'cpr': 'cpr-first-aid',
  'first-aid': 'cpr-first-aid',
  'beauty-educator': 'beauty-career-educator',
  'business-administration': 'business',
  'business-management': 'business',
  'health-safety': 'emergency-health-safety',
  'emergency-health': 'emergency-health-safety',
  'cosmetology': 'cosmetology-apprenticeship',
  'nail-tech': 'nail-technician',
};

/**
 * Resolve a raw slug (or alias) to a canonical program entry.
 */
export function resolveProgram(rawSlug: string): ProgramEntry | undefined {
  const normalized = rawSlug.toLowerCase().trim();
  const canonical = SLUG_ALIASES[normalized] || normalized;
  return PROGRAMS.find((p) => p.slug === canonical);
}

/**
 * Resolve to canonical slug. Returns undefined if not recognized.
 */
export function resolveSlug(rawSlug: string): string | undefined {
  return resolveProgram(rawSlug)?.slug;
}

/** Active programs for dropdowns */
export function getActivePrograms(): ProgramEntry[] {
  return PROGRAMS.filter((p) => p.active);
}

/** Active programs grouped by category for <optgroup> rendering */
export function getActiveProgramsByCategory(): { category: string; programs: ProgramEntry[] }[] {
  const grouped = new Map<string, ProgramEntry[]>();
  for (const p of getActivePrograms()) {
    const list = grouped.get(p.category) || [];
    list.push(p);
    grouped.set(p.category, list);
  }
  return Array.from(grouped.entries()).map(([category, programs]) => ({ category, programs }));
}
