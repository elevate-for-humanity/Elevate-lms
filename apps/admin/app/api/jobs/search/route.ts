/**
 * GET /api/jobs/search
 *
 * Search jobs via Adzuna.
 * Query params:
 *   what    - job title / keyword  (required)
 *   where   - location (city/state) (required)
 *   results_per_page - default 5
 *   sort_by - 'date' | 'salary' (default 'date')
 */
import { NextRequest, NextResponse } from 'next/server';
import { searchJobs } from '@/lib/adzuna';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const what = searchParams.get('what');
    const where = searchParams.get('where') || 'Indianapolis, IN';
    const resultsPerPage = Math.min(Number(searchParams.get('results_per_page') || '5'), 50);
    const sortBy = searchParams.get('sort_by') === 'salary' ? 'salary' : 'date';

    if (!what) {
      return NextResponse.json({ error: 'Missing required param: what' }, { status: 400 });
    }

    const result = await searchJobs({
      what,
      where,
      results_per_page: resultsPerPage,
      sort_by: sortBy,
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error('[jobs/search] Error', err);
    return NextResponse.json({ jobs: [], totalCount: 0 });
  }
}
