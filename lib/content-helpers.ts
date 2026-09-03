/**
 * Find an item by slug from any content array.
 * Returns undefined if not found — callers should handle with notFound().
 */
export function findBySlug<T extends { slug: string }>(items: T[], slug: string): T | undefined {
  return items.find((item) => item.slug === slug);
}

/**
 * Build generateStaticParams output from a content array.
 */
export function staticParamsFromSlugs<T extends { slug: string }>(
  items: T[],
): Array<{ slug: string }> {
  return items.map((item) => ({ slug: item.slug }));
}
