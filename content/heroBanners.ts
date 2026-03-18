/**
 * heroBanners.ts — centralized content model for all hero video banners.
 *
 * Rules:
 * - No headline, subheadline, or CTA belongs on the video frame.
 * - belowHeroHeadline / belowHeroSubheadline render BELOW the video.
 * - transcript renders in an expandable section below the fold.
 * - microLabel is 2–4 words max, rendered discreetly on the video.
 * - All pages must reference this file — no page-level hero content duplication.
 */

export interface HeroBannerCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroBannerConfig {
  pageKey: string;
  posterImage: string;
  videoSrcDesktop: string;
  videoSrcMobile?: string;
  voiceoverSrc?: string;
  microLabel?: string;
  belowHeroHeadline: string;
  belowHeroSubheadline: string;
  primaryCta: HeroBannerCta;
  secondaryCta?: HeroBannerCta;
  trustIndicators?: string[];
  transcript?: string;
  analyticsName: string;
}

const heroBanners: Record<string, HeroBannerConfig> = {
  home: {
    pageKey: 'home',
    posterImage: '/images/pages/home-hero-video.jpg',
    videoSrcDesktop: '/videos/homepage-hero-montage.mp4',
    voiceoverSrc: '/videos/homepage-hero-new.mp3',
    microLabel: 'Indianapolis, Indiana',
    belowHeroHeadline: 'Workforce training for real jobs.',
    belowHeroSubheadline:
      'Healthcare, skilled trades, CDL, technology, and more — with funding pathways for eligible Indiana residents.',
    primaryCta: { label: 'Start Here', href: '/start' },
    secondaryCta: { label: 'See All Programs', href: '/programs', variant: 'secondary' },
    trustIndicators: [
      'WIOA & state funding available',
      'DOL Registered Apprenticeship Sponsor',
      'ETPL approved',
      'Indianapolis, Indiana',
    ],
    transcript:
      'At Elevate for Humanity, career training is built for real life. Short-term programs. Industry credentials. Funding that can cover the cost. And a direct path to work.',
    analyticsName: 'home',
  },

  about: {
    pageKey: 'about',
    posterImage: '/images/pages/about-hero.jpg',
    videoSrcDesktop: '/videos/about-mission.mp4',
    voiceoverSrc: '/audio/heroes/about.mp3',
    microLabel: 'Our Mission',
    belowHeroHeadline: 'Built for workforce outcomes.',
    belowHeroSubheadline:
      'Training, credential preparation, support services, and employer connections.',
    primaryCta: { label: 'Our Story', href: '/about#who-we-are' },
    secondaryCta: { label: 'Meet the Team', href: '/about#team', variant: 'secondary' },
    trustIndicators: [
      'Founded 2019',
      'Indianapolis, Indiana',
      'DOL Registered Apprenticeship Sponsor',
    ],
    transcript:
      'Elevate was built to connect training, credentials, and employment in one coordinated system. Not just classes. A workforce pathway.',
    analyticsName: 'about',
  },

  platform: {
    pageKey: 'platform',
    posterImage: '/images/pages/platform-page-1.jpg',
    videoSrcDesktop: '/videos/elevate-overview-with-narration.mp4',
    voiceoverSrc: '/audio/heroes/programs.mp3',
    microLabel: 'Workforce Infrastructure',
    belowHeroHeadline: 'Workforce infrastructure, not just a website.',
    belowHeroSubheadline:
      'A coordinated hub for training delivery, credential pathways, and employer connection.',
    primaryCta: { label: 'Schedule a Demo', href: '/contact' },
    secondaryCta: { label: 'Licensing Options', href: '/store/licensing', variant: 'secondary' },
    trustIndicators: [
      'Multi-tenant architecture',
      'WIOA & DOL compliant',
      'Audit-ready reporting',
    ],
    transcript:
      'This platform connects providers, credential pathways, employers, and workforce agencies through one coordinated infrastructure. The goal is simple: verified training, cleaner operations, and better outcomes.',
    analyticsName: 'platform',
  },

  'funding-how-it-works': {
    pageKey: 'funding-how-it-works',
    posterImage: '/images/pages/funding-page-3.jpg',
    // orientation-full.mp4 used until a dedicated funding hero video is produced
    videoSrcDesktop: '/videos/orientation-full.mp4',
    voiceoverSrc: '/audio/heroes/funding.mp3',
    microLabel: 'Funded Training',
    belowHeroHeadline: 'How funded training works.',
    belowHeroSubheadline:
      'WIOA, apprenticeship pathways, state grants, and guided enrollment.',
    primaryCta: { label: 'Check Eligibility', href: '/start' },
    secondaryCta: { label: 'Contact an Advisor', href: '/contact', variant: 'secondary' },
    trustIndicators: [
      'WIOA Title I funding',
      'Next Level Jobs eligible',
      'DOL Registered Apprenticeship',
      'Job Ready Indy (JRI)',
    ],
    transcript:
      'Funding should not be confusing. We help eligible participants navigate workforce programs, complete the steps, and move into training without unnecessary friction.',
    analyticsName: 'funding-how-it-works',
  },

  healthcare: {
    pageKey: 'healthcare',
    posterImage: '/images/pages/comp-program-template.jpg',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'Healthcare Programs',
    belowHeroHeadline: 'Healthcare training that leads to certification.',
    belowHeroSubheadline:
      'CNA, Medical Assistant, Pharmacy Technician, Phlebotomy, CPR, and more.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=healthcare' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: [
      'Free with WIOA funding',
      'State-approved curricula',
      'Clinical rotations included',
      'Job placement assistance',
    ],
    transcript:
      'Healthcare training should feel professional from day one. Learn the skills, prepare for certification, and step into patient-facing work with confidence.',
    analyticsName: 'healthcare',
  },

  'skilled-trades': {
    pageKey: 'skilled-trades',
    posterImage: '/images/pages/skilled-trades-sector.jpg',
    videoSrcDesktop: '/videos/electrician-trades.mp4',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'Skilled Trades',
    belowHeroHeadline: 'Skilled trades training for high-demand work.',
    belowHeroSubheadline: 'HVAC, Electrical, Welding, Plumbing, CDL, and Diesel.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=skilled-trades' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: [
      'Free with WIOA funding',
      'OSHA certifications included',
      'Hands-on training',
      'Apprenticeship pathways available',
    ],
    transcript:
      'In the trades, confidence comes from repetition, safety, and real equipment. Elevate trains for the field — with hands-on practice, credentials, and a clear route to employment.',
    analyticsName: 'skilled-trades',
  },
};

export default heroBanners;

/** Typed lookup — throws at build time if pageKey is wrong */
export function getHeroBanner(pageKey: keyof typeof heroBanners): HeroBannerConfig {
  const config = heroBanners[pageKey];
  if (!config) throw new Error(`No hero banner config found for pageKey: "${pageKey}"`);
  return config;
}
