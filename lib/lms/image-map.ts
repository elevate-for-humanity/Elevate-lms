/**
 * Centralized image assignments for LMS pages.
 * Each key maps to a unique image — no duplicates across the LMS.
 */

// -- Hero banners (one per page) --
export const LMS_HEROES = {
  dashboard:     '/images/pages/career-counseling.jpg',
  courses:       '/images/pages/training-classroom.jpg',
  progress:      '/images/pages/career-counseling.jpg',
  quizzes:       '/images/pages/training-classroom.jpg',
  schedule:      '/images/pages/career-counseling.jpg',
  messages:      '/images/pages/career-counseling.jpg',
  certificates:  '/images/pages/career-counseling.jpg',
  assignments:   '/images/pages/training-classroom.jpg',
  grades:        '/images/pages/training-classroom.jpg',
  resources:     '/images/pages/career-counseling.jpg',
  achievements:  '/images/pages/career-counseling.jpg',
  profile:       '/images/pages/career-counseling.jpg',
  support:       '/images/pages/career-counseling.jpg',
  forums:        '/images/pages/training-classroom.jpg',
} as const;

// -- Dashboard section cards (state-aware sections) --
export const LMS_SECTION_CARDS = {
  orientation:   '/images/pages/training-classroom.jpg',
  eligibility:   '/hero-images/apply-hero.jpg',
  programs:      '/hero-images/programs-hero.jpg',
  programsView:  '/hero-images/pathways-hero.jpg',
  funding:       '/hero-images/federal-funded-hero.jpg',
  courses:       '/images/pages/training-classroom.jpg',
  progress:      '/images/pages/hvac-technician.jpg',
  certificates:  '/hero-images/apprenticeships-hero.jpg',
  certification: '/hero-images/services-hero.jpg',
  placement:     '/hero-images/employer-new-hero.jpg',
  support:       '/hero-images/contact-hero.jpg',
  alumni:        '/hero-images/about-hero.jpg',
} as const;

// -- Dashboard "My Learning Tools" sidebar cards --
export const LMS_TOOLS = {
  courses:       '/images/pages/training-classroom.jpg',
  assignments:   '/images/pages/training-classroom.jpg',
  grades:        '/images/pages/training-classroom.jpg',
  quizzes:       '/images/pages/training-classroom.jpg',
  schedule:      '/images/pages/training-classroom.jpg',
  messages:      '/images/pages/training-classroom.jpg',
  resources:     '/images/pages/training-classroom.jpg',
  certificates:  '/images/pages/training-classroom.jpg',
  achievements:  '/images/pages/training-classroom.jpg',
  profile:       '/images/pages/training-classroom.jpg',
  support:       '/images/pages/training-classroom.jpg',
  forums:        '/images/pages/hvac-technician.jpg',
} as const;

// -- Course category images --
export const LMS_CATEGORIES = {
  healthcare:    '/images/pages/training-classroom.jpg',
  trades:        '/images/pages/hvac-technician.jpg',
  technology:    '/images/pages/training-classroom.jpg',
  business:      '/images/pages/training-classroom.jpg',
  default:       '/images/pages/training-classroom.jpg',
} as const;

// -- Course detail fallback (when no thumbnail_url) --
export const COURSE_CATEGORY_FALLBACKS: Record<string, string> = {
  healthcare:    '/images/pages/training-classroom.jpg',
  trades:        '/images/pages/hvac-technician.jpg',
  technology:    '/images/pages/training-classroom.jpg',
  business:      '/images/pages/training-classroom.jpg',
  default:       '/images/pages/training-classroom.jpg',
};
