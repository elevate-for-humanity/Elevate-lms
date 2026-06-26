/** USDOL beauty apprenticeship program slugs on Elevate LMS */
export const APPRENTICESHIP_PROGRAM_SLUGS = [
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'nail-technician-apprenticeship',
  'esthetician-apprenticeship',
] as const;

export type ApprenticeshipProgramSlug = (typeof APPRENTICESHIP_PROGRAM_SLUGS)[number];

export function isApprenticeshipProgramSlug(slug: string): slug is ApprenticeshipProgramSlug {
  return (APPRENTICESHIP_PROGRAM_SLUGS as readonly string[]).includes(slug);
}

/** Minimum score to count daily theory toward RTI hours for that calendar day */
export const DAILY_THEORY_PASSING_SCORE = 70;
