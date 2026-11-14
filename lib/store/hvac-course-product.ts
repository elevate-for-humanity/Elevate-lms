import type { StoreProduct } from './products';

export const HVAC_STORE_BUNDLE = {
  id: 'b42450f3-c557-5d6e-98c9-921fba2afbec',
  slug: 'hvac-epa608-guided-practice-workbook',
  name: 'EPA 608 Refrigeration — Types I, II & III: Course + Workbook',
  price: 182,
  category: 'certification-prep',
  description: '17 narrated lessons, a PARIS-guided illustrated workbook with 51 activities, interactive simulations, and four 25-question practice tests. Online study only; official exams and supervised hands-on training are separate.',
  image: '/images/courses/epa608-course-20261102.webp',
  inStock: true,
  featured: true,
  digital: true,
} satisfies StoreProduct;

export const HVAC_STORE_COURSE_ID = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
export const HVAC_STORE_WORKBOOK_SLUG = 'hvac-epa608-guided-practice';
export const HVAC_STORE_WORKBOOK_COVER = '/images/courses/epa608-workbook-20261102.webp';
export const HVAC_STORE_HREF = '/store/courses/epa-608-refrigeration';

export function hvacPurchasedCourseHref(productId: string | null) {
  return productId === HVAC_STORE_BUNDLE.id
    ? `https://lms.elevateforhumanity.org/lms/courses/${HVAC_STORE_COURSE_ID}` : null;
}
