/**
 * Canonical intake/navigation program registry.
 *
 * Displayed programs are derived from the normalized static program registry so
 * program titles, funding claims, and RAPIDS claims cannot drift between the
 * program detail pages and intake dropdowns. Programs without a dedicated
 * static schema live in one explicit supplemental list below.
 *
 * Compatibility aliases are accepted as INPUT ONLY. They are never returned by
 * getActivePrograms() and therefore do not create duplicate public choices.
 */

import { ALL_PROGRAMS } from '@/lib/programs/static-registry';

export type ApplicationFormType =
  | 'student'
  | 'barber'
  | 'employer'
  | 'partner'
  | 'staff';

export interface ProgramEntry {
  slug: string;
  name: string;
  category: string;
  formType: ApplicationFormType;
  active: boolean;
  dedicatedApplyPage?: string;
}

const DEDICATED_APPLY_PAGES: Record<string, string> = {
  'barber-apprenticeship': '/apply/barber-apprenticeship',
  'cosmetology-apprenticeship': '/apply/cosmetology-apprenticeship',
  'peer-recovery-specialist': '/apply/peer-recovery-specialist',
};

const STATIC_ENTRIES: ProgramEntry[] = ALL_PROGRAMS.map((program) => ({
  slug: program.slug,
  name: program.title,
  category: program.category || program.sector,
  formType: program.slug === 'barber-apprenticeship' ? 'barber' : 'student',
  active: true,
  ...(DEDICATED_APPLY_PAGES[program.slug]
    ? { dedicatedApplyPage: DEDICATED_APPLY_PAGES[program.slug] }
    : {}),
}));

/**
 * Active intake choices that do not yet have a dedicated static ProgramSchema.
 * Keep names neutral unless a credential/approval is verified elsewhere.
 */
const SUPPLEMENTAL_PROGRAMS: ProgramEntry[] = [
  { slug: 'administrative-assistant', name: 'Administrative Assistant', category: 'Business', formType: 'student', active: true },
  { slug: 'automotive-technician', name: 'Automotive Technician', category: 'Skilled Trades', formType: 'student', active: true },
  { slug: 'building-maintenance-wrg', name: 'Building Maintenance Training', category: 'Skilled Trades', formType: 'student', active: true },
  { slug: 'business-startup', name: 'Business Startup Training', category: 'Business', formType: 'student', active: true },
  { slug: 'chw-cert', name: 'Community Health Worker Training', category: 'Healthcare', formType: 'student', active: true },
  { slug: 'customer-service-representative', name: 'Customer Service Representative', category: 'Business', formType: 'student', active: true },
  { slug: 'data-analytics', name: 'Data Analytics', category: 'Technology', formType: 'student', active: true },
  { slug: 'dental-assistant', name: 'Dental Assistant', category: 'Healthcare', formType: 'student', active: true },
  { slug: 'drug-alcohol-specimen-collector', name: 'Drug & Alcohol Specimen Collector', category: 'Healthcare', formType: 'student', active: true },
  { slug: 'dsp-training', name: 'Direct Support Professional Training', category: 'Healthcare', formType: 'student', active: true },
  { slug: 'electrical', name: 'Electrical Training Pathway', category: 'Skilled Trades', formType: 'student', active: true },
  { slug: 'emt-apprenticeship', name: 'EMT Training Pathway', category: 'Healthcare', formType: 'student', active: true },
  { slug: 'entrepreneurship-small-business', name: 'Entrepreneurship & Small Business', category: 'Business', formType: 'student', active: true },
  { slug: 'financial-literacy', name: 'Financial Literacy', category: 'Business', formType: 'student', active: true },
  { slug: 'forklift-operator', name: 'Forklift Operator Training', category: 'Skilled Trades', formType: 'student', active: true },
  { slug: 'insurance-agent', name: 'Insurance Agent Training', category: 'Business', formType: 'student', active: true },
  { slug: 'it-support-specialist', name: 'IT Support Specialist', category: 'Technology', formType: 'student', active: true },
  { slug: 'life-coach-certification-wioa', name: 'Life Coach Training', category: 'Human Services', formType: 'student', active: true },
  { slug: 'manufacturing-technician', name: 'Manufacturing Technician', category: 'Skilled Trades', formType: 'student', active: true },
  { slug: 'nrf-riseup', name: 'NRF RISE Up Training', category: 'Business', formType: 'student', active: true },
  { slug: 'plumbing', name: 'Plumbing Training Pathway', category: 'Skilled Trades', formType: 'student', active: true },
  { slug: 'real-estate-agent', name: 'Real Estate Agent Training', category: 'Business', formType: 'student', active: true },
  { slug: 'reentry-specialist', name: 'Public Safety Reentry Specialist', category: 'Human Services', formType: 'student', active: true },
  { slug: 'solar-panel-installation', name: 'Solar Panel Installation', category: 'Skilled Trades', formType: 'student', active: true },
  { slug: 'welding', name: 'Welding Training', category: 'Skilled Trades', formType: 'student', active: true },
  { slug: 'youth-culinary-apprenticeship', name: 'Youth Culinary Training Pathway', category: 'Hospitality', formType: 'student', active: true },
];

function buildCanonicalPrograms(): ProgramEntry[] {
  const bySlug = new Map<string, ProgramEntry>();
  for (const program of [...STATIC_ENTRIES, ...SUPPLEMENTAL_PROGRAMS]) {
    if (bySlug.has(program.slug)) {
      throw new Error(`Duplicate canonical program slug: ${program.slug}`);
    }
    bySlug.set(program.slug, program);
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const PROGRAMS: ProgramEntry[] = buildCanonicalPrograms();

/** Compatibility input aliases only; never rendered as separate programs. */
export const PROGRAM_ALIASES: Record<string, string> = {
  barber: 'barber-apprenticeship',
  cdl: 'cdl-training',
  hvac: 'hvac-technician',
  business: 'business-administration',
  forklift: 'forklift-operator',
  'nail-technician': 'nail-technician-apprenticeship',
  'nail-tech': 'nail-technician-apprenticeship',
  'peer-support': 'peer-recovery-specialist',
  'recovery-coach': 'peer-recovery-specialist',
  'esthetician-apprenticeship': 'esthetician',
  'home-health-aid': 'home-health-aide',
};

export function normalizeProgramSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/_/g, '-');
}

export function resolveSlug(rawSlug: string): string | null {
  const normalized = normalizeProgramSlug(rawSlug || '');
  if (!normalized) return null;
  const canonical = PROGRAM_ALIASES[normalized] ?? normalized;
  return PROGRAMS.some((program) => program.slug === canonical) ? canonical : null;
}

export function resolveProgram(rawSlug: string): ProgramEntry | undefined {
  const slug = resolveSlug(rawSlug);
  return slug ? PROGRAMS.find((program) => program.slug === slug) : undefined;
}

export const getProgram = resolveProgram;

export function getActivePrograms(): ProgramEntry[] {
  return PROGRAMS.filter((program) => program.active);
}

export function getProgramNames(): string[] {
  return getActivePrograms().map((program) => program.name);
}

export function getApplyUrl(rawSlug: string): string {
  const program = resolveProgram(rawSlug);
  if (!program) return '/apply/student';
  return program.dedicatedApplyPage ?? `/apply/student?program=${encodeURIComponent(program.slug)}`;
}

export const PROGRAM_CATEGORIES = [
  'Healthcare',
  'Skilled Trades',
  'Technology',
  'Business',
  'Personal Services',
  'Human Services',
  'Hospitality',
  'Workforce Training',
] as const;

export type ProgramCategory = (typeof PROGRAM_CATEGORIES)[number];
export const PROGRAM_CATEGORIES_WITH_ALL = ['All', ...PROGRAM_CATEGORIES] as const;

const CATEGORY_ALIASES: Record<string, ProgramCategory> = {
  healthcare: 'Healthcare',
  health: 'Healthcare',
  'skilled-trades': 'Skilled Trades',
  trades: 'Skilled Trades',
  technology: 'Technology',
  tech: 'Technology',
  business: 'Business',
  'personal-services': 'Personal Services',
  beauty: 'Personal Services',
  barber: 'Personal Services',
  'human-services': 'Human Services',
  hospitality: 'Hospitality',
  workforce: 'Workforce Training',
  'workforce-training': 'Workforce Training',
};

export function normalizeProgramCategory(value: string | null | undefined): ProgramCategory | null {
  if (!value) return null;
  const exact = PROGRAM_CATEGORIES.find((category) => category.toLowerCase() === value.trim().toLowerCase());
  if (exact) return exact;
  return CATEGORY_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function isProgramCategory(value: string): value is ProgramCategory {
  return PROGRAM_CATEGORIES.includes(value as ProgramCategory);
}

export function programCategoryFromSearchParam(value: string | null | undefined): ProgramCategory | 'All' {
  if (!value || value.toLowerCase() === 'all') return 'All';
  return normalizeProgramCategory(value) ?? 'All';
}

export function programMatchesCategory(program: Pick<ProgramEntry, 'category'>, category: ProgramCategory | 'All'): boolean {
  if (category === 'All') return true;
  return normalizeProgramCategory(program.category) === category;
}

export function buildProgramsHref(category?: ProgramCategory | 'All'): string {
  if (!category || category === 'All') return '/programs';
  return `/programs?category=${encodeURIComponent(category)}`;
}
