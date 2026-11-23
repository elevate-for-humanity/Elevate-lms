export const COURSE_BUILDER_MONTHLY_PRICE = 130;

export const COURSE_DRAFT_SIZES = [
  { name: 'Short', lessons: '1–5', credits: 500 },
  { name: 'Standard', lessons: '6–15', credits: 1_500 },
  { name: 'Extended', lessons: '16–25', credits: 2_500 },
] as const;

export const COURSE_BUILDER_REQUESTS = {
  'course-builder-monthly-plan':
    `I’m interested in the $${COURSE_BUILDER_MONTHLY_PRICE}/month Course Builder plan. Please confirm availability and help me estimate how many credits I’ll need.`,
  'course-builder-one-time-credits':
    'I would like a quote for one-time Course Builder credits. Please confirm the credits and total price for my next set of courses.',
  'course-builder-monthly-upgrade':
    'I would like a quote for a higher monthly Course Builder allowance. Please confirm the monthly credits and price for my expected course volume.',
} as const;

export function courseBuilderRequestHref(product: keyof typeof COURSE_BUILDER_REQUESTS) {
  return `/contact?product=${product}#contact-form`;
}
