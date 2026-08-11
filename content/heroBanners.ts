/**
 * Canonical marketing hero registry.
 *
 * Copy/configuration is loaded from public/data/hero-banners.json. Video media
 * is resolved through lib/video/registry so pages cannot silently reuse the
 * same generic hero film. Raw banner videos are accepted only when the URL is
 * unique across the banner dataset; otherwise the page receives a relevant
 * picture fallback.
 */

import { loadJsonOnce } from '@/lib/data/json-cache';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { PROGRAM_IMAGES, getProgramHeroImage } from '@/lib/images/programImages';
import { getHeroVideoForPageKey, getVideoCacheUrl } from '@/lib/video/registry';

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
  about: '/images/pages/about-hero.webp',
  platform: '/images/hero/admin-hero.webp',
  'funding-how-it-works': '/images/pages/about-funding-nav.webp',
  healthcare: '/images/pages/healthcare-hero.webp',
  programs: '/images/hero/hero-hands-on-training.webp',
  'building-services-technician': '/images/building-maintenance.webp',
  'federal-funded': '/images/heroes/hero-federal-funding.webp',
  'micro-programs': '/images/micro-classes-hero.webp',
  'skilled-trades': '/images/hero/hero-skilled-trades.webp',
  'home-health-aide': '/images/healthcare/hero-program-patient-care.webp',
  learner: '/images/pages/training-classroom.webp',
  mission: '/images/pages/about-hero.webp',
  partners: '/images/pages/business-meeting.webp',
  training: '/images/pages/workforce-training.webp',
  jri: '/images/pages/admin-wioa-hero.webp',
  'about-team': '/images/pages/business-meeting.webp',
  'about-partners': '/images/pages/admin-campaigns-hero.webp',
  blog: '/images/pages/admin-videos-hero.webp',
  'career-services': '/images/pages/training-classroom.webp',
  careers: '/images/pages/workforce-training.webp',
  contact: '/images/pages/about-supportive-services.webp',
  funding: '/images/pages/admin-wioa-hero.webp',
  pricing: '/images/heroes/lms-analytics.webp',
  'program-holder': '/images/pages/business-meeting.webp',
  'student-support': '/images/pages/about-supportive-services.webp',
  employer: '/images/pages/business-meeting.webp',
  'for-employers': '/images/pages/admin-campaigns-hero.webp',
  'for-students': '/images/pages/training-classroom.webp',
  'workforce-partners': '/images/pages/business-meeting.webp',
  'apprenticeship-sponsor': '/images/pages/apprenticeship-structure.webp',
};

/**
 * Last-resort picture selection for banners that only had a duplicated generic
 * video. These are intentionally topical rather than one universal fallback so
 * the page still looks like its subject when the video is removed.
 */
function topicalPictureForKey(key: string): string {
  const value = key.toLowerCase();

  if (/barber|cosmet|esthetic|nail|salon|beauty/.test(value)) {
    return '/images/pages/barber-apprenticeship-hero.jpg';
  }
  if (/cna|medical|health|phleb|pharm|patient|cpr|emt|dental|dsp|recovery|peer|care/.test(value)) {
    return '/images/pages/healthcare-hero.webp';
  }
  if (/hvac|electr|weld|plumb|construction|building|forklift|solar|manufactur|trade/.test(value)) {
    return '/images/hero/hero-skilled-trades.webp';
  }
  if (/cyber|technology|tech|software|web|network|it-|digital|ai-/.test(value)) {
    return '/images/pages/programs-it-hero.webp';
  }
  if (/business|bookkeep|tax|administrat|entrepreneur|finance|office|project|insurance/.test(value)) {
    return '/images/business/team-4.webp';
  }
  if (/hospital|guest|servsafe|food|culinary/.test(value)) {
    return '/images/pages/comp-layout-hero.webp';
  }
  if (/fund|wioa|grant|financial|workforce|partner|employer|agency|provider/.test(value)) {
    return '/images/pages/admin-wioa-hero.webp';
  }
  if (/student|learner|career|training|course|credential|certif|pathway|enroll|support/.test(value)) {
    return '/images/pages/training-classroom.webp';
  }
  if (/about|mission|founder|impact|team|community|volunteer|donate/.test(value)) {
    return '/images/pages/about-hero.webp';
  }
  if (/news|press|blog|event|media/.test(value)) {
    return '/images/pages/admin-campaigns-hero.webp';
  }
  return '/images/pages/workforce-training.webp';
}

function mediaKey(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, 'https://elevate.local');
    return `${url.hostname.toLowerCase()}${url.pathname.toLowerCase()}`;
  } catch {
    return value.split('?')[0].split('#')[0].trim().toLowerCase() || undefined;
  }
}

function buildRawVideoUseCounts(raw: Record<string, RawHeroBannerConfig>) {
  const counts = new Map<string, number>();
  for (const banner of Object.values(raw)) {
    const pageKeys = new Set(
      [banner.videoSrcDesktop, banner.videoSrcMobile]
        .map(mediaKey)
        .filter((value): value is string => Boolean(value)),
    );
    for (const key of pageKeys) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function pictureFor(key: string, banner: RawHeroBannerConfig): string {
  if (PROGRAM_IMAGES[key]) return getProgramHeroImage(key);
  return PAGE_PICTURE_OVERRIDES[key] ?? banner.posterImage ?? topicalPictureForKey(key);
}

function normalizeMedia(
  key: string,
  banner: RawHeroBannerConfig,
  normalized: HeroBannerConfig,
  rawVideoUseCounts: Map<string, number>,
): HeroBannerConfig {
  const registryVideo = getHeroVideoForPageKey(key);
  const picture = pictureFor(key, banner);

  if (registryVideo) {
    const src = getVideoCacheUrl(registryVideo);
    return {
      ...normalized,
      videoSrcDesktop: src,
      videoSrcMobile: src,
      posterImage: picture || registryVideo.thumbnail_url,
    };
  }

  const desktop = banner.videoSrcDesktop;
  const mobile = banner.videoSrcMobile;
  const desktopKey = mediaKey(desktop);
  const mobileKey = mediaKey(mobile);
  const desktopUnique = Boolean(desktop && desktopKey && rawVideoUseCounts.get(desktopKey) === 1);
  const mobileUnique = Boolean(mobile && mobileKey && rawVideoUseCounts.get(mobileKey) === 1);

  if (desktopUnique) {
    return {
      ...normalized,
      videoSrcDesktop: desktop,
      videoSrcMobile: mobileUnique ? mobile : desktop,
      posterImage: picture,
    };
  }

  if (!desktop && mobileUnique) {
    return {
      ...normalized,
      videoSrcDesktop: mobile,
      videoSrcMobile: mobile,
      posterImage: picture,
    };
  }

  return {
    ...normalized,
    videoSrcDesktop: undefined,
    videoSrcMobile: undefined,
    posterImage: picture,
  };
}

let normalizedData: Record<string, HeroBannerConfig> | null = null;

function normalizeBanner(
  key: string,
  banner: RawHeroBannerConfig,
  rawVideoUseCounts: Map<string, number>,
): HeroBannerConfig {
  const primaryCta = banner.primaryCta ?? banner.ctaPrimary ?? {
    label: 'View Programs',
    href: '/programs',
  };
  const secondaryCta = banner.secondaryCta ?? banner.ctaSecondary;

  let normalized: HeroBannerConfig = {
    ...banner,
    pageKey: banner.pageKey ?? key,
    belowHeroHeadline: banner.belowHeroHeadline ?? banner.headline ?? '',
    belowHeroSubheadline: banner.belowHeroSubheadline ?? banner.subheadline ?? '',
    primaryCta,
    secondaryCta,
    analyticsName: banner.analyticsName ?? key,
  };

  normalized = normalizeMedia(key, banner, normalized, rawVideoUseCounts);

  if (key === 'home') {
    return {
      ...normalized,
      voiceoverSrc: '/audio/heroes/home.mp3',
      microLabel: 'The AI-Powered Workforce Operating System',
      belowHeroHeadline:
        'Career Training, Registered Apprenticeships & Workforce Technology in Indiana',
      belowHeroSubheadline:
        'DOL-registered apprenticeship sponsor and WIOA-approved training provider serving learners, employers, and workforce agencies in Indianapolis and across Indiana. Funded training in healthcare, skilled trades, CDL, and technology often at no cost for eligible participants.',
      primaryCta: { label: 'Get Started', href: '/apply' },
      secondaryCta: {
        label: 'For Employers & Agencies',
        href: '/partners',
        variant: 'secondary',
      },
      trustIndicators: [
        'AI-Driven Career Navigation',
        'Automated Compliance Tracking',
        'Blockchain-Verified Credentials',
      ],
      transcript:
        'Elevate for Humanity is an AI-powered workforce operating system — not just a training provider. We automate the journey from recruitment to employment. Our platform supports credentialing, compliance tracking, employer placement, and apprenticeship coordination through one connected ecosystem.',
      posterImage: '/images/heroes/hero-homepage.webp',
      eyebrow: 'Career Training & Workforce Development',
      analyticsName: 'home',
    };
  }

  if (key === 'barber-apprenticeship') {
    const barber = RAPIDS_CONFIG.programs.barber;
    return {
      ...normalized,
      microLabel: 'DOL Registered Apprenticeship',
      belowHeroHeadline: 'Earn your Indiana Barber License through registered apprenticeship.',
      belowHeroSubheadline: `Complete ${barber.totalHours.toLocaleString('en-US')} hours of supervised on-the-job learning plus ${barber.relatedInstructionHours} hours of Related Technical Instruction under the registered program standards.`,
      primaryCta: {
        label: 'Enroll Now',
        href: '/programs/barber-apprenticeship/apply',
      },
      secondaryCta: {
        label: 'Request Information',
        href: '/programs/barber-apprenticeship/request-info',
        variant: 'secondary',
      },
      transcript: `The Barber Apprenticeship combines ${barber.totalHours.toLocaleString('en-US')} hours of supervised on-the-job learning with ${barber.relatedInstructionHours} hours of Related Technical Instruction. Apprentices complete documented workplace training and licensing preparation for the Indiana Barber License. The published salary range is $28,000 to $52,000.`,
    };
  }

  return normalized;
}

function getData(): Record<string, HeroBannerConfig> {
  if (normalizedData) return normalizedData;

  const raw = loadJsonOnce<Record<string, RawHeroBannerConfig>>('hero-banners.json');
  const rawVideoUseCounts = buildRawVideoUseCounts(raw);
  normalizedData = Object.fromEntries(
    Object.entries(raw).map(([key, banner]) => [
      key,
      normalizeBanner(key, banner, rawVideoUseCounts),
    ]),
  );
  return normalizedData;
}

const heroBanners: Record<string, HeroBannerConfig> = new Proxy(
  {} as Record<string, HeroBannerConfig>,
  {
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
  },
);

export default heroBanners;

export const internalProgramHeroBanners: Record<string, ProgramHeroBannerConfig> = new Proxy(
  {} as Record<string, ProgramHeroBannerConfig>,
  {
    get(_target, key: string) {
      const entry = getData()[key] as ProgramHeroBannerConfig | undefined;
      return entry?.credentialLabel ? entry : undefined;
    },
    ownKeys() {
      return Object.keys(getData()).filter(
        (key) => Boolean((getData()[key] as ProgramHeroBannerConfig | undefined)?.credentialLabel),
      );
    },
    has(_target, key: string) {
      return Boolean((getData()[key] as ProgramHeroBannerConfig | undefined)?.credentialLabel);
    },
    getOwnPropertyDescriptor(_target, key: string) {
      const entry = getData()[key] as ProgramHeroBannerConfig | undefined;
      if (entry?.credentialLabel) {
        return { configurable: true, enumerable: true, value: entry };
      }
      return undefined;
    },
  },
);
