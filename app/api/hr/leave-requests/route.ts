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

// GET /api/hr/leave-requests?employee_id=&status=
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const params = request.nextUrl.searchParams;

    const employeeId = params.get('employee_id');
    const status = params.get('status');

    let query = db
      .from('leave_requests')
      .select(
        `
        *,
        employee:employees(
          id,
          employee_number,
          profile:profiles(full_name, email)
        ),
        policy:leave_policies(*)
      `
      )
      .order('created_at', { ascending: false });

    if (employeeId) query = query.eq('employee_id', employeeId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ leaveRequests: data });
  } catch (error) { 
    logger.error(
      'Error fetching leave requests:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

// POST /api/hr/leave-requests
// Body: { employee_id, policy_id, start_date, end_date, total_hours, reason }
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const body = await parseBody<Record<string, any>>(request);

    const {
      employee_id,
      policy_id,
      start_date,
      end_date,
      total_hours,
      reason,
    } = body;

    if (
      !employee_id ||
      !policy_id ||
      !start_date ||
      !end_date ||
      !total_hours
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: employee_id, policy_id, start_date, end_date, total_hours',
        },
        { status: 400 }
      );
    }

    const { data, error }: any = await db
      .from('leave_requests')
      .insert({
        employee_id,
        policy_id,
        start_date,
        end_date,
        total_hours,
        reason,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ leaveRequest: data }, { status: 201 });
  } catch (error) { 
    logger.error(
      'Error creating leave request:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create leave request' },
      { status: 500 }
    );
  }
}
