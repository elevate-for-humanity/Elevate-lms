const BLOG_IMAGE_FALLBACK = '/images/pages/social-media-1.webp';

// Published legacy posts still reference a retired directory. Resolve those
// exact sources to existing topic artwork without rewriting stored content.
const LEGACY_BLOG_IMAGES: Record<string, string> = {
  '/images/heroes-hq/jri-hero.jpg': '/hero-images/jri-hero.webp',
  '/images/heroes-hq/employer-hero.jpg': '/hero-images/employer-hero.webp',
  '/images/heroes-hq/success-hero.jpg': '/images/pages/success-stories-hero.webp',
  '/images/heroes-hq/programs-hero.jpg': '/images/pages/programs-hero.webp',
  '/images/heroes-hq/funding-hero.jpg': '/hero-images/wioa-hero.webp',
};

/** Published rows can use either the legacy image or featured_image field. */
export function getBlogImage(post: {
  image?: string | null;
  featured_image?: string | null;
}): string {
  const source = post.image?.trim() || post.featured_image?.trim() || BLOG_IMAGE_FALLBACK;
  return LEGACY_BLOG_IMAGES[source] || source;
}
