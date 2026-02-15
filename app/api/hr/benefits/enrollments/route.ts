import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/hr/benefits/enrollments?employee_id=
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const params = request.nextUrl.searchParams;
    const employeeId = params.get('employee_id');

    let query = supabase
      .from('benefits_enrollments')
      .select(
        `
        *,
        employee:employees(
          id,
          employee_number,
          profile:profiles(full_name, email)
        ),
        plan:benefits_plans(*)
      `
      )
      .order('created_at', { ascending: false });

    if (employeeId) query = query.eq('employee_id', employeeId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ enrollments: data });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Error fetching benefits enrollments:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// POST /api/hr/benefits/enrollments
// Body: { employee_id, plan_id, coverage_level, effective_date, ... }
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await parseBody<Record<string, any>>(request);

    const { employee_id, plan_id, coverage_level, effective_date } = body;

    if (!employee_id || !plan_id || !coverage_level || !effective_date) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: employee_id, plan_id, coverage_level, effective_date',
        },
        { status: 400 }
      );
    }

    const { data, error }: any = await supabase
      .from('benefits_enrollments')
      .insert({
        employee_id,
        plan_id,
        coverage_level,
        effective_date,
        status: 'active',
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ enrollment: data }, { status: 201 });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Error creating benefits enrollment:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create enrollment' },
      { status: 500 }
    );
  }
}
