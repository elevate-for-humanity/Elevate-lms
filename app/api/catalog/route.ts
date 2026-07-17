// PUBLIC ROUTE: public program catalog

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { loadProgramCatalog } from '@/lib/programs/load-program-catalog';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  try {
    const db = createPublicClient();
    const result = await loadProgramCatalog(db, {
      q: q || undefined,
      category: category || undefined,
      wioaOnly,
      state: state || undefined,
      providerSlug: providerSlug || undefined,
      page,
      perPage,
    });

    if (result.error) {
      return safeInternalError(new Error(result.error), 'Failed to fetch catalog');
    }

    return NextResponse.json(
      {
        programs: result.programs,
        total: result.total,
        page: result.page,
        per_page: result.perPage,
        total_pages: result.totalPages,
        source: 'programs',
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      },
    );
  } catch (error) {
    return safeInternalError(error, 'Failed to fetch catalog');
  }
}
