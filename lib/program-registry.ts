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
  { slug: 'cna-cert', name: 'CNA (Certified Nursing Assistant)', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'medical-assistant', name: 'Medical Assistant', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'phlebotomy-technician', name: 'Phlebotomy Technician', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'home-health-aide', name: 'Home Health Aide', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'health-safety', name: 'Emergency Health & Safety Technician', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'cpr-cert', name: 'CPR, AED & First Aid', category: 'Healthcare', formType: 'apply', active: true },

  // Skilled Trades
  { slug: 'hvac-technician', name: 'HVAC Technician', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'cdl-training', name: 'CDL (Commercial Driver License)', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'building-maintenance-wrg', name: 'Building Maintenance Technician', category: 'Skilled Trades', formType: 'apply', active: true },

  // Barber & Beauty
  { slug: 'barber-apprenticeship', name: 'Barber Apprenticeship', category: 'Barber & Beauty', formType: 'apply', active: true, dedicatedApplyPage: '/programs/barber-apprenticeship/apply' },
  { slug: 'esthetician', name: 'Esthetician & Skincare Specialist', category: 'Barber & Beauty', formType: 'apply', active: true },
  { slug: 'beauty-career-educator', name: 'Beauty & Career Educator', category: 'Barber & Beauty', formType: 'apply', active: true },

  // Business & Financial
  { slug: 'tax-prep', name: 'Tax Preparation Program', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'business-startup', name: 'Business Start-up & Marketing', category: 'Business & Financial', formType: 'apply', active: true },

  // Human Services
  { slug: 'peer-recovery-specialist-jri', name: 'Certified Peer Recovery Coach', category: 'Human Services', formType: 'apply', active: true },
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
  { slug: 'nail-tech-apprenticeship', name: 'Nail Technician Apprenticeship', category: 'Barber & Beauty', formType: 'apply', active: true },

  // Additional Programs
  { slug: 'culinary-apprenticeship', name: 'Youth Culinary Apprenticeship', category: 'Skilled Trades', formType: 'apply', active: true },
];

/** All valid canonical slugs */
export const VALID_SLUGS = new Set(PROGRAMS.map((p) => p.slug));

/** Common aliases → canonical slugs */
const SLUG_ALIASES: Record<string, string> = {
  'barber': 'barber-apprenticeship',
  'cna': 'cna-cert',
  'cna-certification': 'cna-cert',
  'hvac': 'hvac-technician',
  'cdl': 'cdl-training',
  'esthetician-apprenticeship': 'esthetician',
  'professional-esthetician': 'esthetician',
  'phlebotomy': 'phlebotomy-technician',
  'tax-preparation': 'tax-prep',
  'tax-entrepreneurship': 'tax-prep',
  'tax-prep-financial-services': 'tax-prep',
  'building-maintenance': 'building-maintenance-wrg',
  'building-maintenance-tech': 'building-maintenance-wrg',
  'building-services-technician': 'building-maintenance-wrg',
  'peer-recovery': 'peer-recovery-specialist-jri',
  'certified-peer-recovery-coach': 'peer-recovery-specialist-jri',
  'nail-technician': 'nail-tech-apprenticeship',
  'nail-technician-apprenticeship': 'nail-tech-apprenticeship',
  'cpr-first-aid': 'cpr-cert',
  'cpr-first-aid-hsi': 'cpr-cert',
  'cdl-transportation': 'cdl-training',
  'web-development': 'it-support-specialist',
  'it-support': 'it-support-specialist',
  'cybersecurity': 'cybersecurity-analyst',
  'direct-support-professional': 'dsp-training',
  'forklift': 'forklift-operator',
  'public-safety-reentry-specialist': 'reentry-specialist',
  'emergency-health-safety-tech': 'health-safety',
  'business-startup-marketing': 'business-startup',
  // Category-level aliases
  'healthcare': 'cna-cert',
  'skilled-trades': 'hvac-technician',
  'technology': 'it-support-specialist',
  'beauty': 'cosmetology-apprenticeship',
  'apprenticeship': 'barber-apprenticeship',
  'federal-funded': 'cna-cert',
  'micro-programs': 'cpr-cert',
  'jri': 'peer-recovery-specialist-jri',
  'drug-collector': 'drug-alcohol-specimen-collector',
  'reentry': 'reentry-specialist',
  'home-health': 'home-health-aide',
  'cpr': 'cpr-cert',
  'first-aid': 'cpr-cert',
  'beauty-educator': 'beauty-career-educator',
  'business': 'business-startup',
  'cosmetology': 'cosmetology-apprenticeship',
  'nail-tech': 'nail-tech-apprenticeship',
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
