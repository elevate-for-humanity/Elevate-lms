/**
 * Student Testimonials
 * Success stories from program graduates
 *
 * NOTE: This file will be populated with real testimonials as students graduate.
 * Do not add placeholder or fabricated testimonials.
 */

export interface Testimonial {
  id: string;
  name: string;
  photo: string;
  programSlug: string;
  programName: string;
  quote: string;
  outcome: string;
  graduationYear: number;
  currentRole?: string;
  currentEmployer?: string;
}

// Real testimonials will be added here as students graduate and provide consent
export const testimonials: Testimonial[] = [];

export function getTestimonialsByProgram(programSlug: string): Testimonial[] {
  return testimonials.filter((t) => t.programSlug === programSlug);
}

export function getFeaturedTestimonials(count: number = 6): Testimonial[] {
  return testimonials.slice(0, count);
}
