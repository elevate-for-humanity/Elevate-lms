import { NextRequest, NextResponse } from 'next/server';
import { searchJobs } from '@/lib/adzuna';

/**
 * GET /api/jobs/search
 * Search jobs via Adzuna API
 * 
 * Query params:
 *   what - Job title/keyword
 *   where - Location (city or zip)
 *   distance - Radius in miles (default: 10)
 *   salary_min - Minimum salary
 *   salary_max - Maximum salary
 *   results_per_page - Number of results (max: 100)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const params = {
    what: searchParams.get('what') ?? undefined,
    where: searchParams.get('where') ?? undefined,
    distance: searchParams.get('distance') ? parseInt(searchParams.get('distance')!) : 10,
    salary_min: searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min')!) : undefined,
    salary_max: searchParams.get('salary_max') ? parseInt(searchParams.get('salary_max')!) : undefined,
    results_per_page: searchParams.get('results_per_page') ? parseInt(searchParams.get('results_per_page')!) : 20,
  };

  const result = await searchJobs(params);
  
  return NextResponse.json(result);
}
