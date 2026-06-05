/**
 * Server-only public stats — DB-backed when available; conservative SITE_STATS otherwise.
 * Use on SSR pages so raw HTML never shows fabricated marketing numbers.
 */

import { SITE_STATS, formatProgramsDisplay } from '@/lib/site-stats';
import {
  getPublicProgramsPageData,
  resolvePublicProgramCount,
} from '@/lib/programs/public-programs-page';

export type VerifiedPublicStats = {
  programsOffered: number;
  programsDisplay: string;
  studentsDisplay: string;
  placementDisplay: string;
  placementRate: number | null;
  dataAvailable: boolean;
};

/** Verified program count for marketing copy (SSR). */
export async function loadVerifiedProgramCount(): Promise<number> {
  const { programCount } = await getPublicProgramsPageData();
  return resolvePublicProgramCount(programCount);
}

/**
 * Stats safe to render in server HTML. Does not invent "500+" or "85%" when DB is empty.
 */
export async function loadVerifiedPublicStats(): Promise<VerifiedPublicStats> {
  let programCount = SITE_STATS.programsOffered;
  let catalogVerified = false;
  try {
    const verified = await loadVerifiedProgramCount();
    if (verified > 0) {
      programCount = verified;
      catalogVerified = true;
    }
  } catch {
    programCount = SITE_STATS.programsOffered;
  }

  const programsOffered = programCount > 0 ? programCount : SITE_STATS.programsOffered;

  return {
    programsOffered,
    programsDisplay: formatProgramsDisplay(programsOffered),
    studentsDisplay: SITE_STATS.studentsDisplayVerified
      ? SITE_STATS.studentsDisplay
      : 'Data upon request',
    placementDisplay: SITE_STATS.careerServicesSupportRate != null
      ? `${SITE_STATS.careerServicesSupportRate}%`
      : 'Data upon request',
    placementRate: SITE_STATS.careerServicesSupportRate,
    dataAvailable: catalogVerified,
  };
}

/** Format a numeric metric for public display; use em dash when unverified/zero. */
export function formatVerifiedCount(
  value: number | null | undefined,
  options?: { suffix?: string; unverifiedLabel?: string },
): string {
  const unverified = options?.unverifiedLabel ?? '—';
  if (value == null || value <= 0) return unverified;
  const base = value.toLocaleString('en-US');
  return options?.suffix ? `${base}${options.suffix}` : base;
}
