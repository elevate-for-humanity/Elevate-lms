/**
 * Canonical program slug resolution — single map for URLs, DB, and intake.
 *
 * Canonical slugs: used in static files and public URLs (e.g. `cna`, `cpr-first-aid`).
 * DB slugs: live `programs.slug` when legacy rows differ (e.g. `cna-cert`).
 */

/** Canonical URL/code slug → live `programs.slug` */
export const CANONICAL_TO_DB_SLUG: Readonly<Record<string, string>> = {
  'peer-recovery-specialist': 'peer-recovery-specialist-jri',
  cna: 'cna-cert',
  'cpr-first-aid': 'cpr-cert',
  business: 'business-startup',
};

const DB_TO_CANONICAL: Record<string, string> = Object.fromEntries(
  Object.entries(CANONICAL_TO_DB_SLUG).map(([canonical, db]) => [db, canonical]),
);

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
};

export function toDbSlug(canonicalOrAliasSlug: string): string {
  const normalized = canonicalOrAliasSlug.trim().toLowerCase();
  const aliased = SLUG_ALIASES[normalized] ?? normalized;
  return CANONICAL_TO_DB_SLUG[aliased] ?? aliased;
}

export function toCanonicalSlug(dbOrInputSlug: string): string {
  const normalized = dbOrInputSlug.trim().toLowerCase();
  return DB_TO_CANONICAL[normalized] ?? normalized;
}

/** Resolve user input to canonical slug (not DB slug). */
export function resolveCanonicalSlug(input: string): string {
  const raw = input.trim().toLowerCase();
  if (!raw) return raw;
  if (SLUG_ALIASES[raw]) return SLUG_ALIASES[raw];
  if (CANONICAL_TO_DB_SLUG[raw]) return raw;
  const fromDb = DB_TO_CANONICAL[raw];
  if (fromDb) return fromDb;
  return raw;
}

/** Slugs to try when loading a program row (canonical first, then DB). */
export function slugLookupVariants(canonicalOrInput: string): string[] {
  const canonical = resolveCanonicalSlug(canonicalOrInput);
  const db = toDbSlug(canonical);
  return canonical === db ? [canonical] : [canonical, db];
}
