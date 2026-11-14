/**
 * URL helpers for pathway-to-apply flow
 */

export function applyUrlForPathway(slug: string): string {
  return `/apply?pathway=${encodeURIComponent(slug)}`;
}

export function applyUrlWithSource(slug: string, source: string): string {
  return `/apply?pathway=${encodeURIComponent(slug)}&ref=${encodeURIComponent(source)}`;
}
