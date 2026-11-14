/**
 * Maps DB program.category values to public /programs section keys.
 */

export const PROGRAM_SECTION_META: Record<string, { label: string; color: string; order: number }> = {
  healthcare: { label: 'Healthcare', color: 'bg-blue-600', order: 1 },
  trades: { label: 'Skilled Trades', color: 'bg-orange-600', order: 2 },
  beauty: { label: 'Beauty & Cosmetology', color: 'bg-pink-600', order: 3 },
  technology: { label: 'Technology', color: 'bg-indigo-600', order: 4 },
  business: { label: 'Business', color: 'bg-emerald-600', order: 5 },
  apprenticeship: { label: 'Apprenticeships', color: 'bg-purple-600', order: 6 },
  hospitality: { label: 'Hospitality', color: 'bg-yellow-600', order: 7 },
  'social services': { label: 'Social Services', color: 'bg-teal-600', order: 8 },
  special: { label: 'Workforce Readiness', color: 'bg-slate-600', order: 9 },
  other: { label: 'More Programs', color: 'bg-slate-500', order: 99 },
};

const DB_CATEGORY_ALIASES: Record<string, string> = {
  healthcare: 'healthcare',
  'health care': 'healthcare',
  'skilled trades': 'trades',
  trades: 'trades',
  'barber & beauty': 'beauty',
  'barber and beauty': 'beauty',
  beauty: 'beauty',
  cosmetology: 'beauty',
  technology: 'technology',
  it: 'technology',
  business: 'business',
  apprenticeship: 'apprenticeship',
  apprenticeships: 'apprenticeship',
  hospitality: 'hospitality',
  'social services': 'social services',
  'workforce readiness': 'special',
  special: 'special',
};

/** Normalize programs.category / category_norm to a stable section key. */
export function normalizeProgramSectionKey(
  category: string | null | undefined,
  categoryNorm?: string | null,
): string {
  const raw = (categoryNorm || category || '').trim();
  if (!raw) return 'other';
  const lower = raw.toLowerCase();
  if (PROGRAM_SECTION_META[lower]) return lower;
  if (DB_CATEGORY_ALIASES[lower]) return DB_CATEGORY_ALIASES[lower];
  return lower.replace(/\s*&\s*/g, ' ').replace(/\s+/g, ' ').trim() || 'other';
}

export function resolveCredentialLabel(row: {
  credential_name?: string | null;
  credential_type?: string | null;
}): string | null {
  const name = row.credential_name?.trim();
  const type = row.credential_type?.trim();
  return name || type || null;
}
