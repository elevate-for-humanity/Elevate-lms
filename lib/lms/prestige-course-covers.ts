/** Approved Prestige artwork. Covers do not change course release or enrollment access. */
export const PRESTIGE_COURSE_COVERS = {
  barbering: '/images/courses/prestige-barbering.webp',
  cosmetology: '/images/courses/prestige-cosmetology.webp',
  esthetics: '/images/courses/prestige-esthetics.webp',
  nailTechnology: '/images/courses/prestige-nail-technology.webp',
  program: '/images/courses/prestige-barber-beauty-program.webp',
} as const;

const COURSE_COVERS: Readonly<Record<string, string>> = {
  'a6b0b712-1cf0-475a-ba79-ee2023dea8ec': PRESTIGE_COURSE_COVERS.cosmetology,
  '2c723bfa-8c40-4acc-b961-98d917710ffc': PRESTIGE_COURSE_COVERS.barbering,
  '580f7eeb-aa36-4b2a-8526-bbfa6899bb14': PRESTIGE_COURSE_COVERS.barbering,
  '377cd34a-b402-40ab-8ff9-2fcfd394b96d': PRESTIGE_COURSE_COVERS.nailTechnology,
};

export function getPrestigeCourseCover(courseId: string): string | null {
  return COURSE_COVERS[courseId] ?? null;
}
