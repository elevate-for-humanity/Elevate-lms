/**
 * Centralized image assignments for LMS pages.
 * Each key maps to a unique image — no duplicates across the LMS.
 */

// -- Hero banners (one per page) --
export const LMS_HEROES = {
  dashboard: '/images/pages/career-counseling.jpg',
  courses: '/images/pages/training-classroom.webp',
  progress: '/images/pages/career-counseling.jpg',
  quizzes: '/images/pages/training-classroom.webp',
  schedule: '/images/pages/career-counseling.jpg',
  messages: '/images/pages/career-counseling.jpg',
  certificates: '/images/pages/career-counseling.jpg',
  assignments: '/images/pages/training-classroom.webp',
  grades: '/images/pages/training-classroom.webp',
  resources: '/images/pages/career-counseling.jpg',
  achievements: '/images/pages/career-counseling.jpg',
  profile: '/images/pages/career-counseling.jpg',
  support: '/images/pages/career-counseling.jpg',
  forums: '/images/pages/training-classroom.webp',
} as const;

// -- Dashboard section cards (state-aware sections) --
export const LMS_SECTION_CARDS = {
  orientation: '/images/pages/training-classroom.webp',
  eligibility: '/hero-images/apply-hero.jpg',
  programs: '/hero-images/programs-hero.jpg',
  programsView: '/hero-images/pathways-hero.jpg',
  funding: '/hero-images/federal-funded-hero.jpg',
  courses: '/images/pages/training-classroom.webp',
  progress: '/images/pages/hvac-technician.webp',
  certificates: '/hero-images/apprenticeships-hero.jpg',
  certification: '/hero-images/services-hero.jpg',
  placement: '/hero-images/employer-new-hero.jpg',
  support: '/hero-images/contact-hero.jpg',
  alumni: '/hero-images/about-hero.jpg',
} as const;

// -- Dashboard "My Learning Tools" sidebar cards --
export const LMS_TOOLS = {
  courses: '/images/pages/training-classroom.webp',
  assignments: '/images/pages/training-classroom.webp',
  grades: '/images/pages/training-classroom.webp',
  quizzes: '/images/pages/training-classroom.webp',
  schedule: '/images/pages/training-classroom.webp',
  messages: '/images/pages/training-classroom.webp',
  resources: '/images/pages/training-classroom.webp',
  certificates: '/images/pages/training-classroom.webp',
  achievements: '/images/pages/training-classroom.webp',
  profile: '/images/pages/training-classroom.webp',
  support: '/images/pages/training-classroom.webp',
  forums: '/images/pages/hvac-technician.webp',
} as const;

// -- Course category images --
export const LMS_CATEGORIES = {
  healthcare: '/images/pages/training-classroom.webp',
  trades: '/images/pages/hvac-technician.webp',
  technology: '/images/pages/training-classroom.webp',
  business: '/images/pages/training-classroom.webp',
  default: '/images/pages/training-classroom.webp',
} as const;

// -- Course detail fallback (when no thumbnail_url) --
export const COURSE_CATEGORY_FALLBACKS: Record<string, string> = {
  healthcare: '/images/pages/training-classroom.webp',
  trades: '/images/pages/hvac-technician.webp',
  technology: '/images/pages/training-classroom.webp',
  business: '/images/pages/training-classroom.webp',
  default: '/images/pages/training-classroom.webp',
};
