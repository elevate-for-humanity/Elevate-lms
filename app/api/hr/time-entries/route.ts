export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/hr/time-entries?employee_id=&start=&end=&status=
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const params = request.nextUrl.searchParams;

    const employeeId = params.get('employee_id');
    const start = params.get('start');
    const end = params.get('end');
    const status = params.get('status');

    let query = supabase
      .from('time_entries')
      .select(
        `
        *,
        employee:employees(
          id,
          employee_number,
          profile:profiles(full_name, email)
        )
      `
      )
      .order('entry_date', { ascending: false });

    if (employeeId) query = query.eq('employee_id', employeeId);
    if (start) query = query.gte('entry_date', start);
    if (end) query = query.lte('entry_date', end);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ timeEntries: data });
  } catch (error) { 
    logger.error(
      'Error fetching time entries:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch time entries' },
      { status: 500 }
    );
  }
}

// POST /api/hr/time-entries
// Body: { employee_id, entry_date, clock_in, clock_out, ... }
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await parseBody<Record<string, any>>(request);

    const {
      employee_id,
      entry_date,
      clock_in,
      clock_out,
      break_minutes = 0,
      lunch_minutes = 0,
      notes,
    } = body;

    if (!employee_id || !entry_date) {
      return NextResponse.json(
        { error: 'Missing required fields: employee_id, entry_date' },
        { status: 400 }
      );
    }

    // Compute hours if clock_in/out provided
    let regular_hours = 0;
    if (clock_in && clock_out) {
      const start = new Date(clock_in).getTime();
      const end = new Date(clock_out).getTime();
      const diffMs = end - start;
      const diffHours = diffMs / 1000 / 60 / 60;
      regular_hours = Math.max(
        0,
        diffHours - (break_minutes + lunch_minutes) / 60
      );
    }

    const { data, error }: any = await supabase
      .from('time_entries')
      .insert({
        employee_id,
        entry_date,
        clock_in,
        clock_out,
        break_minutes,
        lunch_minutes,
        regular_hours,
        total_hours: regular_hours,
        status: 'pending',
        notes,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ timeEntry: data }, { status: 201 });
  } catch (error) { 
    logger.error(
      'Error creating time entry:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create time entry' },
      { status: 500 }
    );
  }
}
