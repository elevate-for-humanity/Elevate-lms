/**
 * Retired public program slugs — excluded from catalog/listings and return 404 on detail pages.
 * Do not add redirects; update inbound links to a live program instead.
 */
export const ARCHIVED_PROGRAM_SLUGS = new Set([
  'tax-preparation',
  'tax-prep',
  'tax-preparation-financial',
  'tax-preparation-vita',
]);

export function isArchivedProgramSlug(slug: string): boolean {
  return ARCHIVED_PROGRAM_SLUGS.has(slug.toLowerCase().trim());
}
