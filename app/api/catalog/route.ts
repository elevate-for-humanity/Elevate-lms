export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/catalog
// Public, rate-limited. Returns paginated, filtered results from program_catalog_index.
// Query params:
//   q           — full-text search
//   category    — program category
//   wioa        — 'true' to filter WIOA-eligible only
//   state       — state code (default IN)
//   provider    — tenant slug
//   page        — 1-based (default 1)
//   per_page    — max 50 (default 20)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const category = searchParams.get('category') ?? '';
  const wioaOnly = searchParams.get('wioa') === 'true';
  const state = searchParams.get('state') ?? '';
  const providerSlug = searchParams.get('provider') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)));
  const offset = (page - 1) * perPage;

  try {
    const supabase = await createClient();
    let query = supabase
      .from('program_catalog_index')
      .select(
        'program_id, provider_name, provider_slug, title, slug, category, program_type, ' +
        'wioa_eligible, funding_tags, credential_type, credential_name, credential_authority, ' +
        'duration_weeks, next_start_date, seats_available, delivery_mode, ' +
        'service_area, city, state, completion_rate, placement_rate',
        { count: 'exact' }
      )
      .range(offset, offset + perPage - 1)
      .order('next_start_date', { ascending: true, nullsFirst: false });

    if (q) {
      query = query.textSearch('search_vector', q, { type: 'websearch' });
    }
    if (category) query = query.eq('category', category);
    if (wioaOnly) query = query.eq('wioa_eligible', true);
    if (state) query = query.eq('state', state.toUpperCase());
    if (providerSlug) query = query.eq('provider_slug', providerSlug);

    const { data, count, error } = await query;
    if (error) return safeInternalError(error, 'Failed to fetch catalog');

    return NextResponse.json({
      programs: data ?? [],
      total: count ?? 0,
      page,
      perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch catalog');
  }
}
