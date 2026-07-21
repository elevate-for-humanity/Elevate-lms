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
  eligibility: '/images/pages/apply-employer-hero.webp',
  programs: '/images/programs-hero-new.webp',
  programsView: '/images/pages/programs-it-hero.webp',
  funding: '/images/pages/funding-hero.webp',
  courses: '/images/pages/training-classroom.webp',
  progress: '/images/pages/hvac-technician.webp',
  certificates: '/images/pages/certifications-hero.webp',
  certification: '/images/pages/certificates-hero.webp',
  placement: '/images/pages/career-services-hero.webp',
  support: '/images/pages/contact-hero.webp',
  alumni: '/images/pages/about-hero.webp',
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
