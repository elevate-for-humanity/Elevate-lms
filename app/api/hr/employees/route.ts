import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { sanitizeSearchInput } from '@/lib/utils';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET /api/hr/employees - List all employees
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Filters
    const department = searchParams.get('department');
    const status = searchParams.get('status') || 'active';
    const search = searchParams.get('search');

    let query = db
      .from('employees')
      .select(
        `
        *,
        profile:profiles(*),
        department:departments(*),
        position:positions(*),
        manager:employees!manager_id(id, profile:profiles(full_name, email))
      `,
        { count: 'exact' }
      )
      .eq('employment_status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (department) {
      query = query.eq('department_id', department);
    }

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(`employee_number.ilike.%${sanitizedSearch}%,work_email.ilike.%${sanitizedSearch}%,personal_email.ilike.%${sanitizedSearch}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      employees: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) { 
    logger.error(
      'Error fetching employees:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/hr/employees - Create new employee
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const body = await parseBody<Record<string, any>>(request);

    const {
      profile_id,
      employee_number,
      department_id,
      position_id,
      manager_id,
      hire_date,
      employment_type,
      work_location,
      salary,
      pay_frequency,
      pay_type,
      hourly_rate,
      ...otherFields
    } = body;

    // Validate required fields
    if (!profile_id || !employee_number || !hire_date) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: profile_id, employee_number, hire_date',
        },
        { status: 400 }
      );
    }

    // Check if employee number already exists
    const { data: existing } = await db
      .from('employees')
      .select('id')
      .eq('employee_number', employee_number)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Employee number already exists' },
        { status: 409 }
      );
    }

    // Create employee
    const { data: employee, error } = await db
      .from('employees')
      .insert({
        profile_id,
        employee_number,
        department_id,
        position_id,
        manager_id,
        hire_date,
        employment_type,
        work_location,
        salary,
        pay_frequency,
        pay_type,
        hourly_rate,
        ...otherFields,
      })
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

    // Create initial leave balances
    const { data: policies } = await db
      .from('leave_policies')
      .select('id')
      .eq('is_active', true);

    if (policies && policies.length > 0) {
      const currentYear = new Date().getFullYear();
      const leaveBalances = policies.map((policy) => ({
        employee_id: employee.id,
        policy_id: policy.id,
        balance_year: currentYear,
        accrued_hours: 0,
        used_hours: 0,
        pending_hours: 0,
        available_hours: 0,
      }));

      await db.from('leave_balances').insert(leaveBalances);
    }

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) { 
    logger.error(
      'Error creating employee:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create employee' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/hr/employees', _GET);
export const POST = withApiAudit('/api/hr/employees', _POST);
