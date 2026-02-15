export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/employee/payroll/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get employee record
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get payroll records
    const { data: payrolls, error } = await supabase
      .from('payroll')
      .select('*')
      .eq('employee_id', employee.id)
      .order('pay_period_end', { ascending: false })
      .limit(12);

    if (error) {
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ payrolls });
  } catch (error) { 
    logger.error(
      'Error fetching payroll:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch payroll data' },
      { status: 500 }
    );
  }
}
