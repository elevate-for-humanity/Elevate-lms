/**
 * Unified public program catalog — canonical read path from `programs` table.
 * Replaces broken queries against legacy `program_catalog_index` column shapes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { logger } from '@/lib/logger';
import { DUPLICATE_PROGRAM_ALIAS_SLUG_SET } from '@/lib/programs/duplicate-program-alias-slugs';
import { normalizeProgramSectionKey, resolveCredentialLabel } from './category-normalize';

const ELEVATE_PROVIDER_SLUG = 'elevate';

const STATIC_SECTOR_SECTION: Record<string, string> = {
  healthcare: 'healthcare',
  'skilled-trades': 'trades',
  'personal-services': 'beauty',
  technology: 'technology',
  business: 'business',
};

function resolveStaticFundingEligible(program: (typeof ALL_PROGRAMS)[number]): boolean {
  return Boolean(
    program.funding?.wioa_eligible ||
      program.funding?.wrg_eligible ||
      program.funding?.fssa_eligible ||
      program.fundingOptions?.some(
        (option) => option === 'wioa' || option === 'wrg' || option === 'impact',
      ),
  );
}

/** SSR/Google-safe listing when public Supabase returns no published rows (RLS/env). */
function listingFromStaticCatalog(suppressed: Set<string>): ProgramsListingItem[] {
  return ALL_PROGRAMS.filter(
    (p) =>
      p.slug &&
      !suppressed.has(p.slug) &&
      p.public_visible !== false &&
      p.active !== false,
  )
    .map((p) => {
      const sectionKey =
        STATIC_SECTOR_SECTION[p.sector] ?? normalizeProgramSectionKey(p.category);
      const weeks = p.durationWeeks;
      return {
        slug: p.slug,
        title: p.title,
        description: p.subtitle?.trim() || null,
        category: p.category,
        sectionKey,
        duration: weeks != null && weeks > 0 ? `${weeks} weeks` : null,
        credential: p.credentials?.[0]?.name ?? null,
        funding_eligible: resolveStaticFundingEligible(p),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Backfill canonical static programs missing from live `programs` rows. */
export function mergeDbListingWithStaticCatalog(
  dbPrograms: ProgramsListingItem[],
  suppressed: Set<string>,
): ProgramsListingItem[] {
  const dbSlugs = new Set(dbPrograms.map((p) => p.slug));
  const staticOnly = listingFromStaticCatalog(suppressed).filter((p) => !dbSlugs.has(p.slug));
  if (staticOnly.length === 0) {
    return dbPrograms;
  }
  return [...dbPrograms, ...staticOnly].sort((a, b) => a.title.localeCompare(b.title));
}


/** Columns that exist on live `programs` (PostgREST). */
export const PUBLIC_PROGRAM_COLUMNS =
  'id, slug, title, category, category_norm, description, excerpt, short_description, duration, duration_weeks, estimated_weeks, credential_type, credential_name, funding_tags, wioa_approved, funding_eligible, delivery_method, image_url, state_code, completion_rate, placement_rate, partner_name, tenant_id, published, is_active, status';

export type CatalogProgram = {
  program_id: string;
  provider_name: string;
  provider_slug: string;
  title: string;
  slug: string;
  category: string | null;
  program_type?: string | null;
  wioa_eligible: boolean;
  funding_tags: string[];
  credential_type: string | null;
  credential_name: string | null;
  credential_authority?: string | null;
  duration_weeks: number | null;
  next_start_date?: string | null;
  seats_available?: number | null;
  delivery_mode: string | null;
  service_area?: string | null;
  city?: string | null;
  state: string | null;
  completion_rate: number | null;
  placement_rate: number | null;
};

export type ProgramsListingItem = {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  sectionKey: string;
  duration: string | null;
  credential: string | null;
  funding_eligible: boolean;
};

type ProgramsRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  category_norm?: string | null;
  description?: string | null;
  excerpt?: string | null;
  short_description?: string | null;
  duration?: string | null;
  duration_weeks?: number | null;
  estimated_weeks?: number | null;
  credential_type?: string | null;
  credential_name?: string | null;
  funding_tags?: string[] | null;
  wioa_approved?: boolean | null;
  funding_eligible?: boolean | null;
  delivery_method?: string | null;
  image_url?: string | null;
  state_code?: string | null;
  completion_rate?: number | null;
  placement_rate?: number | null;
  partner_name?: string | null;
  tenant_id?: string | null;
};

export type LoadProgramCatalogParams = {
  q?: string;
  category?: string;
  wioaOnly?: boolean;
  state?: string;
  providerSlug?: string;
  page?: number;
  perPage?: number;
  /** When true, only Elevate-owned rows (tenant set or default provider). */
  elevateOnly?: boolean;
};

export type LoadProgramCatalogResult = {
  programs: CatalogProgram[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  error?: string;
};

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&');
}

export function mapProgramsRowToCatalog(row: ProgramsRow, providerSlug = ELEVATE_PROVIDER_SLUG): CatalogProgram {
  const credential = resolveCredentialLabel(row);
  return {
    program_id: row.id,
    provider_name: row.partner_name?.trim() || PLATFORM_DEFAULTS.orgName,
    provider_slug: providerSlug,
    title: row.title,
    slug: row.slug,
    category: row.category_norm ?? row.category,
    program_type: 'program',
    wioa_eligible: Boolean(row.wioa_approved ?? row.funding_eligible),
    funding_tags: row.funding_tags ?? [],
    credential_type: row.credential_type ?? null,
    credential_name: credential,
    credential_authority: null,
    duration_weeks: row.duration_weeks ?? row.estimated_weeks ?? null,
    next_start_date: null,
    seats_available: null,
    delivery_mode: row.delivery_method ?? null,
    service_area: null,
    city: null,
    state: row.state_code ?? 'IN',
    completion_rate: row.completion_rate ?? null,
    placement_rate: row.placement_rate ?? null,
  };
}

export function mapProgramsRowToListing(row: ProgramsRow): ProgramsListingItem {
  let desc: string | null = row.short_description ?? row.excerpt ?? row.description ?? null;
  if (desc && !/[.!?]$/.test(desc.trim())) {
    const lastStop = Math.max(desc.lastIndexOf('.'), desc.lastIndexOf('!'), desc.lastIndexOf('?'));
    desc = lastStop > 20 ? desc.slice(0, lastStop + 1) : null;
  }
  const sectionKey = normalizeProgramSectionKey(row.category, row.category_norm);
  const weeks = row.duration_weeks ?? row.estimated_weeks;
  const duration =
    row.duration?.trim() ||
    (weeks != null && weeks > 0 ? `${weeks} weeks` : null);

  return {
    slug: row.slug,
    title: row.title,
    description: desc,
    category: row.category ?? 'Other',
    sectionKey,
    duration,
    credential: resolveCredentialLabel(row),
    funding_eligible: Boolean(row.wioa_approved ?? row.funding_eligible),
  };
}

function basePublishedQuery(client: SupabaseClient) {
  return client
    .from('programs')
    .select(PUBLIC_PROGRAM_COLUMNS, { count: 'exact' })
    .eq('published', true)
    .eq('is_active', true)
    .neq('status', 'archived');
}

/**
 * Paginated searchable catalog (API + /programs/catalog).
 */
export async function loadProgramCatalog(
  client: SupabaseClient,
  params: LoadProgramCatalogParams = {},
): Promise<LoadProgramCatalogResult> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(50, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;
  const q = params.q?.trim() ?? '';
  const providerSlug = params.providerSlug?.trim() ?? '';

  let query = basePublishedQuery(client);

  for (const slug of DUPLICATE_PROGRAM_ALIAS_SLUG_SET) {
    query = query.neq('slug', slug);
  }

  if (params.wioaOnly) {
    query = query.eq('wioa_approved', true);
  }
  if (params.state) {
    query = query.eq('state_code', params.state.toUpperCase());
  }
  if (params.category) {
    query = query.or(
      `category.eq.${params.category},category_norm.eq.${params.category}`,
    );
  }
  if (q) {
    const safe = escapeIlike(q);
    query = query.or(
      `title.ilike.%${safe}%,slug.ilike.%${safe}%,credential_name.ilike.%${safe}%,credential_type.ilike.%${safe}%,description.ilike.%${safe}%`,
    );
  }

  if (providerSlug && providerSlug !== ELEVATE_PROVIDER_SLUG) {
    const { data: tenant } = await client
      .from('tenants')
      .select('id, slug, name')
      .eq('slug', providerSlug)
      .maybeSingle();
    if (tenant?.id) {
      query = query.eq('tenant_id', tenant.id);
    } else {
      return { programs: [], total: 0, page, perPage, totalPages: 0 };
    }
  } else if (params.elevateOnly) {
    query = query.or('tenant_id.not.is.null,partner_name.not.is.null');
  }

  const { data, count, error } = await query
    .order('title', { ascending: true })
    .range(offset, offset + perPage - 1);

  if (error) {
    logger.error('[loadProgramCatalog] query failed', undefined, { message: error.message });
    return {
      programs: [],
      total: 0,
      page,
      perPage,
      totalPages: 0,
      error: error.message,
    };
  }

  const rows = (data ?? []) as ProgramsRow[];
  const providerMapSlug = providerSlug || ELEVATE_PROVIDER_SLUG;
  const programs = rows.map((row) => mapProgramsRowToCatalog(row, providerMapSlug));
  const total = count ?? programs.length;

  return {
    programs,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/**
 * Full listing for /programs grid (no pagination).
 */
export async function loadPublishedProgramsListing(
  client: SupabaseClient,
  options?: { suppressSlugs?: Set<string>; suppressFallbackWarning?: boolean },
): Promise<{
  programs: ProgramsListingItem[];
  error?: string;
  source: 'database' | 'static-fallback';
}> {
  const suppressed = options?.suppressSlugs ?? new Set<string>();

  let data: ProgramsRow[] | null;
  let error: { message: string } | null;

  try {
    const result = await basePublishedQuery(client).order('title', { ascending: true });
    data = (result.data ?? null) as ProgramsRow[] | null;
    error = result.error;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
      '[loadPublishedProgramsListing] query threw',
      err instanceof Error ? err : undefined,
      { message },
    );
    return {
      programs: listingFromStaticCatalog(suppressed),
      error: message,
      source: 'static-fallback',
    };
  }

  if (error) {
    logger.error('[loadPublishedProgramsListing] query failed', undefined, {
      message: error.message,
    });
  }

  const dbPrograms = ((data ?? []) as ProgramsRow[])
    .filter((row) => row.slug && !suppressed.has(row.slug))
    .map(mapProgramsRowToListing);

  if (dbPrograms.length > 0) {
    return {
      programs: mergeDbListingWithStaticCatalog(dbPrograms, suppressed),
      error: error?.message,
      source: 'database',
    };
  }

  if (!options?.suppressFallbackWarning) {
    logger.warn(
      '[loadPublishedProgramsListing] DB returned 0 published programs — using static catalog fallback',
      error ? { dbError: error.message } : undefined,
    );
  }

  return {
    programs: listingFromStaticCatalog(suppressed),
    error: error?.message,
    source: 'static-fallback',
  };
}
