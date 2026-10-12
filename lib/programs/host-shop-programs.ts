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

const PROGRAM_ALIASES: Record<string, string> = {
  barber: PROGRAM_SLUGS.barber,
  cosmetology: PROGRAM_SLUGS.cosmetology,
  esthetician: PROGRAM_SLUGS.esthetician,
  esthetics: PROGRAM_SLUGS.esthetician,
  nail: PROGRAM_SLUGS.nail,
  nails: PROGRAM_SLUGS.nail,
  'nail-technician': PROGRAM_SLUGS.nail,
  nail_technician: PROGRAM_SLUGS.nail,
  manicurist: PROGRAM_SLUGS.nail,
  'manicurist-apprenticeship': PROGRAM_SLUGS.nail,
  esthetician_apprenticeship: PROGRAM_SLUGS.esthetician,
  ...Object.fromEntries(Object.values(PROGRAM_SLUGS).map((slug) => [slug, slug])),
};

export function normalizeHostShopProgram(value: unknown): string | null {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  return PROGRAM_ALIASES[normalized] ?? null;
}

/** List a business only for its explicitly approved occupations, including dual approvals. */
export function matchesHostShopProgram(
  shop: { programs: string[]; primaryProgram?: string },
  programSlug: string,
) {
  return shop.programs.includes(programSlug);
}
