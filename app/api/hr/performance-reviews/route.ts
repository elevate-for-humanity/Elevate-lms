import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/hr/performance-reviews?employee_id=
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const params = request.nextUrl.searchParams;
    const employeeId = params.get('employee_id');

    let query = db
      .from('performance_reviews')
      .select(
        `
        *,
        employee:employees(
          id,
          employee_number,
          profile:profiles(full_name, email)
        ),
        reviewer:profiles!reviewer_id(full_name, email)
      `
      )
      .order('review_period_end', { ascending: false });

    if (employeeId) query = query.eq('employee_id', employeeId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ reviews: data });
  } catch (error) { 
    logger.error(
      'Error fetching performance reviews:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/hr/performance-reviews
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const body = await parseBody<Record<string, any>>(request);

    const {
      employee_id,
      reviewer_id,
      review_period_start,
      review_period_end,
      review_type,
      overall_rating,
      performance_rating,
      attendance_rating,
      teamwork_rating,
      communication_rating,
      strengths,
      areas_for_improvement,
      goals_achieved,
      goals_for_next_period,
      reviewer_comments,
    } = body;

    if (
      !employee_id ||
      !reviewer_id ||
      !review_period_start ||
      !review_period_end ||
      !review_type
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: employee_id, reviewer_id, review_period_start, review_period_end, review_type',
        },
        { status: 400 }
      );
    }

    const { data, error }: any = await db
      .from('performance_reviews')
      .insert({
        employee_id,
        reviewer_id,
        review_period_start,
        review_period_end,
        review_type,
        overall_rating,
        performance_rating,
        attendance_rating,
        teamwork_rating,
        communication_rating,
        strengths,
        areas_for_improvement,
        goals_achieved,
        goals_for_next_period,
        reviewer_comments,
        status: 'submitted',
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ review: data }, { status: 201 });
  } catch (error) { 
    logger.error(
      'Error creating performance review:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create review' },
      { status: 500 }
    );
  }
}
