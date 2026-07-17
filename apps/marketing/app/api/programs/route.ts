// PUBLIC ROUTE: public programs catalog
import { createPublicClient } from '@/lib/supabase/public';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { sanitizeSearchInput } from '@/lib/utils';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const db = createPublicClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isActive = searchParams.get('active') !== 'false';

    let query = db.from('programs').select('*').eq('is_active', isActive).order('name');

    // Filter by category
    if (category) {
      const sanitizedCategory = sanitizeSearchInput(category);
      query = query.ilike('category', `%${sanitizedCategory}%`);
    }

    // Filter by search term
    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(
        `name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%,slug.ilike.%${sanitizedSearch}%`,
      );
    }

    const { data: programs, error } = await query;

    if (error) {
      logger.error('Error fetching programs from database:', error);
      return NextResponse.json(
        { status: 'error', error: 'Failed to fetch programs' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        status: 'success',
        count: programs?.length || 0,
        programs: programs || [],
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (error) {
    logger.error('Error in programs API:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to fetch programs' },
      { status: 500 },
    );
  }
}
export const GET = withApiAudit('/api/programs', _GET);
