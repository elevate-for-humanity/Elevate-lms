import { NextRequest, NextResponse } from 'next/server';
import { getSalaryInsights } from '@/lib/adzuna';

/**
 * GET /api/jobs/salary
 * Get salary insights for a job title
 * 
 * Query params:
 *   title - Job title
 *   where - Location (optional)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const title = searchParams.get('title');
  
  if (!title) {
    return NextResponse.json(
      { error: 'Missing required parameter: title' },
      { status: 400 }
    );
  }
  
  const where = searchParams.get('where') ?? undefined;
  const insights = await getSalaryInsights(title, where);
  
  if (!insights) {
    return NextResponse.json(
      { error: 'Unable to fetch salary data' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(insights);
}
