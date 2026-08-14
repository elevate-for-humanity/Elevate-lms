/**
 * Canonical marketing hero configuration.
 *
 * The JSON dataset owns each page's explicit media assignment. Do not replace
 * page videos merely because another page happens to reference the same file;
 * that behavior caused unrelated hero videos to disappear or turn into stills.
 *
 * Posters are also explicit. Do not infer broad topical fallback images because
 * that caused the same workforce/healthcare/business pictures to appear across
 * unrelated pages and made the site look duplicated.
 */

import { loadJsonOnce } from '@/lib/data/json-cache';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { PROGRAM_IMAGES, getProgramHeroImage } from '@/lib/images/programImages';

export interface HeroBannerCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroBannerConfig {
  pageKey: string;
  videoSrcDesktop?: string;
  videoSrcMobile?: string;
  posterImage?: string;
  voiceoverSrc?: string;
  microLabel?: string;
  eyebrow?: string;
  belowHeroHeadline: string;
  belowHeroSubheadline: string;
  primaryCta: HeroBannerCta;
  secondaryCta?: HeroBannerCta;
  trustIndicators?: string[];
  transcript?: string;
  analyticsName: string;
}

type RawHeroBannerConfig = Partial<HeroBannerConfig> & {
  headline?: string;
  subheadline?: string;
  ctaPrimary?: HeroBannerCta;
  ctaSecondary?: HeroBannerCta;
};

export type ProgramHeroBannerConfig = HeroBannerConfig & {
  microLabel: string;
  credentialLabel: string;
  durationLabel: string;
  secondaryCta: HeroBannerCta;
  trustIndicators: string[];
  transcript: string;
} & (
  | { salaryExempt?: false; salaryRangeLabel: string }
  | { salaryExempt: true; salaryNote: string; salaryRangeLabel?: string }
);

const PAGE_PICTURE_OVERRIDES: Record<string, string> = {
  home: '/images/heroes/hero-homepage.webp',
  about: '/images/pages/about-hero.webp',
  platform: '/images/hero/admin-hero.webp',
  healthcare: '/images/pages/healthcare-hero.webp',
  programs: '/images/hero/hero-hands-on-training.webp',
  'building-services-technician': '/images/building-maintenance.webp',
  'federal-funded': '/images/heroes/hero-federal-funding.webp',
  'micro-programs': '/images/micro-classes-hero.webp',
  'skilled-trades': '/images/hero/hero-skilled-trades.webp',
  'home-health-aide': '/images/healthcare/hero-program-patient-care.webp',
};

function posterFor(key: string, banner: RawHeroBannerConfig): string | undefined {
  if (banner.posterImage) return banner.posterImage;
  if (PROGRAM_IMAGES[key]) return getProgramHeroImage(key);
  return PAGE_PICTURE_OVERRIDES[key];
}

function normalizeBanner(key: string, banner: RawHeroBannerConfig): HeroBannerConfig {
  const desktop = banner.videoSrcDesktop || banner.videoSrcMobile;
  const mobile = banner.videoSrcMobile || banner.videoSrcDesktop;

  let normalized: HeroBannerConfig = {
    ...banner,
    pageKey: banner.pageKey ?? key,
    videoSrcDesktop: desktop,
    videoSrcMobile: mobile,
    posterImage: posterFor(key, banner),
    belowHeroHeadline: banner.belowHeroHeadline ?? banner.headline ?? '',
    belowHeroSubheadline: banner.belowHeroSubheadline ?? banner.subheadline ?? '',
    primaryCta: banner.primaryCta ?? banner.ctaPrimary ?? { label: 'View Programs', href: '/programs' },
    secondaryCta: banner.secondaryCta ?? banner.ctaSecondary,
    analyticsName: banner.analyticsName ?? key,
  };

  if (key === 'home') {
    normalized = {
      ...normalized,
      videoSrcDesktop: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
      videoSrcMobile: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
      posterImage: '/images/heroes/hero-homepage.webp',
      voiceoverSrc: '/audio/heroes/home.mp3',
      microLabel: 'The AI-Powered Workforce Operating System',
      eyebrow: 'Career Training & Workforce Development',
      belowHeroHeadline: 'Career Training, Registered Apprenticeships & Workforce Technology in Indiana',
      belowHeroSubheadline:
        'DOL-registered apprenticeship sponsor and WIOA-approved training provider serving learners, employers, and workforce agencies in Indianapolis and across Indiana. Funded training in healthcare, skilled trades, CDL, and technology often at no cost for eligible participants.',
      primaryCta: { label: 'Get Started', href: '/apply' },
      secondaryCta: { label: 'For Employers & Agencies', href: '/partners', variant: 'secondary' },
      trustIndicators: [
        'AI-Driven Career Navigation',
        'Automated Compliance Tracking',
        'Blockchain-Verified Credentials',
      ],
      transcript:
        'Elevate for Humanity is an AI-powered workforce operating system — not just a training provider. We automate the journey from recruitment to employment. Our platform supports credentialing, compliance tracking, employer placement, and apprenticeship coordination through one connected ecosystem.',
      analyticsName: 'home',
    };
  }

  if (key === 'barber-apprenticeship') {
    const barber = RAPIDS_CONFIG.programs.barber;
    normalized = {
      ...normalized,
      microLabel: 'DOL Registered Apprenticeship',
      belowHeroHeadline: 'Earn your Indiana Barber License through registered apprenticeship.',
      belowHeroSubheadline: `Complete ${barber.totalHours.toLocaleString('en-US')} hours of supervised on-the-job learning plus ${barber.relatedInstructionHours} hours of Related Technical Instruction under the registered program standards.`,
      primaryCta: { label: 'Enroll Now', href: '/programs/barber-apprenticeship/apply' },
      secondaryCta: { label: 'Request Information', href: '/programs/barber-apprenticeship/request-info', variant: 'secondary' },
      transcript: `The Barber Apprenticeship combines ${barber.totalHours.toLocaleString('en-US')} hours of supervised on-the-job learning with ${barber.relatedInstructionHours} hours of Related Technical Instruction.`,
    };
  }

  return normalized;
}

let normalizedData: Record<string, HeroBannerConfig> | null = null;

function getData(): Record<string, HeroBannerConfig> {
  if (normalizedData) return normalizedData;
  const raw = loadJsonOnce<Record<string, RawHeroBannerConfig>>('hero-banners.json');
  normalizedData = Object.fromEntries(Object.entries(raw).map(([key, banner]) => [key, normalizeBanner(key, banner)]));
  return normalizedData;
}

const heroBanners: Record<string, HeroBannerConfig> = new Proxy({} as Record<string, HeroBannerConfig>, {
  get(_target, key: string) {
    return getData()[key];
  },
  ownKeys() {
    return Object.keys(getData());
  },
  has(_target, key: string) {
    return key in getData();
  },
  getOwnPropertyDescriptor(_target, key: string) {
    const data = getData();
    if (key in data) return { configurable: true, enumerable: true, value: data[key] };
    return undefined;
  },
});

export default heroBanners;

export const internalProgramHeroBanners: Record<string, ProgramHeroBannerConfig> = new Proxy(
  {} as Record<string, ProgramHeroBannerConfig>,
  {
    get(_target, key: string) {
      const entry = getData()[key] as ProgramHeroBannerConfig | undefined;
      return entry?.credentialLabel ? entry : undefined;
    },
    ownKeys() {
      return Object.keys(getData()).filter((key) => Boolean((getData()[key] as ProgramHeroBannerConfig | undefined)?.credentialLabel));
    },
    has(_target, key: string) {
      return Boolean((getData()[key] as ProgramHeroBannerConfig | undefined)?.credentialLabel);
    },
    getOwnPropertyDescriptor(_target, key: string) {
      const entry = getData()[key] as ProgramHeroBannerConfig | undefined;
      return entry?.credentialLabel ? { configurable: true, enumerable: true, value: entry } : undefined;
    },
  },
);
