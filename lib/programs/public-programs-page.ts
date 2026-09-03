/** Shared server data for /programs — Supabase is the only publication source. */
import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { loadPublishedProgramsListing, type ProgramsListingItem } from '@/lib/programs/load-program-catalog';
import {
  getProgramFundingTier,
  getPublicFundingLabels,
  getVerifiedProgramFunding,
  isStrictWorkforceFundedProgram,
  sanitizePublicFundingDescription,
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
} from '@/lib/programs/funding-registry';

export const buildProgramsCatalogMetadata = buildProgramsListingMetadata;
export const getPublicProgramsCatalogPage = getPublicProgramsPageData;
export type PublicCatalogProgram = ProgramsPageRow;

/** No program slugs are hidden or redirected. Published Supabase rows are the catalog. */
export const PROGRAMS_PAGE_SUPPRESSED_SLUGS = new Set<string>();

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  business: 'Business & Financial',
  'business-financial': 'Business & Financial',
  'business & financial': 'Business & Financial',
  trades: 'Skilled Trades',
  'skilled-trades': 'Skilled Trades',
  'skilled trades': 'Skilled Trades',
  healthcare: 'Healthcare',
  health: 'Healthcare',
  technology: 'Technology',
  tech: 'Technology',
  beauty: 'Barber & Beauty',
  'barber-beauty': 'Barber & Beauty',
  'barber & beauty': 'Barber & Beauty',
  'human-services': 'Human Services',
  'human services': 'Human Services',
  hospitality: 'Hospitality',
  apprenticeship: 'Apprenticeship',
  special: 'Career Readiness',
};

export type ProgramsPageRow = {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  duration: string | null;
  credential: string | null;
  funding_eligible: boolean;
  funding_tier: 'workforce-funded' | 'self-pay';
  funding_labels: string[];
  top_jobs_stars: number | null;
};

export type PublicProgramsPageData = {
  programs: ProgramsPageRow[];
  programCount: number;
  catalogSource: 'database';
};

/** Exact-slug contract: there are no public program aliases. */
export function getCanonicalPublicProgramSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

export function getPublicProgramCategoryLabel(category: string | null | undefined): string {
  const raw = (category ?? '').trim();
  if (!raw) return 'Career Training';
  return CATEGORY_LABELS[raw.toLowerCase()] ?? raw;
}

function mapListingToRows(listing: ProgramsListingItem[]): ProgramsPageRow[] {
  const rows = new Map<string, ProgramsPageRow>();

  for (const program of listing) {
    const slug = getCanonicalPublicProgramSlug(program.slug);
    const verified = getVerifiedProgramFunding(slug);
    rows.set(slug, {
      slug,
      title: verified?.title ?? program.title,
      description: sanitizePublicFundingDescription(slug, verified?.description ?? program.description),
      category: getPublicProgramCategoryLabel(verified?.category ?? program.sectionKey),
      duration: verified?.duration ?? program.duration,
      credential: verified?.credential ?? program.credential,
      funding_eligible: isStrictWorkforceFundedProgram(slug),
      funding_tier: getProgramFundingTier(slug),
      funding_labels: getPublicFundingLabels(slug),
      top_jobs_stars: verified?.topJobsStars ?? null,
    });
  }

  for (const verified of VERIFIED_WORKFORCE_FUNDED_PROGRAMS) {
    if (!rows.has(verified.slug)) continue;
    const current = rows.get(verified.slug)!;
    rows.set(verified.slug, {
      ...current,
      title: verified.title,
      description: verified.description,
      category: getPublicProgramCategoryLabel(verified.category),
      duration: verified.duration,
      credential: verified.credential,
      funding_eligible: true,
      funding_tier: 'workforce-funded',
      funding_labels: getPublicFundingLabels(verified.slug),
      top_jobs_stars: verified.topJobsStars,
    });
  }

  return [...rows.values()].sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
}

export async function getPublicProgramsPageData(): Promise<PublicProgramsPageData> {
  const db = createPublicClient();
  const { programs: listing } = await loadPublishedProgramsListing(db);
  const programs = mapListingToRows(listing);
  return { programs, programCount: programs.length, catalogSource: 'database' };
}

export function resolvePublicProgramCount(programCount: number): number {
  return Math.max(0, programCount);
}

export async function buildProgramsListingMetadata(): Promise<Metadata> {
  const { programCount } = await getPublicProgramsPageData();
  const description = `${programCount} career training programs grouped by pathway in healthcare, skilled trades, technology, beauty, human services, and business. Verified workforce-funded programs are identified separately from self-pay courses.`;
  const canonical = `${PLATFORM_DEFAULTS.siteUrl.replace(/\/$/, '')}/programs`;
  return {
    title: { absolute: 'Career Training Programs | Elevate for Humanity' },
    description,
    alternates: { canonical },
    openGraph: { title: 'Career Training Programs | Elevate for Humanity', description, url: canonical, siteName: PLATFORM_DEFAULTS.orgName, type: 'website', locale: 'en_US' },
    twitter: { card: 'summary_large_image', title: 'Career Training Programs | Elevate for Humanity', description },
  };
}

export function formatPublicProgramsDisplay(count: number): string {
  return count === 1 ? '1 program' : `${count} programs`;
}
