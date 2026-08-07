/**
 * lib/site-stats.ts
 *
 * Single source of truth for public-facing marketing statistics.
 *
 * IMPORTANT:
 * - Do not publish estimated or aspirational student outcomes.
 * - Do not publish placement, completion, salary, employer-count, or funding
 *   totals unless they are backed by production data and an approved reporting
 *   methodology.
 * - Program count may be derived from the active public catalog.
 */

import { STATIC_PROGRAM_MAP } from '@/data/programs/index';

const STATIC_PROGRAM_COUNT = STATIC_PROGRAM_MAP.size;

export const SITE_STATS = {
  programsOffered: STATIC_PROGRAM_COUNT,
  programsOfferedDisplay: `${STATIC_PROGRAM_COUNT}+`,

  // New-site posture: outcome totals remain intentionally unpublished until
  // verified production reporting exists. Zero is a sentinel for components
  // that require a numeric type; public renderers should display an em dash or
  // capability language when a value is <= 0.
  studentsDisplay: '—',
  credentialsDisplay: '—',
  employerPartnersDisplay: '—',
  fundingSecuredDisplay: '—',
  careerServicesSupportRate: 0,
  jobPlacementRate: null as number | null,
} as const;

export const statLabel = {
  students: SITE_STATS.studentsDisplay,
  placement: 'Career support available',
  programs: SITE_STATS.programsOfferedDisplay,
  credentials: SITE_STATS.credentialsDisplay,
  employers: SITE_STATS.employerPartnersDisplay,
  funding: SITE_STATS.fundingSecuredDisplay,
} as const;

/**
 * Format programs display for careers page.
 */
export function formatProgramsDisplay(programs: Array<{ title: string }>): string {
  if (!programs || programs.length === 0) return 'various programs';
  const names = programs.map((p) => p.title);
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
