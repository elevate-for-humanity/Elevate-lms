import { resolveCanonicalSlug } from '@/lib/programs/slug';

export const PROGRAM_SLUGS = {
  barber: 'barber-apprenticeship',
  cosmetology: 'cosmetology-apprenticeship',
  esthetician: 'esthetician-apprenticeship',
  nail: 'nail-technician-apprenticeship',
} as const;

export type ProgramKey = keyof typeof PROGRAM_SLUGS;

export const PROGRAM_LABELS: Record<string, string> = {
  [PROGRAM_SLUGS.barber]: 'Barber Apprenticeship',
  [PROGRAM_SLUGS.cosmetology]: 'Cosmetology Apprenticeship',
  [PROGRAM_SLUGS.esthetician]: 'Esthetician Apprenticeship',
  [PROGRAM_SLUGS.nail]: 'Nail Technician Apprenticeship',
};

export function normalizeHostShopProgram(value: unknown): string | null {
  const canonical = resolveCanonicalSlug(String(value ?? ''));
  return Object.values(PROGRAM_SLUGS).some(slug => slug === canonical) ? canonical : null;
}

/** List a business only for its explicitly approved occupations, including dual approvals. */
export function matchesHostShopProgram(
  shop: { programs: string[]; primaryProgram?: string },
  programSlug: string,
) {
  return shop.programs.includes(programSlug);
}

/** Marketing categories follow the business's primary trade; approvals stay intact. */
export function matchesHostShopPresentationProgram(
  shop: { programs: string[]; primaryProgram?: string },
  programSlug: string,
) {
  if (!matchesHostShopProgram(shop, programSlug)) return false;
  if (programSlug === PROGRAM_SLUGS.barber && shop.primaryProgram === PROGRAM_SLUGS.cosmetology) return false;
  if (programSlug === PROGRAM_SLUGS.cosmetology && shop.primaryProgram === PROGRAM_SLUGS.barber) return false;
  return true;
}
