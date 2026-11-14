/**
 * Elevate for Humanity — canonical image dimensions (SSOT).
 *
 * Use for AI art generation, asset export, next/image `sizes`, and layout tokens.
 * Display containers live in `lib/page-design-tokens.ts` (must match aspect ratios here).
 *
 * Three production tiers (WebP):
 * - Heroes: source 2560×1440, display ~1920×1080, ≤300 KB
 * - Program/course: 1600×900, ≤200 KB
 * - Cards/thumbnails: 1200×900, ≤100 KB
 */

export type PixelSize = { width: number; height: number };

/** OpenAI DALL·E 3 sizes closest to our aspect targets */
export const DALLE3_SIZE = {
  landscape: '1792x1024',
  square: '1024x1024',
  portrait: '1024x1792',
} as const;

export const MEDIA_FORMAT = 'webp' as const;

// ─── Tier budgets (KB) ───────────────────────────────────────────────────────

export const MEDIA_BUDGET_KB = {
  hero: 300,
  programCourse: 200,
  cardThumbnail: 100,
} as const;

// ─── Canonical program asset set (38+ programs) ─────────────────────────────

/** Source file for hero banners — displayed ~1920×1080 via next/image */
export const PROGRAM_HERO_SOURCE: PixelSize = { width: 2560, height: 1440 };

/** Program grid cards — 4:3 */
export const PROGRAM_CARD: PixelSize = { width: 1200, height: 900 };

/** Course cover art — 16:9 */
export const COURSE_COVER: PixelSize = { width: 1600, height: 900 };

/** Authenticated dashboard hero strip */
export const DASHBOARD_BANNER: PixelSize = { width: 1920, height: 600 };

// ─── Full site matrix ────────────────────────────────────────────────────────

export const MEDIA_SLOTS = {
  homepageHero: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 1080, height: 1350 },
    source: { width: 2560, height: 1440 },
    aspectDesktop: '16/9',
    aspectMobile: '4/5',
    maxKb: MEDIA_BUDGET_KB.hero,
    format: MEDIA_FORMAT,
    nextImageSizes: '100vw',
  },
  programPageHero: {
    desktop: { width: 2560, height: 1440 },
    mobile: { width: 1080, height: 1350 },
    source: { width: 2560, height: 1440 },
    aspectDesktop: '16/9',
    aspectMobile: '4/5',
    maxKb: MEDIA_BUDGET_KB.hero,
    format: MEDIA_FORMAT,
    nextImageSizes: '100vw',
  },
  dashboardHero: {
    desktop: DASHBOARD_BANNER,
    mobile: { width: 1080, height: 1080 },
    aspectDesktop: '16/5', // 3.2:1
    aspectMobile: '1/1',
    maxKb: MEDIA_BUDGET_KB.hero,
    format: MEDIA_FORMAT,
    nextImageSizes: '100vw',
  },
  categoryLanding: {
    desktop: { width: 1600, height: 900 },
    mobile: { width: 1080, height: 1350 },
    aspectDesktop: '16/9',
    aspectMobile: '4/5',
    maxKb: MEDIA_BUDGET_KB.programCourse,
    format: MEDIA_FORMAT,
    nextImageSizes: '100vw',
  },
  ctaBanner: {
    desktop: { width: 1600, height: 600 },
    mobile: { width: 1080, height: 1080 },
    aspectDesktop: '8/3',
    aspectMobile: '1/1',
    maxKb: MEDIA_BUDGET_KB.programCourse,
    format: MEDIA_FORMAT,
    nextImageSizes: '100vw',
  },
  featureCard: {
    desktop: { width: 800, height: 600 },
    mobile: { width: 800, height: 600 },
    aspect: '4/3',
    maxKb: MEDIA_BUDGET_KB.cardThumbnail,
    format: MEDIA_FORMAT,
    nextImageSizes: '(max-width: 1024px) 100vw, 400px',
  },
  programCard: {
    desktop: PROGRAM_CARD,
    mobile: PROGRAM_CARD,
    aspect: '4/3',
    maxKb: MEDIA_BUDGET_KB.cardThumbnail,
    format: MEDIA_FORMAT,
    nextImageSizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
  },
  instructorCard: {
    desktop: { width: 1200, height: 1200 },
    mobile: { width: 1200, height: 1200 },
    aspect: '1/1',
    maxKb: MEDIA_BUDGET_KB.cardThumbnail,
    format: MEDIA_FORMAT,
    nextImageSizes: '(max-width: 640px) 50vw, 300px',
  },
  testimonialCard: {
    desktop: { width: 1200, height: 1200 },
    mobile: { width: 1200, height: 1200 },
    aspect: '1/1',
    maxKb: MEDIA_BUDGET_KB.cardThumbnail,
    format: MEDIA_FORMAT,
    nextImageSizes: '(max-width: 640px) 50vw, 300px',
  },
  blogFeatured: {
    desktop: { width: 1600, height: 900 },
    mobile: { width: 1600, height: 900 },
    aspect: '16/9',
    maxKb: MEDIA_BUDGET_KB.programCourse,
    format: MEDIA_FORMAT,
    nextImageSizes: '(max-width: 1024px) 100vw, 800px',
  },
  courseCover: {
    desktop: COURSE_COVER,
    mobile: COURSE_COVER,
    aspect: '16/9',
    maxKb: MEDIA_BUDGET_KB.programCourse,
    format: MEDIA_FORMAT,
    nextImageSizes: '(max-width: 1024px) 100vw, 640px',
  },
  workbookCover: {
    desktop: { width: 2550, height: 3300 },
    mobile: { width: 2550, height: 3300 },
    aspect: '2550/3300',
    maxKb: 500,
    format: MEDIA_FORMAT,
    nextImageSizes: '400px',
  },
  lmsCourseThumbnail: {
    desktop: { width: 1280, height: 720 },
    mobile: { width: 1280, height: 720 },
    aspect: '16/9',
    maxKb: MEDIA_BUDGET_KB.cardThumbnail,
    format: MEDIA_FORMAT,
    nextImageSizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px',
  },
  certificateBackground: {
    desktop: { width: 3300, height: 2550 },
    mobile: { width: 3300, height: 2550 },
    aspect: '3300/2550',
    maxKb: 800,
    format: MEDIA_FORMAT,
    nextImageSizes: '1200px',
  },
  socialPost: {
    desktop: { width: 1080, height: 1080 },
    mobile: { width: 1080, height: 1080 },
    aspect: '1/1',
    maxKb: MEDIA_BUDGET_KB.cardThumbnail,
    format: MEDIA_FORMAT,
    nextImageSizes: '600px',
  },
  facebookCover: {
    desktop: { width: 1640, height: 924 },
    mobile: { width: 1640, height: 924 },
    aspect: '1640/924',
    maxKb: MEDIA_BUDGET_KB.programCourse,
    format: MEDIA_FORMAT,
    nextImageSizes: '1200px',
  },
  linkedInBanner: {
    desktop: { width: 1584, height: 396 },
    mobile: { width: 1584, height: 396 },
    aspect: '4/1',
    maxKb: MEDIA_BUDGET_KB.programCourse,
    format: MEDIA_FORMAT,
    nextImageSizes: '1200px',
  },
} as const;

/** Shorthand next/image `sizes` strings — import instead of hardcoding */
export const IMAGE_SIZES = {
  hero: MEDIA_SLOTS.homepageHero.nextImageSizes,
  programCard: MEDIA_SLOTS.programCard.nextImageSizes,
  featureCard: MEDIA_SLOTS.featureCard.nextImageSizes,
  courseCover: MEDIA_SLOTS.courseCover.nextImageSizes,
  lmsThumbnail: MEDIA_SLOTS.lmsCourseThumbnail.nextImageSizes,
  blogFeatured: MEDIA_SLOTS.blogFeatured.nextImageSizes,
  avatar: MEDIA_SLOTS.instructorCard.nextImageSizes,
} as const;

/** Pick closest DALL·E size for a target pixel box */
export function closestDalle3Size(target: PixelSize): (typeof DALLE3_SIZE)[keyof typeof DALLE3_SIZE] {
  const ratio = target.width / target.height;
  // 4:3 (1.33) and wider → landscape; tall mobile heroes → portrait
  if (ratio > 1.15) return DALLE3_SIZE.landscape;
  if (ratio < 0.85) return DALLE3_SIZE.portrait;
  return DALLE3_SIZE.square;
}
