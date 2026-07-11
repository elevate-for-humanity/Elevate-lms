/**
 * lib/site-stats.ts
 *
 * Single source of truth for public-facing marketing statistics.
 * Align counts with lib/programs/public-program-list.ts (DB or static catalog).
 * Do not claim guaranteed job placement — use placement-support language.
 */

import { STATIC_PROGRAM_MAP } from '@/data/programs/index';

const STATIC_PROGRAM_COUNT = STATIC_PROGRAM_MAP.size;

export const SITE_STATS = {
  studentsDisplay: 'Many',
  careerServicesSupportRate: 94,
  programsOffered: STATIC_PROGRAM_COUNT,
  programsOfferedDisplay: `${STATIC_PROGRAM_COUNT}+`,
  statesServed: 5,
  credentialsDisplay: '—',
  employerPartnersDisplay: '—',
  fundingSecuredDisplay: '—',
  /** @deprecated Use careerServicesSupportRate */
  jobPlacementRate: 94,
} as const;

export const statLabel = {
  students: SITE_STATS.studentsDisplay,
  placement: `${SITE_STATS.careerServicesSupportRate}%`,
  programs: SITE_STATS.programsOfferedDisplay,
  credentials: SITE_STATS.credentialsDisplay,
  employers: SITE_STATS.employerPartnersDisplay,
  funding: SITE_STATS.fundingSecuredDisplay,
} as const;

/**
 * Format programs display for careers page
 */
export function formatProgramsDisplay(programs: Array<{ title: string }>): string {
  if (!programs || programs.length === 0) return 'various programs';
  const names = programs.map((p) => p.title);
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
