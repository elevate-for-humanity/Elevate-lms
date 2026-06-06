/**
 * lib/site-stats.ts
 *
 * Single source of truth for public-facing marketing statistics.
 * Align counts with lib/programs/public-program-list.ts (DB or static catalog).
 * Do not publish unverified placement or attainment percentages.
 */

import { STATIC_PROGRAM_MAP } from '@/data/programs/index';
import { PUBLIC_CREDENTIALS_DISPLAY } from '@/lib/site-credentials';

const STATIC_PROGRAM_COUNT = STATIC_PROGRAM_MAP.size;

/** Unverified metrics render as em dash on public pages until platform_settings confirms them. */
export const SITE_STATS = {
  studentsDisplay: '—',
  studentsDisplayVerified: false,
  careerServicesSupportRate: null as number | null,
  programsOffered: STATIC_PROGRAM_COUNT,
  programsOfferedDisplay: `${STATIC_PROGRAM_COUNT}+`,
  statesServed: 5,
  credentialsDisplay: PUBLIC_CREDENTIALS_DISPLAY,
  employerPartnersDisplay: '—',
  fundingSecuredDisplay: '—',
  /** @deprecated Use careerServicesSupportRate — null when unverified */
  jobPlacementRate: null as number | null,
  metricsFootnote: 'Outcome metrics available upon request for workforce reviewers.',
} as const;

export const statLabel = {
  students: SITE_STATS.studentsDisplay,
  placement:
    SITE_STATS.careerServicesSupportRate != null
      ? `${SITE_STATS.careerServicesSupportRate}%`
      : '—',
  programs: SITE_STATS.programsOfferedDisplay,
  credentials: SITE_STATS.credentialsDisplay,
  employers: SITE_STATS.employerPartnersDisplay,
  funding: SITE_STATS.fundingSecuredDisplay,
} as const;

/** Canonical marketing display for program counts (e.g. "40+"). */
export function formatProgramsDisplay(count: number | null | undefined): string {
  if (count != null && count > 0) return `${count}+`;
  return SITE_STATS.programsOfferedDisplay;
}
