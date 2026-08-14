import type { HeroSize } from '@/components/ui/PageVideoHero';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface HeroMediaEntry {
  video: string;
  poster: string;
  alt: string;
  audio?: string;
  size: HeroSize;
}

/**
 * Central media registry for legacy PageVideoHero pages.
 * Each unrelated page receives a semantically distinct poster. Route aliases
 * may share media, but unrelated pages must not reuse one generic hero image.
 */
export const HERO_MEDIA: Record<string, HeroMediaEntry> = {
  home: {
    video: '/videos/hero-home.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    alt: 'Elevate for Humanity — workforce training in Indianapolis',
    audio: '/audio/heroes/home.mp3',
    size: 'primary',
  },
  about: {
    video: '/videos/about-mission.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/about-hero.webp',
    alt: 'About ' + PLATFORM_DEFAULTS.orgName,
    audio: '/audio/heroes/about.mp3',
    size: 'marketing',
  },
  mission: {
    video: '/videos/about-mission.mp4',
    poster: '/images/pages/about-supportive-services.webp',
    alt: 'Our mission — workforce development for underserved communities',
    audio: '/audio/heroes/mission.mp3',
    size: 'marketing',
  },
  'career-services': {
    video: '/videos/career-services-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-services-hero.webp',
    alt: 'Career services — job placement and coaching',
    audio: '/audio/heroes/career-services.mp3',
    size: 'marketing',
  },
  impact: {
    video: '/videos/graduation-success.mp4',
    poster: '/images/pages/success-stories-hero.jpg',
    alt: 'Elevate graduate outcomes and community impact',
    audio: '/audio/heroes/impact.mp3',
    size: 'marketing',
  },
  education: {
    video: '/videos/lms-learning.mp4',
    poster: '/images/pages/about-career-training.webp',
    alt: 'Career training programs at ' + PLATFORM_DEFAULTS.orgName,
    audio: '/audio/heroes/education.mp3',
    size: 'marketing',
  },
  employer: {
    video: '/videos/employer-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/employer-hero.webp',
    alt: 'Employer partnerships — hire trained graduates',
    audio: '/audio/heroes/employer.mp3',
    size: 'marketing',
  },
  employers: {
    video: '/videos/employer-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/employer-hero.webp',
    alt: 'Employer partnerships — hire trained graduates',
    audio: '/audio/heroes/employer.mp3',
    size: 'marketing',
  },
  'hire-graduates': {
    video: '/videos/employer-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/about-employer-partners.webp',
    alt: 'Hire Elevate graduates — pre-screened, credentialed workforce',
    size: 'marketing',
  },
  programs: {
    video: '/videos/program-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-hero.webp',
    alt: 'Workforce training programs — trades, healthcare, technology',
    size: 'primary',
  },
  'programs/hvac-technician': {
    video: '/videos/hvac-technician.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-hero.webp',
    alt: 'HVAC technician training — hands-on systems work',
    size: 'program',
  },
  'programs/welding': {
    video: '/videos/welding-trades.mp4',
    poster: '/images/pages/welding.webp',
    alt: 'Welding training — MIG, TIG, and stick welding',
    size: 'program',
  },
  'programs/electrical': {
    video: '/videos/electrician-trades.mp4',
    poster: '/images/pages/electrical-conduit.webp',
    alt: 'Electrical training — residential and commercial wiring',
    size: 'program',
  },
  'programs/cdl-training': {
    video: '/videos/cdl-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cdl-hero.webp',
    alt: 'CDL training — Class A commercial driver license',
    size: 'program',
  },
  'programs/cna-certification': {
    video: '/videos/cna-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cna-hero.jpg',
    alt: 'CNA certification — certified nursing assistant training',
    size: 'program',
  },
  'programs/medical-assistant': {
    video: '/videos/healthcare-cna.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/medical-assistant-hero.webp',
    alt: 'Medical assistant training — clinical and administrative skills',
    size: 'program',
  },
  'programs/barber-apprenticeship': {
    video: '/videos/barber-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/barber-hero.webp',
    alt: 'Barber apprenticeship — Indiana state-licensed program',
    size: 'program',
  },
  'programs/cosmetology-apprenticeship': {
    video: '/videos/beauty-cosmetology.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cosmetology-hero.webp',
    alt: 'Cosmetology apprenticeship — salon skills and licensure',
    size: 'program',
  },
};
