/**
 * Dynamic loader for program data
 * Enables code splitting for large program data
 */

import type { Program } from './programs';

// Cache for loaded programs
let programsCache: Program[] | null = null;

/**
 * Load programs dynamically with caching
 */
export async function loadPrograms(): Promise<Program[]> {
  if (programsCache) {
    return programsCache;
  }

  const { programs } = await import('./programs');
  programsCache = programs;
  return programs;
}

/**
 * Load a single program by slug
 */
export async function loadProgramBySlug(slug: string): Promise<Program | undefined> {
  const programs = await loadPrograms();
  return programs.find((p) => p.slug === slug);
}

/**
 * Clear cache (useful for testing)
 */
export function clearProgramsCache() {
  programsCache = null;
}
