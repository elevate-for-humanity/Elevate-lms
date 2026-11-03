import archivedCardImages from './durable-card-images.json';
import { LEGACY_IMAGE_ALIASES } from '@/lib/media/legacy-image-aliases.mjs';

export const BLOG_IMAGE_FALLBACK = '/images/pages/social-media-1.webp';

// Published legacy posts still reference a retired directory. Resolve those
// exact sources to existing topic artwork without rewriting stored content.
const LEGACY_BLOG_IMAGES: Readonly<Record<string, string>> = LEGACY_IMAGE_ALIASES;

/** Published rows can use either the legacy image or featured_image field. */
export function getBlogImage(post: {
  image?: string | null;
  featured_image?: string | null;
}): string {
  const source = post.image?.trim() || post.featured_image?.trim() || BLOG_IMAGE_FALLBACK;
  return LEGACY_BLOG_IMAGES[source] || source;
}

const archivedThumbnails = new Map(Object.entries(archivedCardImages));

/** The archive links to print-size photos. Lists use smaller copies of the same images. */
export function getBlogCardImage(source: string): string {
  return archivedThumbnails.get(source) ?? source;
}
