/**
 * Shared server data for /programs — single source for page HTML, RSC payload, and metadata.
 */

import type { Metadata } from 'next';
import { createPublicClient, isPublicSupabaseConfigured } from '@/lib/supabase/public';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { SITE_STATS } from '@/lib/site-stats';
import {
  loadPublishedProgramsListing,
  type ProgramsListingItem,
} from '@/lib/programs/load-program-catalog';
import {
  getProgramFundingTier,
  getPublicFundingLabels,
  getVerifiedProgramFunding,
  isStrictWorkforceFundedProgram,
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
} from '@/lib/programs/funding-registry';

export const buildProgramsCatalogMetadata = buildProgramsListingMetadata;
export const getPublicProgramsCatalogPage = getPublicProgramsPageData;
export type PublicCatalogProgram = ProgramsPageRow;

export const PROGRAMS_PAGE_SUPPRESSED_SLUGS = new Set([
  'cna-training',
  'hvac',
  'hvac-technician-program',
  'hvac-2024',
  'medical-assistant-program',
  'phlebotomy-technician',
  'phlebotomy-technician-program',
  'barber',
  'barber-program',
  'cosmetology',
  'nail-technician',
  'cpr-cert',
  'health-safety',
  'forklift-operator',
  'tax-prep',
  'it-support',
  'it-support-specialist',
  'cybersecurity',
  'bookkeeping-fundamentals',
  'entrepreneurship-small-business',
  'peer-recovery-specialist-jri',
  'ai-advanced-project-management-1774494313718',
  'ai-forklift-safety-certification-1774495387731',
  'jri-badge-1-mindsets',
  'jri-badge-2-self-management',
  'jri-badge-3-learning-strategies',
  'jri-badge-4-social-skills',
  'jri-badge-5-workplace-skills',
  'jri-badge-6-launch-a-career',
  'jri-introduction',
  'jri',
  'micro-programs',
  'nha-medical-assistant',
  'nha-phlebotomy',
  'nha-pharmacy-technician',
  'cna-cert',
]);

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
  catalogSource: 'database' | 'static-fallback';
};

function mapListingToRows(listing: ProgramsListingItem[]): ProgramsPageRow[] {
  const rows = new Map<string, ProgramsPageRow>();

  for (const p of listing) {
    const verified = getVerifiedProgramFunding(p.slug);
    const slug = verified?.slug ?? p.slug;
    if (rows.has(slug)) continue;
    rows.set(slug, {
      slug,
      title: verified?.title ?? p.title,
      description: verified?.description ?? p.description,
      category: verified?.category ?? p.sectionKey,
      duration: verified?.duration ?? p.duration,
      credential: verified?.credential ?? p.credential,
      funding_eligible: isStrictWorkforceFundedProgram(slug),
      funding_tier: getProgramFundingTier(slug),
      funding_labels: getPublicFundingLabels(slug),
      top_jobs_stars: verified?.topJobsStars ?? null,
    });
  }

  for (const verified of VERIFIED_WORKFORCE_FUNDED_PROGRAMS) {
    rows.set(verified.slug, {
      slug: verified.slug,
      title: verified.title,
      description: verified.description,
      category: verified.category,
      duration: verified.duration,
      credential: verified.credential,
      funding_eligible: true,
      funding_tier: 'workforce-funded',
      funding_labels: getPublicFundingLabels(verified.slug),
      top_jobs_stars: verified.topJobsStars,
    });
  }

  return [...rows.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export async function getPublicProgramsPageData(): Promise<PublicProgramsPageData> {
  const db = createPublicClient();
  const { programs: listing, source } = await loadPublishedProgramsListing(db, {
    suppressSlugs: PROGRAMS_PAGE_SUPPRESSED_SLUGS,
    suppressFallbackWarning: !isPublicSupabaseConfigured(),
  });

  const programs = mapListingToRows(listing);
  return { programs, programCount: programs.length, catalogSource: source };
}

export function resolvePublicProgramCount(programCount: number): number {
  if (programCount > 0) return programCount;
  return SITE_STATS.programsOffered;
}

export async function buildProgramsListingMetadata(): Promise<Metadata> {
  const { programCount } = await getPublicProgramsPageData();
  const count = resolvePublicProgramCount(programCount);
  const description = `${count} career training programs in healthcare, skilled trades, technology, beauty, and business. Verified workforce-funded programs are identified separately from regular self-pay courses.`;
  return {
    title: { absolute: 'Career Training Programs | Elevate for Humanity' },
    description,
    alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl.replace(/\/$/, '')}/programs` },
    openGraph: {
      title: 'Career Training Programs | Elevate for Humanity',
      description,
      url: `${PLATFORM_DEFAULTS.siteUrl.replace(/\/$/, '')}/programs`,
      siteName: PLATFORM_DEFAULTS.orgName,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Career Training Programs | Elevate for Humanity',
      description,
    },
  };
}

export function formatPublicProgramsDisplay(count: number): string {
  return count === 1 ? '1 program' : `${count} programs`;
}
