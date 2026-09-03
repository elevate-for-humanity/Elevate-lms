/**
 * Server-only public stats — DB-backed when available; conservative SITE_STATS otherwise.
 * Use on SSR pages so raw HTML never shows fabricated marketing numbers.
 */

import { createPublicClient } from '@/lib/supabase/public';
import { SITE_STATS, statLabel } from '@/lib/site-stats';
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
  const programCount = await loadVerifiedProgramCount();

  let publishedFromDb: number | null = null;
  try {
    const db = createPublicClient();
    const { count, error } = await db
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('published', true)
      .eq('is_active', true)
      .neq('status', 'archived');
    if (!error && count != null && count > 0) publishedFromDb = count;
  } catch {
    publishedFromDb = null;
  }

  const programsOffered =
    publishedFromDb ?? (programCount > 0 ? programCount : SITE_STATS.programsOffered);

  return {
    programsOffered,
    programsDisplay: `${programsOffered}+`,
    studentsDisplay: SITE_STATS.studentsDisplay,
    placementDisplay: statLabel.placement,
    placementRate: SITE_STATS.jobPlacementRate,
    dataAvailable: publishedFromDb != null,
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
