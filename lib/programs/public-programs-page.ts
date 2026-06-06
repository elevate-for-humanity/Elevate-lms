/**
 * Shared server data for /programs — single source for page HTML, RSC payload, and metadata.
 * Never rely on client hydration for program count or listing.
 */

import type { Metadata } from 'next';
import { createPublicClient, isPublicSupabaseConfigured } from '@/lib/supabase/public';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { buildSiteMetadata } from '@/lib/seo/build-site-metadata';
import { SITE_STATS, formatProgramsDisplay } from '@/lib/site-stats';
import {
  loadPublishedProgramsListing,
  type ProgramsListingItem,
} from '@/lib/programs/load-program-catalog';
import { ARCHIVED_PROGRAM_SLUGS } from '@/lib/programs/archived-program-slugs';

/** Slugs hidden from the public /programs grid (legacy duplicates, drafts). */
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
  ...ARCHIVED_PROGRAM_SLUGS,
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
]);

export type ProgramsPageRow = {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  duration: string | null;
  credential: string | null;
  funding_eligible: boolean;
};

export type PublicProgramsPageData = {
  programs: ProgramsPageRow[];
  programCount: number;
  catalogSource: 'database' | 'static-fallback';
};

function mapListingToRows(listing: ProgramsListingItem[]): ProgramsPageRow[] {
  return listing.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.sectionKey,
    duration: p.duration,
    credential: p.credential,
    funding_eligible: p.funding_eligible,
  }));
}

/** Canonical SSR loader for /programs. */
export async function getPublicProgramsPageData(): Promise<PublicProgramsPageData> {
  const db = createPublicClient();
  const { programs: listing, source } = await loadPublishedProgramsListing(db, {
    suppressSlugs: PROGRAMS_PAGE_SUPPRESSED_SLUGS,
    suppressFallbackWarning: !isPublicSupabaseConfigured(),
  });

  const programs = mapListingToRows(listing);

  return {
    programs,
    programCount: programs.length,
    catalogSource: source,
  };
}

/** Hero/metadata count — use SITE_STATS floor when listing is unexpectedly empty. */
export function resolvePublicProgramCount(programCount: number): number {
  if (programCount > 0) return programCount;
  return SITE_STATS.programsOffered;
}

/** Marketing hero copy — matches homepage and employer stats. */
export function formatPublicProgramsDisplay(programCount: number): string {
  return formatProgramsDisplay(resolvePublicProgramCount(programCount));
}

export async function buildProgramsListingMetadata(): Promise<Metadata> {
  const { programCount } = await getPublicProgramsPageData();
  const count = resolvePublicProgramCount(programCount);
  return buildSiteMetadata({
    title: 'Career Training Programs',
    description: `${count} credential-bearing career training programs in healthcare, skilled trades, technology, beauty, and business. WIOA and Workforce Ready Grant funding available.`,
    path: '/programs',
  });
}

/** Catalog card shape — same listing as /programs, filterable + paginated. */
export type PublicCatalogProgram = {
  program_id: string;
  provider_name: string;
  provider_slug: string;
  title: string;
  slug: string;
  category: string | null;
  wioa_eligible: boolean;
  funding_tags: string[];
  credential_name: string | null;
  duration_weeks: number | null;
  delivery_mode: string | null;
  city: string | null;
  state: string;
  next_start_date: string | null;
  seats_available: number | null;
  completion_rate: number | null;
  placement_rate: number | null;
};

export type PublicCatalogPageParams = {
  q?: string;
  category?: string;
  wioaOnly?: boolean;
  page?: number;
  perPage?: number;
};

export type PublicCatalogPageResult = {
  programs: PublicCatalogProgram[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

function parseDurationWeeks(duration: string | null): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+)\s*week/i);
  return match ? parseInt(match[1], 10) : null;
}

function rowToCatalogProgram(row: ProgramsPageRow): PublicCatalogProgram {
  return {
    program_id: row.slug,
    provider_name: PLATFORM_DEFAULTS.orgName,
    provider_slug: 'elevate',
    title: row.title,
    slug: row.slug,
    category: row.category,
    wioa_eligible: row.funding_eligible,
    funding_tags: row.funding_eligible ? ['wioa'] : [],
    credential_name: row.credential,
    duration_weeks: parseDurationWeeks(row.duration),
    delivery_mode: null,
    city: null,
    state: 'IN',
    next_start_date: null,
    seats_available: null,
    completion_rate: null,
    placement_rate: null,
  };
}

/**
 * Paginated catalog for /programs/catalog — same SSOT as /programs (no raw DB divergence).
 */
export async function getPublicProgramsCatalogPage(
  params: PublicCatalogPageParams = {},
): Promise<PublicCatalogPageResult> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(50, Math.max(1, params.perPage ?? 18));
  const q = params.q?.trim().toLowerCase() ?? '';
  const category = params.category?.trim().toLowerCase() ?? '';

  const { programs: rows } = await getPublicProgramsPageData();

  let filtered = rows;
  if (params.wioaOnly) {
    filtered = filtered.filter((p) => p.funding_eligible);
  }
  if (category) {
    filtered = filtered.filter(
      (p) =>
        p.category.toLowerCase() === category ||
        p.category.toLowerCase().includes(category),
    );
  }
  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.credential?.toLowerCase().includes(q) ?? false) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    );
  }

  const total = filtered.length;
  const offset = (page - 1) * perPage;
  const pageRows = filtered.slice(offset, offset + perPage);

  return {
    programs: pageRows.map(rowToCatalogProgram),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage) || 0,
  };
}

export async function buildProgramsCatalogMetadata(): Promise<Metadata> {
  const { total } = await getPublicProgramsCatalogPage({ perPage: 1, page: 1 });
  const count = resolvePublicProgramCount(total);
  const countLabel = count > 0 ? `${count}` : SITE_STATS.programsOfferedDisplay.replace('+', '');
  return buildSiteMetadata({
    title: 'Program Catalog',
    description: `Browse ${countLabel} workforce training programs. Filter by funding eligibility, credential type, and delivery mode.`,
    path: '/programs/catalog',
  });
}
