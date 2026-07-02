/**
 * No archived programs - all programs are live.
 */
export const ARCHIVED_PROGRAM_SLUGS = new Set<string>([]);

export function isArchivedProgramSlug(_slug: string): boolean {
  return false;
}
