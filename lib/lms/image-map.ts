/**
 * Centralized image assignments for LMS pages.
 * Every mapped surface uses a distinct repository image. Do not reuse one
 * generic classroom/counseling image across unrelated learner experiences.
 */

// -- Hero banners (one distinct image per page) --
export const LMS_HEROES = {
  dashboard: '/images/pages/adult-learner.webp',
  courses: '/images/pages/training-classroom.webp',
  progress: '/images/pages/career-counseling.jpg',
  quizzes: '/images/pages/competency-test-hero.webp',
  schedule: '/images/pages/comp-home-highlight-success.webp',
  messages: '/images/pages/contact-hero.webp',
  certificates: '/images/pages/comp-home-highlight-success.webp',
  assignments: '/images/pages/office-admin-desk.jpg',
  grades: '/images/pages/bookkeeping-ledger.webp',
  resources: '/images/pages/admin-courses-partners-hero.webp',
  achievements: '/images/pages/certificates-hero.webp',
  profile: '/images/pages/about-hero.webp',
  support: '/images/pages/career-services-hero.webp',
  forums: '/images/pages/admin-live-chat-detail.webp',
} as const;

// -- Dashboard section cards (state-aware sections) --
export const LMS_SECTION_CARDS = {
  orientation: '/images/pages/program-holder-page-1.webp',
  eligibility: '/images/pages/apply-employer-hero.webp',
  programs: '/images/programs-hero-new.webp',
  programsView: '/images/pages/programs-it-hero.webp',
  funding: '/images/pages/funding-hero.webp',
  courses: '/images/pages/tech-classroom.webp',
  progress: '/images/pages/hvac-technician.webp',
  certificates: '/images/pages/cpr-mannequin.webp',
  certification: '/images/pages/programs-cpr-hero.webp',
  placement: '/images/pages/business-meeting.webp',
  support: '/images/pages/admin-applications-hero.webp',
  alumni: '/images/business/collaboration-1.webp',
} as const;

// -- Dashboard "My Learning Tools" cards --
export const LMS_TOOLS = {
  courses: '/images/pages/it-help-desk.webp',
  assignments: '/images/pages/software-development.jpg',
  grades: '/images/pages/cybersecurity-screen.jpg',
  quizzes: '/images/pages/cna-vitals.webp',
  schedule: '/images/pages/cdl-driver-seat.webp',
  messages: '/images/pages/admin-email-marketing-d2.webp',
  resources: '/images/pages/admin-ai-studio-hero.webp',
  certificates: '/images/pages/pharmacy-tech.webp',
  achievements: '/images/pages/entrepreneurship.webp',
  profile: '/images/business/professional-2.jpg',
  support: '/images/pages/medical-assistant-lab.webp',
  forums: '/images/pages/network-administration.jpg',
} as const;

// -- Course category images --
export const LMS_CATEGORIES = {
  healthcare: '/images/pages/cna-patient-care.jpg',
  trades: '/images/pages/welding-sparks.webp',
  technology: '/images/pages/web-development.webp',
  business: '/images/pexels/business.webp',
  default: '/images/pages/construction-trades.webp',
} as const;

// -- Course detail fallback (when no thumbnail_url) --
export const COURSE_CATEGORY_FALLBACKS: Record<string, string> = {
  healthcare: '/images/pages/medical-assistant-real.webp',
  trades: '/images/pages/electrical-conduit.webp',
  technology: '/images/pages/networking-hero.webp',
  business: '/images/pexels/bookkeeping.webp',
  default: '/images/pages/cdl-loading-dock.webp',
};
