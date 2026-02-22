/**
 * Centralized image assignments for LMS pages.
 * Each key maps to a unique image — no duplicates across the LMS.
 */

// -- Hero banners (one per page) --
export const LMS_HEROES = {
  dashboard:     '/images/heroes-hq/success-hero.jpg',
  courses:       '/images/programs-hq/students-learning.jpg',
  progress:      '/images/heroes-hq/how-it-works-hero.jpg',
  quizzes:       '/images/programs-hq/technology-hero.jpg',
  schedule:      '/images/heroes-hq/career-services-hero.jpg',
  messages:      '/images/heroes-hq/contact-hero.jpg',
  certificates:  '/images/heroes-hq/success-stories-hero.jpg',
  assignments:   '/images/programs-hq/business-training.jpg',
  grades:        '/images/programs-hq/business-office.jpg',
  resources:     '/images/heroes-hq/programs-hero.jpg',
  achievements:  '/images/heroes-hq/team-hero.jpg',
  profile:       '/images/heroes-hq/about-hero.jpg',
  support:       '/images/heroes-hq/employer-hero.jpg',
  forums:        '/images/programs-hq/skilled-trades-hero.jpg',
} as const;

// -- Dashboard section cards (state-aware sections) --
export const LMS_SECTION_CARDS = {
  orientation:   '/images/programs-hq/training-classroom.jpg',
  eligibility:   '/hero-images/apply-hero.jpg',
  programs:      '/hero-images/programs-hero.jpg',
  programsView:  '/hero-images/pathways-hero.jpg',
  funding:       '/hero-images/federal-funded-hero.jpg',
  courses:       '/images/programs-hq/healthcare-hero.jpg',
  progress:      '/images/trades/program-building-technology.jpg',
  certificates:  '/hero-images/apprenticeships-hero.jpg',
  certification: '/hero-images/services-hero.jpg',
  placement:     '/hero-images/employer-new-hero.jpg',
  support:       '/hero-images/contact-hero.jpg',
  alumni:        '/hero-images/about-hero.jpg',
} as const;

// -- Dashboard "My Learning Tools" sidebar cards --
export const LMS_TOOLS = {
  courses:       '/images/programs-hq/cna-training.jpg',
  assignments:   '/images/programs-hq/barber-training.jpg',
  grades:        '/images/programs-hq/electrical.jpg',
  quizzes:       '/images/programs-hq/cybersecurity.jpg',
  schedule:      '/images/programs-hq/cdl-trucking.jpg',
  messages:      '/images/programs-hq/medical-assistant.jpg',
  resources:     '/images/programs-hq/it-support.jpg',
  certificates:  '/images/programs-hq/phlebotomy.jpg',
  achievements:  '/images/programs-hq/welding.jpg',
  profile:       '/images/programs-hq/hvac-technician.jpg',
  support:       '/images/programs-hq/tax-preparation.jpg',
  forums:        '/images/trades/program-construction-training.jpg',
} as const;

// -- Course category images --
export const LMS_CATEGORIES = {
  healthcare:    '/images/programs-hq/healthcare-hero.jpg',
  trades:        '/images/trades/hero-program-hvac.jpg',
  technology:    '/images/programs-hq/cybersecurity.jpg',
  business:      '/images/programs-hq/business-office.jpg',
  default:       '/images/programs-hq/training-classroom.jpg',
} as const;

// -- Course detail fallback (when no thumbnail_url) --
export const COURSE_CATEGORY_FALLBACKS: Record<string, string> = {
  healthcare:    '/images/programs-hq/healthcare-hero.jpg',
  trades:        '/images/trades/hero-program-welding.jpg',
  technology:    '/images/programs-hq/technology-hero.jpg',
  business:      '/images/programs-hq/business-training.jpg',
  default:       '/images/programs-hq/training-classroom.jpg',
};
