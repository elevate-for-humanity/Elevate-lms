import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/hr/employees/[id] - Get single employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { id } = await params;

    const { data: employee, error } = await supabase
      .from('employees')
      .select(
        `
        *,
        profile:profiles(*),
        department:departments(*),
        position:positions(*),
        manager:employees!manager_id(
          id,
          employee_number,
          profile:profiles(full_name, email)
        ),
        direct_reports:employees!manager_id(
          id,
          employee_number,
          profile:profiles(full_name, email),
          position:positions(title)
        ),
        leave_balances(
          *,
          policy:leave_policies(*)
        ),
        salary_history(
          *,
          approved_by_profile:profiles!approved_by(full_name)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ employee });
  } catch (error) { 
    logger.error(
      'Error fetching employee:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PATCH /api/hr/employees/[id] - Update employee
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { id } = await params;
    const body = await parseBody<Record<string, any>>(request);

    // Don't allow updating certain fields directly
    const {
      id: bodyId,
      profile_id,
      employee_number,
      created_at,
      ...updateFields
    } = body;

    const { data: employee, error } = await supabase
      .from('employees')
      .update(updateFields)
      .eq('id', id)
      .select(
        `
        *,
        profile:profiles(*),
        department:departments(*),
        position:positions(*)
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ employee });
  } catch (error) { 
    logger.error(
      'Error updating employee:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE /api/hr/employees/[id] - Soft delete (terminate) employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const terminationDate =
      searchParams.get('termination_date') ||
      new Date().toISOString().split('T')[0];

    const { data: employee, error } = await supabase
      .from('employees')
      .update({
        employment_status: 'terminated',
        termination_date: terminationDate,
        is_active: true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Terminate active benefits
    await supabase
      .from('benefits_enrollments')
      .update({
        status: 'terminated',
        termination_date: terminationDate,
      })
      .eq('employee_id', id)
      .eq('status', 'active');

    return NextResponse.json({
      message: 'Employee terminated successfully',
      employee,
    });
  } catch (error) { 
    logger.error(
      'Error terminating employee:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to terminate employee' },
      { status: 500 }
    );
  }
}
