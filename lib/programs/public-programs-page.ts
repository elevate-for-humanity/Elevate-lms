/** Shared server data for /programs — canonical HTML, RSC and metadata source. */

import type { Metadata } from 'next';
import { createPublicClient, isPublicSupabaseConfigured } from '@/lib/supabase/public';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { SITE_STATS } from '@/lib/site-stats';
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

/**
 * Historical catalog slugs that represent the same public pathway.
 * The public programs page must never render these as competing programs.
 * Detail-route redirects can continue to preserve old inbound links.
 */
export const PUBLIC_PROGRAM_ALIASES: Readonly<Record<string, string>> = {
  business: 'business-administration',
  'business-operations': 'business-administration',
  entrepreneurship: 'business-startup',
  'entrepreneurship-small-business': 'business-startup',
  'bookkeeping-fundamentals': 'bookkeeping',
  'finance-bookkeeping-accounting': 'bookkeeping',
  'customer-service-pro': 'customer-service-representative',
  'it-support-specialist': 'it-help-desk',
  'forklift-operator': 'forklift',
};

const PUBLIC_PROGRAM_TITLES: Readonly<Record<string, string>> = {
  'business-startup': 'Entrepreneurship & Small Business',
  bookkeeping: 'Bookkeeping & Accounting',
};

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
};

export const PROGRAMS_PAGE_SUPPRESSED_SLUGS = new Set([
  'cna-training', 'hvac', 'hvac-technician-program', 'hvac-2024', 'medical-assistant-program',
  'phlebotomy-technician', 'phlebotomy-technician-program', 'barber', 'barber-program', 'cosmetology',
  'nail-technician', 'cpr-cert', 'health-safety', 'tax-prep', 'it-support', 'cybersecurity',
  'peer-recovery-specialist-jri', 'ai-advanced-project-management-1774494313718',
  'ai-forklift-safety-certification-1774495387731', 'jri-badge-1-mindsets', 'jri-badge-2-self-management',
  'jri-badge-3-learning-strategies', 'jri-badge-4-social-skills', 'jri-badge-5-workplace-skills',
  'jri-badge-6-launch-a-career', 'jri-introduction', 'jri', 'micro-programs', 'healthcare',
  'skilled-trades', 'technology', 'building-maintenance-wrg', 'life-coach-certification-wioa',
  'nha-medical-assistant', 'nha-phlebotomy', 'nha-pharmacy-technician', 'cna-cert',
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

export function getCanonicalPublicProgramSlug(slug: string): string {
  return PUBLIC_PROGRAM_ALIASES[slug] ?? slug;
}

export function getPublicProgramCategoryLabel(category: string | null | undefined): string {
  const raw = (category ?? '').trim();
  if (!raw) return 'Career Training';
  return CATEGORY_LABELS[raw.toLowerCase()] ?? raw;
}

function mapListingToRows(listing: ProgramsListingItem[]): ProgramsPageRow[] {
  const rows = new Map<string, ProgramsPageRow>();

  for (const program of listing) {
    const canonicalSlug = getCanonicalPublicProgramSlug(program.slug);
    const verified = getVerifiedProgramFunding(canonicalSlug) ?? getVerifiedProgramFunding(program.slug);
    const slug = verified?.slug ?? canonicalSlug;
    if (rows.has(slug)) continue;

    rows.set(slug, {
      slug,
      title: verified?.title ?? PUBLIC_PROGRAM_TITLES[slug] ?? program.title,
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
    rows.set(verified.slug, {
      slug: verified.slug,
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

  return [...rows.values()].sort((a, b) => {
    const categoryOrder = a.category.localeCompare(b.category);
    return categoryOrder || a.title.localeCompare(b.title);
  });
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
  const description = `${count} career training programs grouped by pathway in healthcare, skilled trades, technology, beauty, human services, and business. Verified workforce-funded programs are identified separately from self-pay courses.`;
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
