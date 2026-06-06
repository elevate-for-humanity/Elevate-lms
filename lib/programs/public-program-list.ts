import { createPublicClient } from '@/lib/supabase/public';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { loadPublishedProgramsListing } from '@/lib/programs/load-program-catalog';
import { PROGRAMS_PAGE_SUPPRESSED_SLUGS } from '@/lib/programs/public-programs-page';

export type PublicProgramListItem = {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  duration: string | null;
  credential: string | null;
  funding_eligible: boolean;
};

export type PublicProgramListResult = {
  programs: PublicProgramListItem[];
  source: 'database' | 'static-catalog';
};

const SECTOR_TO_CATEGORY: Record<ProgramSchema['sector'], string> = {
  healthcare: 'healthcare',
  'skilled-trades': 'trades',
  'personal-services': 'beauty',
  technology: 'technology',
  business: 'business',
};

/**
 * Public /programs listing — same catalog SSOT as getPublicProgramsPageData().
 */
export async function loadPublicProgramList(): Promise<PublicProgramListResult> {
  const db = createPublicClient();
  const { programs: listing, source } = await loadPublishedProgramsListing(db, {
    suppressSlugs: PROGRAMS_PAGE_SUPPRESSED_SLUGS,
  });

  const programs: PublicProgramListItem[] = listing.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category:
      SECTOR_TO_CATEGORY[p.sectionKey as ProgramSchema['sector']] ?? p.sectionKey ?? 'other',
    duration: p.duration,
    credential: p.credential,
    funding_eligible: p.funding_eligible,
  }));

  return {
    programs,
    source: source === 'database' ? 'database' : 'static-catalog',
  };
}

/** Dropdown options for /apply and intake forms (id = slug for stable keys). */
export type ApplyProgramOption = {
  id: string;
  title: string;
  slug: string;
};

export async function loadApplyProgramOptions(): Promise<{
  options: ApplyProgramOption[];
  source: PublicProgramListResult['source'];
}> {
  const { programs, source } = await loadPublicProgramList();
  const options = programs.map((p) => ({
    id: p.slug,
    title: p.title,
    slug: p.slug,
  }));
  return { options, source };
}
