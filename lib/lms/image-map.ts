/**
 * Centralized image assignments for LMS pages.
 * Each key maps to a unique image — no duplicates across the LMS.
 */

// -- Hero banners (one per page) --
export const LMS_HEROES = {
  dashboard:     '/images/pages/comp-cta-career.jpg',
  courses:       '/images/pages/comp-cta-training.jpg',
  progress:      '/images/pages/comp-cta-career.jpg',
  quizzes:       '/images/pages/comp-cta-training.jpg',
  schedule:      '/images/pages/comp-cta-career.jpg',
  messages:      '/images/pages/comp-cta-career.jpg',
  certificates:  '/images/pages/comp-cta-career.jpg',
  assignments:   '/images/pages/comp-cta-training.jpg',
  grades:        '/images/pages/comp-cta-training.jpg',
  resources:     '/images/pages/comp-cta-career.jpg',
  achievements:  '/images/pages/comp-cta-career.jpg',
  profile:       '/images/pages/comp-cta-career.jpg',
  support:       '/images/pages/comp-cta-career.jpg',
  forums:        '/images/pages/comp-cta-training.jpg',
} as const;

// -- Dashboard section cards (state-aware sections) --
export const LMS_SECTION_CARDS = {
  orientation:   '/images/pages/comp-cta-training.jpg',
  eligibility:   '/hero-images/apply-hero.jpg',
  programs:      '/hero-images/programs-hero.jpg',
  programsView:  '/hero-images/pathways-hero.jpg',
  funding:       '/hero-images/federal-funded-hero.jpg',
  courses:       '/images/pages/comp-cta-training.jpg',
  progress:      '/images/pages/comp-pathway-trades.jpg',
  certificates:  '/hero-images/apprenticeships-hero.jpg',
  certification: '/hero-images/services-hero.jpg',
  placement:     '/hero-images/employer-new-hero.jpg',
  support:       '/hero-images/contact-hero.jpg',
  alumni:        '/hero-images/about-hero.jpg',
} as const;

// -- Dashboard "My Learning Tools" sidebar cards --
export const LMS_TOOLS = {
  courses:       '/images/pages/comp-cta-training.jpg',
  assignments:   '/images/pages/comp-cta-training.jpg',
  grades:        '/images/pages/comp-cta-training.jpg',
  quizzes:       '/images/pages/comp-cta-training.jpg',
  schedule:      '/images/pages/comp-cta-training.jpg',
  messages:      '/images/pages/comp-cta-training.jpg',
  resources:     '/images/pages/comp-cta-training.jpg',
  certificates:  '/images/pages/comp-cta-training.jpg',
  achievements:  '/images/pages/comp-cta-training.jpg',
  profile:       '/images/pages/comp-cta-training.jpg',
  support:       '/images/pages/comp-cta-training.jpg',
  forums:        '/images/pages/comp-pathway-trades.jpg',
} as const;

// -- Course category images --
export const LMS_CATEGORIES = {
  healthcare:    '/images/pages/comp-cta-training.jpg',
  trades:        '/images/pages/comp-pathway-trades.jpg',
  technology:    '/images/pages/comp-cta-training.jpg',
  business:      '/images/pages/comp-cta-training.jpg',
  default:       '/images/pages/comp-cta-training.jpg',
} as const;

// -- Course detail fallback (when no thumbnail_url) --
export const COURSE_CATEGORY_FALLBACKS: Record<string, string> = {
  healthcare:    '/images/pages/comp-cta-training.jpg',
  trades:        '/images/pages/comp-pathway-trades.jpg',
  technology:    '/images/pages/comp-cta-training.jpg',
  business:      '/images/pages/comp-cta-training.jpg',
  default:       '/images/pages/comp-cta-training.jpg',
};
