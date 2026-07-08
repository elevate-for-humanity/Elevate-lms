import type { HeroBannerConfig } from '@/content/heroBanners';
import { getProgramCardImage, getProgramHeroImage } from '@/lib/images/programImages';
import { getProgramOgImage } from '@/lib/programs/og-images';
import { resolveSiteImagePath } from '@/lib/images/site-image-paths';

/** Default when no program-specific asset resolves. */
export const DEFAULT_HERO_FALLBACK = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/workforce-training.webp';

/** Default ambient hero video when banner JSON has no dedicated asset. */
export const DEFAULT_HERO_VIDEO =
  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/hero-home-fast.mp4';

const BANNER_POSTER_ALIASES: Record<string, string> = {
  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/training-provider-1.webp': 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/business/professional-2.jpg',
};

/**
 * Pick the best still image for a hero (banner poster → program hero → OG → default).
 */
export function resolveHeroPosterSrc(
  slug: string,
  options?: {
    banner?: HeroBannerConfig | null;
    heroImage?: string | null;
    dbImageUrl?: string | null;
  },
): string {
  const { banner, heroImage, dbImageUrl } = options ?? {};
  const candidates: string[] = [];

  if (banner?.posterImage) {
    candidates.push(BANNER_POSTER_ALIASES[banner.posterImage] ?? banner.posterImage);
  }
  if (heroImage) candidates.push(heroImage);
  if (dbImageUrl) candidates.push(dbImageUrl);
  candidates.push(getProgramHeroImage(slug), getProgramCardImage(slug), getProgramOgImage(slug));
  candidates.push(DEFAULT_HERO_FALLBACK);

  for (const raw of candidates) {
    const path = resolveSiteImagePath(raw.trim());
    if (path) return path;
  }
  return DEFAULT_HERO_FALLBACK;
}

export function hasHeroBannerContent(banner?: HeroBannerConfig | null): boolean {
  return Boolean(banner?.pageKey);
}
