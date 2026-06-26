/**
 * Centralized image assignments for LMS pages.
 * Each key maps to a unique image — no duplicates across the LMS.
 */

// -- Hero banners (one per page) --
export const LMS_HEROES = {
  dashboard: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-counseling.jpg',
  courses: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  progress: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-counseling.jpg',
  quizzes: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  schedule: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-counseling.jpg',
  messages: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-counseling.jpg',
  certificates: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-counseling.jpg',
  assignments: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  grades: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  resources: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-counseling.jpg',
  achievements: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-counseling.jpg',
  profile: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-counseling.jpg',
  support: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-counseling.jpg',
  forums: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
} as const;

// -- Dashboard section cards (state-aware sections) --
export const LMS_SECTION_CARDS = {
  orientation: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  eligibility: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/hero-images/apply-hero.webp',
  programs: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
  programsView: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/hero-images/pathways-hero.webp',
  funding: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/hero-images/federal-funded-hero.webp',
  courses: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  progress: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-technician.webp',
  certificates: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/hero-images/apprenticeships-hero.webp',
  certification: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/hero-images/services-hero.webp',
  placement: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/hero-images/employer-new-hero.webp',
  support: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/hero-images/contact-hero.webp',
  alumni: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/hero-images/about-hero.webp',
} as const;

// -- Dashboard "My Learning Tools" sidebar cards --
export const LMS_TOOLS = {
  courses: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  assignments: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  grades: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  quizzes: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  schedule: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  messages: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  resources: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  certificates: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  achievements: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  profile: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  support: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  forums: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-technician.webp',
} as const;

// -- Course category images --
export const LMS_CATEGORIES = {
  healthcare: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  trades: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-technician.webp',
  technology: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  business: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  default: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
} as const;

// -- Course detail fallback (when no thumbnail_url) --
export const COURSE_CATEGORY_FALLBACKS: Record<string, string> = {
  healthcare: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  trades: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-technician.webp',
  technology: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  business: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
  default: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-classroom.webp',
};
