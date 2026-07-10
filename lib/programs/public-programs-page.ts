/**
 * Shared server data for /programs — single source for page HTML, RSC payload, and metadata.
 * Never rely on client hydration for program count or listing.
 */

import type { Metadata } from 'next';
import { createPublicClient, isPublicSupabaseConfigured } from '@/lib/supabase/public';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { buildSiteMetadata } from '@/lib/seo/build-site-metadata';
import { SITE_STATS } from '@/lib/site-stats';
import {
  loadPublishedProgramsListing,
  type ProgramsListingItem,
} from '@/lib/programs/load-program-catalog';

/** Format program count for display (e.g., "50+ programs" or just "50 programs") */
export function formatPublicProgramsDisplay(count: number): string {
  if (count === 0) return 'No';
  if (count >= 100) return `${count}+`;
  return String(count);
}

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
  'emergency-health-safety',
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

/** Catalog program type used in /programs/catalog */
export type PublicCatalogProgram = {
  program_id: string;
  slug: string | null;
  title: string;
  provider_name: string | null;
  wioa_eligible: boolean;
  funding_tags: string[];
  category: string | null;
  credential_name: string | null;
  duration_weeks: number | null;
  city: string | null;
  state: string | null;
  delivery_mode: 'online' | 'hybrid' | 'in-person' | null;
  price_cents: number | null;
  description: string | null;
};

/** Catalog result type */
type PublicCatalogResult = {
  programs: PublicCatalogProgram[];
  total: number;
  totalPages: number;
};

export async function getPublicProgramsCatalogPage({
  q,
  category,
  wioaOnly,
  page,
  perPage = 18,
}: {
  q?: string;
  category?: string;
  wioaOnly?: boolean;
  page?: number;
  perPage?: number;
}): Promise<PublicCatalogResult> {
  const { programs } = await getPublicProgramsPageData();

  let filtered = programs;

  if (q) {
    const search = q.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(search) ||
      (p.description ?? '').toLowerCase().includes(search)
    );
  }

  if (category) {
    filtered = filtered.filter(p =>
      (p.category ?? '').toLowerCase().includes(category.toLowerCase())
    );
  }

  if (wioaOnly) {
    filtered = filtered.filter(p => p.funding_eligible);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  const catalogPrograms: PublicCatalogProgram[] = paginated.map((p, i) => ({
    program_id: p.slug ?? `program-${i}`,
    slug: p.slug,
    title: p.title,
    provider_name: null,
    wioa_eligible: p.funding_eligible,
    funding_tags: [],
    category: p.category,
    credential_name: p.credential,
    duration_weeks: null,
    city: null,
    state: null,
    delivery_mode: null,
    price_cents: null,
    description: p.description,
  }));

  return {
    programs: catalogPrograms,
    total,
    totalPages,
  };
}

export async function buildProgramsCatalogMetadata(): Promise<Metadata> {
  const { programCount } = await getPublicProgramsPageData();
  const count = resolvePublicProgramCount(programCount);
  return buildSiteMetadata({
    title: 'Programs Catalog',
    description: `Browse ${count} credential-bearing career training programs in healthcare, skilled trades, technology, beauty, and business.`,
    path: '/programs/catalog',
  });
}

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

export async function buildProgramsListingMetadata(): Promise<Metadata> {
  const { programCount } = await getPublicProgramsPageData();
  const count = resolvePublicProgramCount(programCount);
  return buildSiteMetadata({
    title: 'Career Training Programs',
    description: `${count} credential-bearing career training programs in healthcare, skilled trades, technology, beauty, and business. WIOA and Workforce Ready Grant funding available.`,
    path: '/programs',
  });
}
