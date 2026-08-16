/**
 * Canonical marketing hero configuration.
 *
 * JSON owns copy and non-dedicated media. Dedicated hero media is owned by the
 * video registry and always wins so stale JSON cannot duplicate the homepage
 * film across unrelated pages. Posters are explicit and semantic; no heuristic
 * image substitution is allowed.
 */

import { loadJsonOnce } from '@/lib/data/json-cache';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { PROGRAM_IMAGES, getProgramHeroImage } from '@/lib/images/programImages';
import { getHeroVideoForPageKey } from '@/lib/video/registry';

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
  store: '/images/pages/store-licensing-hero.webp',
};

function mediaKey(value?: string): string | undefined {
  if (!value) return undefined;
  const clean = value.split('#')[0]?.split('?')[0]?.trim();
  if (!clean) return undefined;
  try {
    const url = new URL(clean, 'https://elevate.local');
    return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/{2,}/g, '/').toLowerCase()}`;
  } catch {
    return clean.replace(/\/{2,}/g, '/').toLowerCase();
  }
}

function posterFor(key: string, banner: RawHeroBannerConfig): string | undefined {
  const dedicated = getHeroVideoForPageKey(key);
  if (dedicated?.thumbnail_url) return dedicated.thumbnail_url;
  if (banner.posterImage) return banner.posterImage;
  if (PROGRAM_IMAGES[key]) return getProgramHeroImage(key);
  return PAGE_PICTURE_OVERRIDES[key];
}

function normalizeBanner(
  key: string,
  banner: RawHeroBannerConfig,
  allowJsonVideo = true,
): HeroBannerConfig {
  const dedicated = getHeroVideoForPageKey(key);
  const jsonDesktop = banner.videoSrcDesktop || banner.videoSrcMobile;
  const jsonMobile = banner.videoSrcMobile || banner.videoSrcDesktop;
  const desktop = dedicated?.video_url || (allowJsonVideo ? jsonDesktop : undefined);
  const mobile = dedicated?.video_url || (allowJsonVideo ? jsonMobile : undefined);

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

  // Store is intentionally poster-first. It must never inherit a generic or
  // homepage mobile video from the JSON dataset.
  if (key === 'store') {
    normalized = {
      ...normalized,
      videoSrcDesktop: undefined,
      videoSrcMobile: undefined,
      posterImage: posterFor(key, banner) ?? '/images/pages/store-licensing-hero.webp',
    };
  }

  if (key === 'home') {
    normalized = {
      ...normalized,
      posterImage: posterFor(key, banner) ?? '/images/heroes/hero-homepage.webp',
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
    const programBanner = normalized as ProgramHeroBannerConfig;
    const credential = programBanner.credentialLabel || 'Indiana Barber License';
    const duration = programBanner.durationLabel || `${barber.totalHours.toLocaleString('en-US')} hours`;
    const salary = programBanner.salaryRangeLabel || '$28,000 to $52,000';
    normalized = {
      ...normalized,
      microLabel: 'DOL Registered Apprenticeship',
      belowHeroHeadline: 'Earn your Indiana Barber License through registered apprenticeship.',
      belowHeroSubheadline: `Complete ${barber.totalHours.toLocaleString('en-US')} hours of supervised on-the-job learning plus ${barber.relatedInstructionHours} hours of Related Technical Instruction under the registered program standards.`,
      primaryCta: { label: 'Enroll Now', href: '/programs/barber-apprenticeship/apply' },
      secondaryCta: { label: 'Request Information', href: '/programs/barber-apprenticeship/request-info', variant: 'secondary' },
      transcript: `The Barber Apprenticeship prepares participants for the ${credential} through ${duration} of structured training, including supervised on-the-job learning and Related Technical Instruction. The published wage range for this pathway is ${salary}, with actual earnings varying by employer, experience, schedule, and compensation structure.`,
    };
  }

  return normalized;
}

let normalizedData: Record<string, HeroBannerConfig> | null = null;

function getData(): Record<string, HeroBannerConfig> {
  if (normalizedData) return normalizedData;
  const raw = loadJsonOnce<Record<string, RawHeroBannerConfig>>('hero-banners.json');

  // Compute the video each page would effectively receive after the dedicated
  // registry takes precedence. A legacy JSON fallback is allowed only when its
  // final effective media key is unique across the complete page set. This also
  // catches collisions between a JSON fallback and another page's dedicated
  // registry assignment, not only JSON-to-JSON duplicates.
  const effectiveVideoCounts = new Map<string, number>();
  for (const [key, banner] of Object.entries(raw)) {
    const dedicated = getHeroVideoForPageKey(key);
    const candidate = dedicated?.video_url || banner.videoSrcDesktop || banner.videoSrcMobile;
    const candidateKey = mediaKey(candidate);
    if (candidateKey) {
      effectiveVideoCounts.set(candidateKey, (effectiveVideoCounts.get(candidateKey) ?? 0) + 1);
    }
  }

  normalizedData = Object.fromEntries(
    Object.entries(raw).map(([key, banner]) => {
      const dedicated = getHeroVideoForPageKey(key);
      const jsonCandidate = banner.videoSrcDesktop || banner.videoSrcMobile;
      const finalCandidate = dedicated?.video_url || jsonCandidate;
      const finalKey = mediaKey(finalCandidate);
      const allowJsonVideo = Boolean(dedicated) || !finalKey || (effectiveVideoCounts.get(finalKey) ?? 0) <= 1;
      return [key, normalizeBanner(key, banner, allowJsonVideo)];
    }),
  );
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
