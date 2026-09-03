/**
 * Program Data Loader — DB-only.
 *
 * All functions query the `programs` table via lib/lms/api.ts.
 * The static app/data/programs.ts fallback has been removed.
 */

import { getPrograms, getProgramBySlug as _getProgramBySlug } from '@/lib/lms/api';

export async function getAllPrograms() {
  return getPrograms();
}

export async function getProgramBySlug(slug: string) {
  return _getProgramBySlug(slug);
}

export async function getAllProgramSlugs(): Promise<string[]> {
  const programs = await getPrograms();
  return programs.map((p) => p.slug);
}

export async function getFeaturedPrograms(limit = 3) {
  const programs = await getPrograms();
  return programs.slice(0, limit);
}

export async function searchPrograms(query: string) {
  const programs = await getPrograms();
  const q = query.toLowerCase();
  return programs.filter(
    (p) =>
      (p.title ?? '').toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q),
  );
}
