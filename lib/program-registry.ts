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
};

export const PROGRAMS: ProgramEntry[] = [
  // Healthcare
  { slug: 'cna-certification', name: 'CNA (Certified Nursing Assistant)', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'medical-assistant', name: 'Medical Assistant', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'phlebotomy-technician', name: 'Phlebotomy Technician', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'home-health-aide', name: 'Home Health Aide', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'emergency-health-safety-tech', name: 'Emergency Health & Safety Technician', category: 'Healthcare', formType: 'apply', active: true },
  { slug: 'cpr-first-aid-hsi', name: 'CPR, AED & First Aid', category: 'Healthcare', formType: 'apply', active: true },

  // Skilled Trades
  { slug: 'hvac-technician', name: 'HVAC Technician', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'cdl-training', name: 'CDL (Commercial Driver License)', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'building-maintenance-tech', name: 'Building Maintenance Technician', category: 'Skilled Trades', formType: 'apply', active: true },

  // Barber & Beauty
  { slug: 'barber-apprenticeship', name: 'Barber Apprenticeship', category: 'Barber & Beauty', formType: 'apply', active: true },
  { slug: 'professional-esthetician', name: 'Esthetician & Skincare Specialist', category: 'Barber & Beauty', formType: 'apply', active: true },
  { slug: 'beauty-career-educator', name: 'Beauty & Career Educator', category: 'Barber & Beauty', formType: 'apply', active: true },

  // Business & Financial
  { slug: 'tax-prep-financial-services', name: 'Tax Preparation & Financial Services', category: 'Business & Financial', formType: 'apply', active: true },
  { slug: 'business-startup-marketing', name: 'Business Start-up & Marketing', category: 'Business & Financial', formType: 'apply', active: true },

  // Human Services
  { slug: 'certified-peer-recovery-coach', name: 'Certified Peer Recovery Coach', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'public-safety-reentry-specialist', name: 'Public Safety Reentry Specialist', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'drug-alcohol-specimen-collector', name: 'Drug & Alcohol Specimen Collector', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'direct-support-professional', name: 'Direct Support Professional', category: 'Human Services', formType: 'apply', active: true },
  { slug: 'sanitation-infection-control', name: 'Sanitation & Infection Control', category: 'Human Services', formType: 'apply', active: true },

  // Technology
  { slug: 'it-support', name: 'IT Support Specialist', category: 'Technology', formType: 'apply', active: true },
  { slug: 'cybersecurity', name: 'Cybersecurity Fundamentals', category: 'Technology', formType: 'apply', active: true },

  // Additional Skilled Trades
  { slug: 'electrical', name: 'Electrical Apprenticeship', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'plumbing', name: 'Plumbing Apprenticeship', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'welding', name: 'Welding Certification', category: 'Skilled Trades', formType: 'apply', active: true },
  { slug: 'diesel-mechanic', name: 'Diesel Mechanic', category: 'Skilled Trades', formType: 'apply', active: true },

  // Additional Barber & Beauty
  { slug: 'cosmetology-apprenticeship', name: 'Cosmetology Apprenticeship', category: 'Barber & Beauty', formType: 'apply', active: true },
  { slug: 'nail-technician-apprenticeship', name: 'Nail Technician Apprenticeship', category: 'Barber & Beauty', formType: 'apply', active: true },

  // Additional Programs
  { slug: 'culinary-apprenticeship', name: 'Youth Culinary Apprenticeship', category: 'Skilled Trades', formType: 'apply', active: true },
];

/** All valid canonical slugs */
export const VALID_SLUGS = new Set(PROGRAMS.map((p) => p.slug));

/** Common aliases → canonical slugs */
const SLUG_ALIASES: Record<string, string> = {
  'barber': 'barber-apprenticeship',
  'cna': 'cna-certification',
  'hvac': 'hvac-technician',
  'cdl': 'cdl-training',
  'esthetician': 'professional-esthetician',
  'esthetician-apprenticeship': 'professional-esthetician',
  'phlebotomy': 'phlebotomy-technician',
  'tax-prep': 'tax-prep-financial-services',
  'tax-preparation': 'tax-prep-financial-services',
  'building-maintenance': 'building-maintenance-tech',
  'building-services-technician': 'building-maintenance-tech',
  'peer-recovery': 'certified-peer-recovery-coach',
  'drug-collector': 'drug-alcohol-specimen-collector',
  'reentry': 'public-safety-reentry-specialist',
  'home-health': 'home-health-aide',
  'cpr': 'cpr-first-aid-hsi',
  'first-aid': 'cpr-first-aid-hsi',
  'beauty-educator': 'beauty-career-educator',
  'business': 'business-startup-marketing',
  'cosmetology': 'cosmetology-apprenticeship',
  'nail-tech': 'nail-technician-apprenticeship',
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
