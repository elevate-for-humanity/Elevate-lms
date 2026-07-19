import { STATIC_PROGRAM_MAP } from '@/data/programs/index';
import type { ProgramSchema } from '@/lib/programs/program-schema';

/**
 * One Canonical Program Registry
 * 
 * This is the SINGLE SOURCE OF TRUTH for:
 * - Navigation menu
 * - Header dropdowns
 * - Search results
 * - Sitemap generation
 * - Checkout flows
 */

export const PROGRAM_REGISTRY = STATIC_PROGRAM_MAP;

/** Convert the registry Map to an array for filtering/finding */
function registryToArray(): ProgramSchema[] {
  return [...PROGRAM_REGISTRY.values()];
}

/** 
 * Returns the registry filtered by category for dynamic navigation.
 */
export function getProgramsByCategory(category: string) {
  return registryToArray().filter(p => p.category === category);
}

export function getProgramBySlug(slug: string) {
  return PROGRAM_REGISTRY.get(slug);
}
