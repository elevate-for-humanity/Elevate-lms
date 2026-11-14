/** Scoped media-generation policy for registered beauty apprenticeship RTI.
 * Does not alter regulatory gates, RTI credit, or publication readiness.
 * Other course types retain the standard media queue.
 */
export const BEAUTY_APPRENTICESHIP_RTI = {
  'barber-apprenticeship': { requiredRtiHours: 260 },
  'cosmetology-apprenticeship': { requiredRtiHours: 154 },
  'esthetician-apprenticeship': { requiredRtiHours: 300 },
  'esthetics-apprenticeship': { requiredRtiHours: 300 },
  'nail-technician-apprenticeship': { requiredRtiHours: 210 },
  'nail-tech-apprenticeship': { requiredRtiHours: 210 },
  'manicurist-apprenticeship': { requiredRtiHours: 210 },
} as const;

export function isBeautyApprenticeshipRti(slug: string | null | undefined): boolean {
  return !!slug && Object.prototype.hasOwnProperty.call(BEAUTY_APPRENTICESHIP_RTI, slug);
}
