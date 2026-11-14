/**
 * Canonical program slug resolution — single map for URLs, DB, and intake.
 *
 * Canonical slugs: used in static files and public URLs (e.g. `cna`, `cpr-first-aid`).
 * DB slugs: live `programs.slug` when legacy rows differ (e.g. `cna-cert`).
 */

/** Free-text / legacy program_interest → canonical slug */
export const SLUG_ALIASES: Readonly<Record<string, string>> = {
  'cna certification': 'cna',
  'cna training': 'cna',
  'certified nursing assistant': 'cna',
  hvac: 'hvac-technician',
  'hvac tech': 'hvac-technician',
  'hvac technician': 'hvac-technician',
  'cosmetology apprenticeship': 'cosmetology-apprenticeship',
  cosmetology: 'cosmetology-apprenticeship',
  'hair stylist esthetician apprenticeship': 'cosmetology-apprenticeship',
  'barber apprenticeship': 'barber-apprenticeship',
  barber: 'barber-apprenticeship',
  barbering: 'barber-apprenticeship',
  'medical assistant': 'medical-assistant',
  phlebotomy: 'phlebotomy',
  'phlebotomy technician': 'phlebotomy',
  'home health aide': 'home-health-aide',
  accounting: 'bookkeeping',
  bookkeeping: 'bookkeeping',
  entrepreneurship: 'entrepreneurship',
  'entrepreneurship small business': 'entrepreneurship',
  'electrical apprenticeship': 'electrical',
  'plumbing apprenticeship': 'plumbing',
  'welding certification': 'welding',
  'building maintenance': 'building-maintenance-wrg',
  'building maintenance technician': 'building-maintenance-wrg',
  'it support specialist': 'it-help-desk',
  'it support': 'it-help-desk',
  cybersecurity: 'cybersecurity-analyst',
  'cybersecurity fundamentals': 'cybersecurity-analyst',
  cdl: 'cdl-training',
  "cdl (commercial driver's license)": 'cdl-training',
  "commercial driver's license": 'cdl-training',
  'peer recovery specialist': 'peer-recovery-specialist',
  'drug & alcohol specimen collector': 'drug-alcohol-specimen-collector',
  'emergency health & safety tech': 'emergency-health-safety',
  'public safety reentry specialist': 'public-safety-reentry',
  'direct support professional': 'direct-support-professional',
  'cna-cert': 'cna',
  'cna-certification': 'cna',
  'certified-nursing-assistant': 'cna',
  'cpr-cert': 'cpr-first-aid',
  'medical-assistant-program': 'medical-assistant',
  'nha-phlebotomy': 'phlebotomy',
  'emergency-health-safety-tech': 'emergency-health-safety',
  'hvac-tech': 'hvac-technician',
  'hvac-technician-wrg': 'hvac-technician',
  'forklift-operator': 'forklift',
  'cdl-transportation': 'cdl-training',
  'building-maintenance': 'building-maintenance-wrg',
  'building-maintenance-tech': 'building-maintenance-wrg',
  'bookkeeping-fundamentals': 'bookkeeping',
  'entrepreneurship-small-business': 'entrepreneurship',
  'peer-recovery-specialist-jri': 'peer-recovery-specialist',
  'peer-recovery': 'peer-recovery-specialist',
  'peer-recovery-coach': 'peer-recovery-specialist',
  'peer-support': 'peer-recovery-specialist',
  'recovery-coach': 'peer-recovery-specialist',
  esthetician: 'esthetician-apprenticeship',
  esthetics: 'esthetician-apprenticeship',
  'esthetics-apprenticeship': 'esthetician-apprenticeship',
  'nail-tech': 'nail-technician-apprenticeship',
  'nail-tech-apprenticeship': 'nail-technician-apprenticeship',
  'nail-technician': 'nail-technician-apprenticeship',
  nail: 'nail-technician-apprenticeship',
  nails: 'nail-technician-apprenticeship',
  manicurist: 'nail-technician-apprenticeship',
  'manicurist-apprenticeship': 'nail-technician-apprenticeship',
};

function normalizeProgramInput(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, ' ');
}

/** All intake, host-shop, catalog and DB lookups use this exact resolver. */
export function resolveCanonicalSlug(input: string): string {
  const raw = normalizeProgramInput(input);
  if (!raw) return raw;
  return SLUG_ALIASES[raw] ?? SLUG_ALIASES[raw.replace(/ /g, '-')] ??
    SLUG_ALIASES[raw.replace(/-/g, ' ')] ?? raw.replace(/ /g, '-');
}

export function toDbSlug(input: string): string {
  const canonical = resolveCanonicalSlug(input);
  return canonical;
}

export const toCanonicalSlug = resolveCanonicalSlug;

export function slugLookupVariants(input: string): string[] {
  const canonical = resolveCanonicalSlug(input);
  const db = toDbSlug(canonical);
  return canonical === db ? [canonical] : [canonical, db];
}
