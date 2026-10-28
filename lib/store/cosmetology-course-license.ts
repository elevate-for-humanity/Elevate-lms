export const COSMETOLOGY_COURSE_LICENSE = {
  slug: 'prestige-elevation-cosmetology',
  name: 'Prestige Elevation Cosmetology Course',
  courseId: 'a6b0b712-1cf0-475a-ba79-ee2023dea8ec',
  pricePerStudentCents: 27500,
  lessons: 40,
  workbookSections: 40,
  image: '/images/partners/generations-hair/premium-stylist-at-work.jpg',
} as const;

export function cosmetologyLicenseTotal(seats: number): number {
  if (!Number.isSafeInteger(seats) || seats < 1 || seats > 1000)
    throw new Error('Choose 1 to 1,000 student seats.');
  return seats * COSMETOLOGY_COURSE_LICENSE.pricePerStudentCents;
}
