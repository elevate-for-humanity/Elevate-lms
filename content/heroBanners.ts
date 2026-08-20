/**
 * Canonical marketing hero configuration.
 *
 * JSON owns copy and non-dedicated media. Dedicated hero media is owned by the
 * video registry and always wins so stale JSON cannot duplicate the homepage
 * film across unrelated pages. Posters are explicit and semantic; no heuristic
 * image substitution is allowed.
 *
 * IMPORTANT: legacy hero JSON is untrusted marketing copy. Every public string
 * passes through the claim sanitizer below before it can render. This prevents a
 * stale data file from bypassing the program-level funding registry or restoring
 * unsupported wage, placement, credential, compliance, or automatic-approval
 * claims after a page has been corrected.
 */

import { loadJsonOnce } from '@/lib/data/json-cache';
import { PROGRAMS } from '@/lib/programs/canonical-data';
import { PROGRAM_IMAGES, getProgramHeroImage } from '@/lib/images/programImages';
import { getHeroVideoForPageKey } from '@/lib/video/registry';
import {
  sanitizePublicFundingList,
  sanitizePublicFundingText,
} from '@/lib/programs/public-funding-copy';

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

const SHARED_GENERIC_VIDEO_FILES = new Set([
  'hero-home-fast.mp4',
  'programs-overview-video-with-narration.mp4',
  'cna-hero.mp4',
  'hvac-hero-final.mp4',
  'it-technology.mp4',
]);

const UNSUPPORTED_HERO_SENTENCE =
  /(?:\b(?:every|all)\s+(?:program|student|graduate)|\bmost\s+(?:programs?|students?)|\bjob offers?\b|\bjob placement rate\b|\bstarting (?:pay|wages?|salary)\b|\bcommonly earn\b|\bguaranteed employment\b|\bcredential(?:s)? (?:is|are) issued automatically\b|\bcertification is issued automatically\b|\bchecks? eligibility automatically\b|\bWIOA\s*&\s*DOL compliant\b|\b100% compliant\b|\bstate-approved curricula\b|\bclinical rotations included\b|\blaunch in (?:two|2) weeks\b|\bno paper\b|\breports? generate themselves\b|\bWOTC documentation is generated automatically\b)/i;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function sanitizeHeroText(text: string | undefined, key: string, fallback = ''): string {
  if (!text?.trim()) return fallback;
  const fundingSafe = sanitizePublicFundingText(text, key, fallback);
  if (!fundingSafe) return fallback;
  const safe = splitSentences(fundingSafe).filter(
    (sentence) => !UNSUPPORTED_HERO_SENTENCE.test(sentence),
  );
  return safe.join(' ').trim() || fallback;
}

function sanitizeHeroTrustIndicators(values: string[] | undefined, key: string): string[] {
  return sanitizePublicFundingList(values, key)
    .map((value) => sanitizeHeroText(value, key))
    .filter(Boolean);
}

function isSharedGenericVideo(src?: string): boolean {
  if (!src) return false;
  const pathname = src.split('?')[0]?.split('#')[0] ?? '';
  const filename = pathname.split('/').pop()?.toLowerCase() ?? '';
  return SHARED_GENERIC_VIDEO_FILES.has(filename);
}

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

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function semanticInlinePoster(key: string, banner: RawHeroBannerConfig): string {
  const fallbackTitle = key
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const title = sanitizeHeroText(
    banner.belowHeroHeadline ?? banner.headline ?? banner.microLabel ?? fallbackTitle,
    key,
    fallbackTitle,
  );
  const label = sanitizeHeroText(banner.microLabel ?? 'Elevate for Humanity', key, 'Elevate for Humanity');
  const compactTitle = title.length > 72 ? `${title.slice(0, 69).trim()}...` : title;
  const compactLabel = label.length > 40 ? `${label.slice(0, 37).trim()}...` : label;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${escapeSvgText(compactTitle)}"><rect width="1600" height="900" fill="#eef4fb"/><rect x="0" y="0" width="18" height="900" fill="#b91c1c"/><rect x="72" y="250" width="1456" height="400" rx="30" fill="#ffffff"/><text x="112" y="360" fill="#1d4f7a" font-family="Arial,Helvetica,sans-serif" font-size="42" font-weight="700" letter-spacing="2">${escapeSvgText(compactLabel.toUpperCase())}</text><text x="112" y="470" fill="#0f172a" font-family="Arial,Helvetica,sans-serif" font-size="64" font-weight="800">${escapeSvgText(compactTitle)}</text><circle cx="800" cy="590" r="54" fill="#b91c1c"/><polygon points="784,560 784,620 832,590" fill="#ffffff"/><text x="112" y="790" fill="#475569" font-family="Arial,Helvetica,sans-serif" font-size="30">Elevate for Humanity · ${escapeSvgText(key)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function posterFor(key: string, banner: RawHeroBannerConfig): string {
  const dedicated = getHeroVideoForPageKey(key);
  if (dedicated?.thumbnail_url) return dedicated.thumbnail_url;
  if (banner.posterImage) return banner.posterImage;
  if (PROGRAM_IMAGES[key]) return getProgramHeroImage(key);
  if (PAGE_PICTURE_OVERRIDES[key]) return PAGE_PICTURE_OVERRIDES[key];
  return semanticInlinePoster(key, banner);
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

  const rawHeadline = banner.belowHeroHeadline ?? banner.headline ?? '';
  const rawSubheadline = banner.belowHeroSubheadline ?? banner.subheadline ?? '';

  let normalized: HeroBannerConfig = {
    ...banner,
    pageKey: banner.pageKey ?? key,
    videoSrcDesktop: desktop,
    videoSrcMobile: mobile,
    posterImage: posterFor(key, banner),
    microLabel: sanitizeHeroText(banner.microLabel, key),
    eyebrow: sanitizeHeroText(banner.eyebrow, key),
    belowHeroHeadline: sanitizeHeroText(rawHeadline, key, rawHeadline),
    belowHeroSubheadline: sanitizeHeroText(
      rawSubheadline,
      key,
      'Review the current program requirements, cost, credential pathway, and any applicable funding process before enrollment.',
    ),
    primaryCta: banner.primaryCta ?? banner.ctaPrimary ?? { label: 'View Programs', href: '/programs' },
    secondaryCta: banner.secondaryCta ?? banner.ctaSecondary,
    trustIndicators: sanitizeHeroTrustIndicators(banner.trustIndicators, key),
    transcript: sanitizeHeroText(
      banner.transcript,
      key,
      'Review the current program record and disclosures for controlling requirements and outcomes.',
    ),
    analyticsName: banner.analyticsName ?? key,
  };

  // Marketing-only salary labels are not authoritative outcomes. Program pages
  // may present cited labor-market information separately; the generic hero layer
  // must not publish a wage promise from legacy JSON.
  if ('salaryRangeLabel' in normalized) {
    delete (normalized as HeroBannerConfig & { salaryRangeLabel?: string }).salaryRangeLabel;
  }

  const picture = normalized.posterImage;
  const desktopShared = !dedicated && isSharedGenericVideo(normalized.videoSrcDesktop);
  if (desktopShared && picture) {
    normalized = {
      ...normalized,
      videoSrcDesktop: undefined,
      videoSrcMobile: undefined,
    };
  }

  if (key === 'store' && !dedicated) {
    normalized = {
      ...normalized,
      videoSrcDesktop: undefined,
      videoSrcMobile: undefined,
      posterImage: posterFor(key, banner),
    };
  }

  if (key === 'home') {
    normalized = {
      ...normalized,
      posterImage: posterFor(key, banner),
      voiceoverSrc: '/audio/heroes/home.mp3',
      microLabel: 'Workforce Training & Technology',
      eyebrow: 'Career Training & Workforce Development',
      belowHeroHeadline: 'Career Training, Registered Apprenticeships & Workforce Technology in Indiana',
      belowHeroSubheadline:
        'Explore program-specific training, registered-apprenticeship activity, employer services, and workforce-funding pathways. Funding and participant eligibility require the responsible agency\'s authorization.',
      primaryCta: { label: 'Get Started', href: '/apply' },
      secondaryCta: { label: 'For Employers & Agencies', href: '/partners', variant: 'secondary' },
      trustIndicators: [
        'Program-Specific Funding Records',
        'Documented Apprenticeship Standards',
        'Credential Verification Workflows',
      ],
      transcript:
        'Elevate for Humanity connects career training, documented apprenticeship activity, credential workflows, employer services, and workforce operations through one platform. Program, funding, credential, and outcome claims remain subject to their controlling records and responsible authorities.',
      analyticsName: 'home',
    };
  }

  if (key === 'barber-apprenticeship') {
    const barber = PROGRAMS['barber-apprenticeship'];
    const programBanner = normalized as ProgramHeroBannerConfig;
    const credential = programBanner.credentialLabel || barber.credential || 'Indiana Barber License';
    const duration = programBanner.durationLabel || barber.durationRange;
    normalized = {
      ...normalized,
      microLabel: 'DOL Registered Apprenticeship',
      belowHeroHeadline: 'Indiana Barber registered-apprenticeship pathway.',
      belowHeroSubheadline: `Complete the approved competency-based registered-apprenticeship standard, including ${barber.relatedInstructionHours} verified Related Technical Instruction hours. Indiana licensing requirements and approval are controlled separately by the applicable state authority.`,
      primaryCta: { label: 'Enroll Now', href: '/programs/barber-apprenticeship/apply' },
      secondaryCta: { label: 'Request Information', href: '/programs/barber-apprenticeship/request-info', variant: 'secondary' },
      transcript: `The Barber Apprenticeship provides structured competency-based training and verified Related Technical Instruction toward the ${credential} pathway. Published duration is ${duration.toLowerCase()}; licensing and employment outcomes are not guaranteed by program completion.`,
    };
  }

  return normalized;
}

let normalizedData: Record<string, HeroBannerConfig> | null = null;

function getData(): Record<string, HeroBannerConfig> {
  if (normalizedData) return normalizedData;
  const raw = loadJsonOnce<Record<string, RawHeroBannerConfig>>('hero-banners.json');

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
