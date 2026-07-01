/** USDOL beauty apprenticeship program slugs on Elevate LMS */
export const BEAUTY_APPRENTICESHIP_SLUGS = [
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'nail-technician-apprenticeship',
  'esthetician-apprenticeship',
] as const;

export type BeautyApprenticeshipSlug = (typeof BEAUTY_APPRENTICESHIP_SLUGS)[number];

export function isBeautyApprenticeshipSlug(slug: string): slug is BeautyApprenticeshipSlug {
  return (BEAUTY_APPRENTICESHIP_SLUGS as readonly string[]).includes(slug);
}

/** Minimum score to count daily theory toward RTI hours for that calendar day */
export const DAILY_THEORY_PASSING_SCORE = 70;
