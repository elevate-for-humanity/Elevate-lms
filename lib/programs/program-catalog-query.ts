/**
 * Program catalog reads for /programs/catalog and GET /api/catalog.
 * Uses live `programs` rows when available; falls back to static registry
 * when RLS/empty DB would show zero results (same contract as public-program-list).
 */

import { createPublicClient } from '@/lib/supabase/public';
import { loadPublicProgramList } from '@/lib/programs/public-program-list';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type CatalogProgramRow = {
  program_id: string;
  provider_name: string;
  provider_slug: string;
  title: string;
  slug: string | null;
  category: string | null;
  wioa_eligible: boolean;
  funding_tags: string[];
  credential_name: string | null;
  duration_weeks: number | null;
  next_start_date: string | null;
  seats_available: number | null;
  delivery_mode: string | null;
  city: string | null;
  state: string | null;
  completion_rate: number | null;
  placement_rate: number | null;
};

export type CatalogQueryParams = {
  q?: string;
  category?: string;
  wioaOnly?: boolean;
  page?: number;
  perPage?: number;
};

export type CatalogQueryResult = {
  programs: CatalogProgramRow[];
  total: number;
  source: 'database' | 'static-catalog';
};

const PROVIDER_NAME = PLATFORM_DEFAULTS.orgName;
const PROVIDER_SLUG = 'elevate';

function parseDurationWeeks(duration: string | null): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

async function staticFallbackAsync(
  params: CatalogQueryParams,
): Promise<CatalogQueryResult> {
  const { programs: staticPrograms } = await loadPublicProgramList();
  let rows: CatalogProgramRow[] = staticPrograms.map((p) => ({
    program_id: p.slug,
    provider_name: PROVIDER_NAME,
    provider_slug: PROVIDER_SLUG,
    title: p.title,
    slug: p.slug,
    category: p.category,
    wioa_eligible: p.funding_eligible,
    funding_tags: p.funding_eligible ? ['wioa'] : [],
    credential_name: p.credential,
    duration_weeks: parseDurationWeeks(p.duration),
    next_start_date: null,
    seats_available: null,
    delivery_mode: 'hybrid',
    city: 'Indianapolis',
    state: 'IN',
    completion_rate: null,
    placement_rate: null,
  }));

  const q = params.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.slug?.toLowerCase().includes(q) ?? false),
    );
  }
  if (params.category) {
    rows = rows.filter((r) => r.category === params.category);
  }
  if (params.wioaOnly) {
    rows = rows.filter((r) => r.wioa_eligible);
  }

  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? 18;
  const total = rows.length;
  const start = (page - 1) * perPage;
  const programs = rows.slice(start, start + perPage);

  return { programs, total, source: 'static-catalog' };
}

function mapDbRow(row: Record<string, unknown>): CatalogProgramRow {
  const id = String(row.id ?? row.slug ?? '');
  return {
    program_id: id,
    provider_name: PROVIDER_NAME,
    provider_slug: PROVIDER_SLUG,
    title: String(row.title ?? ''),
    slug: (row.slug as string) ?? null,
    category: (row.category as string) ?? null,
    wioa_eligible: Boolean(row.wioa_eligible ?? row.wioa_approved),
    funding_tags: Array.isArray(row.funding_tags)
      ? (row.funding_tags as string[])
      : [],
    credential_name:
      (row.credential_name as string) ??
      (row.credential_type as string) ??
      null,
    duration_weeks:
      (row.duration_weeks as number) ??
      (row.estimated_weeks as number) ??
      parseDurationWeeks(row.duration as string) ??
      null,
    next_start_date: (row.next_start_date as string) ?? null,
    seats_available: (row.seats_available as number) ?? null,
    delivery_mode: (row.delivery_mode as string) ?? 'hybrid',
    city: (row.city as string) ?? 'Indianapolis',
    state: (row.state as string) ?? 'IN',
    completion_rate: (row.completion_rate as number) ?? null,
    placement_rate: (row.placement_rate as number) ?? null,
  };
}

/**
 * Paginated catalog for marketing catalog UI and API.
 */
export async function loadProgramCatalog(
  params: CatalogQueryParams = {},
): Promise<CatalogQueryResult> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(50, Math.max(1, params.perPage ?? 18));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  try {
    const db = createPublicClient();
    let query = db
      .from('programs')
      .select(
        'id, slug, title, category, short_description, description, duration, credential_type, wioa_eligible, funding_tags, delivery_mode, city, state',
        { count: 'exact' },
      )
      .eq('is_active', true)
      .eq('published', true)
      .neq('status', 'archived')
      .order('title')
      .range(from, to);

    const q = params.q?.trim();
    if (q) {
      query = query.or(
        `title.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`,
      );
    }
    if (params.category) {
      query = query.eq('category', params.category);
    }
    if (params.wioaOnly) {
      query = query.eq('wioa_eligible', true);
    }

    const { data, count, error } = await query;

    if (!error && data && data.length > 0) {
      return {
        programs: data.map((row) => mapDbRow(row as Record<string, unknown>)),
        total: count ?? data.length,
        source: 'database',
      };
    }

    if (!error && (count ?? 0) === 0) {
      return staticFallbackAsync({ ...params, page, perPage });
    }
  } catch {
    // fall through
  }

  return staticFallbackAsync({ ...params, page, perPage });
}
