import type { HeroSize } from '@/components/ui/PageVideoHero';

export interface HeroMediaEntry {
  video: string;
  poster: string;
  alt: string;
  audio?: string;
  size: HeroSize;
}

/**
 * Central media registry for all video hero pages.
 * Pages reference a slug; PageVideoHero resolves assets from here.
 * Audio is only present on story/brand pages — program pages use video only.
 */
export const HERO_MEDIA: Record<string, HeroMediaEntry> = {
  // ── Story / brand pages ──────────────────────────────────────────────────
  home: {
    video:  '/videos/hero-home.mp4',
    poster: '/images/pages/home-hero.jpg',
    alt:    'Elevate for Humanity — workforce training in Indianapolis',
    audio:  '/audio/heroes/home.mp3',
    size:   'primary',
  },
  about: {
    video:  '/videos/about-mission.mp4',
    poster: '/images/pages/about-hero.jpg',
    alt:    'About Elevate for Humanity',
    audio:  '/audio/heroes/about.mp3',
    size:   'marketing',
  },
  mission: {
    video:  '/videos/about-mission.mp4',
    poster: '/images/pages/about-hero.jpg',
    alt:    'Our mission — workforce development for underserved communities',
    audio:  '/audio/heroes/mission.mp3',
    size:   'marketing',
  },
  'career-services': {
    video:  '/videos/career-services-hero.mp4',
    poster: '/images/pages/career-services-hero.jpg',
    alt:    'Career services — job placement and coaching',
    audio:  '/audio/heroes/career-services.mp3',
    size:   'marketing',
  },
  impact: {
    video:  '/videos/graduation-success.mp4',
    poster: '/images/pages/impact-hero.jpg',
    alt:    'Elevate graduate outcomes and community impact',
    audio:  '/audio/heroes/impact.mp3',
    size:   'marketing',
  },
  education: {
    video:  '/videos/lms-learning.mp4',
    poster: '/images/pages/education-hero.jpg',
    alt:    'Career training programs at Elevate for Humanity',
    audio:  '/audio/heroes/education.mp3',
    size:   'marketing',
  },

  // ── Employer / partner pages ─────────────────────────────────────────────
  employer: {
    video:  '/videos/employer-hero.mp4',
    poster: '/images/pages/employer-hero.jpg',
    alt:    'Employer partnerships — hire trained graduates',
    audio:  '/audio/heroes/employer.mp3',
    size:   'marketing',
  },
  employers: {
    video:  '/videos/employer-hero.mp4',
    poster: '/images/pages/employer-hero.jpg',
    alt:    'Employer partnerships — hire trained graduates',
    audio:  '/audio/heroes/employer.mp3',
    size:   'marketing',
  },
  'hire-graduates': {
    video:  '/videos/employer-hero.mp4',
    poster: '/images/pages/hire-graduates-hero.jpg',
    alt:    'Hire Elevate graduates — pre-screened, credentialed workforce',
    size:   'marketing',
  },

  // ── Programs catalog ─────────────────────────────────────────────────────
  programs: {
    video:  '/videos/program-hero.mp4',
    poster: '/images/pages/programs-hero.jpg',
    alt:    'Workforce training programs — trades, healthcare, technology',
    size:   'primary',
  },

  // ── Program pages (video shows the work, no narration needed) ────────────
  'programs/hvac-technician': {
    video:  '/videos/hvac-technician.mp4',
    poster: '/images/pages/hvac-hero.jpg',
    alt:    'HVAC technician training — hands-on systems work',
    size:   'program',
  },
  'programs/welding': {
    video:  '/videos/welding-trades.mp4',
    poster: '/images/pages/welding-hero.jpg',
    alt:    'Welding training — MIG, TIG, and stick welding',
    size:   'program',
  },
  'programs/electrical': {
    video:  '/videos/electrician-trades.mp4',
    poster: '/images/pages/electrical-hero.jpg',
    alt:    'Electrical training — residential and commercial wiring',
    size:   'program',
  },
  'programs/cdl-training': {
    video:  '/videos/cdl-hero.mp4',
    poster: '/images/pages/cdl-hero.jpg',
    alt:    'CDL training — Class A commercial driver license',
    size:   'program',
  },
  'programs/cna-certification': {
    video:  '/videos/cna-hero.mp4',
    poster: '/images/pages/cna-hero.jpg',
    alt:    'CNA certification — certified nursing assistant training',
    size:   'program',
  },
  'programs/medical-assistant': {
    video:  '/videos/healthcare-cna.mp4',
    poster: '/images/pages/medical-assistant-hero.jpg',
    alt:    'Medical assistant training — clinical and administrative skills',
    size:   'program',
  },
  'programs/barber-apprenticeship': {
    video:  '/videos/barber-hero.mp4',
    poster: '/images/pages/barber-hero.jpg',
    alt:    'Barber apprenticeship — Indiana state-licensed program',
    size:   'program',
  },
  'programs/cosmetology-apprenticeship': {
    video:  '/videos/beauty-cosmetology.mp4',
    poster: '/images/pages/cosmetology-hero.jpg',
    alt:    'Cosmetology apprenticeship — salon skills and licensure',
    size:   'program',
  },
};
