/**
 * Unified static program registry — single normalized list for marketing,
 * search, navigation, and detail-page fallbacks.
 *
 * Source files are registered in data/programs/index.ts. Every public read is
 * passed through getStaticProgram(), which applies the current funding and
 * RAPIDS claim policy before a ProgramSchema leaves the registry.
 */

import type { ProgramSchema } from '@/lib/programs/program-schema';
import { STATIC_PROGRAM_MAP, getStaticProgram } from '@/data/programs/index';

function buildAllPrograms(): ProgramSchema[] {
  const bySlug = new Map<string, ProgramSchema>();
  for (const raw of STATIC_PROGRAM_MAP.values()) {
    const normalized = getStaticProgram(raw.slug);
    if (normalized) bySlug.set(normalized.slug, normalized);
  }
  return [...bySlug.values()].sort((a, b) => a.title.localeCompare(b.title));
}

/** All static programs, normalized and deduped by canonical slug. */
export const ALL_PROGRAMS: ProgramSchema[] = buildAllPrograms();

export { getStaticProgram };

export function getProgramBySlug(slug: string): ProgramSchema | undefined {
  return getStaticProgram(slug) ?? ALL_PROGRAMS.find((program) => program.slug === slug);
}

export function getProgramsBySector(sector: string): ProgramSchema[] {
  return ALL_PROGRAMS.filter((program) => program.sector === sector);
}

export const SECTORS = [
  {
    key: 'skilled-trades',
    label: 'Skilled Trades',
    description: 'Hands-on technical training for skilled-trade occupations.',
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    description: 'Healthcare training with program-specific credential and clinical requirements.',
  },
  {
    key: 'personal-services',
    label: 'Personal Services',
    description: 'Barbering, beauty, and personal-service training pathways.',
  },
  {
    key: 'technology',
    label: 'Technology',
    description: 'IT support, cybersecurity, networking, and software-development training.',
  },
  {
    key: 'business',
    label: 'Business & Office',
    description: 'Office administration, bookkeeping, entrepreneurship, and business training.',
  },
] as const;
