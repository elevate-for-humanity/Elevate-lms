import { STATIC_PROGRAMS } from '@/data/programs/index';

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

export const PROGRAM_REGISTRY = STATIC_PROGRAMS;

/** 
 * Returns the registry filtered by category for dynamic navigation.
 */
export function getProgramsByCategory(category: string) {
  return PROGRAM_REGISTRY.filter(p => p.category === category || p.tags?.includes(category));
}

export function getProgramBySlug(slug: string) {
  return PROGRAM_REGISTRY.find(p => p.slug === slug);
}
