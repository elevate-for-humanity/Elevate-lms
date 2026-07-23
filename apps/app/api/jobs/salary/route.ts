/**
 * GET /api/jobs/salary
 *
 * Get salary insights for a job title via Adzuna.
 * Query params:
 *   title   - job title / keyword  (required)
 *   where   - location (city/state) (default: Indianapolis, IN)
 *
 * Returns: { meanSalary, minSalary, maxSalary }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSalaryInsights } from '@/lib/adzuna';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');
    const where = searchParams.get('where') || 'Indianapolis, IN';

    if (!title) {
      return NextResponse.json({ error: 'Missing required param: title' }, { status: 400 });
    }

    const salary = await getSalaryInsights(title, where);

    if (!salary) {
      return NextResponse.json(
        { meanSalary: null, minSalary: null, maxSalary: null },
        { status: 200 },
      );
    }

    return NextResponse.json(salary);
  } catch (err) {
    logger.error('[jobs/salary] Error', err);
    return NextResponse.json(
      { meanSalary: null, minSalary: null, maxSalary: null },
      { status: 200 },
    );
  }
}
