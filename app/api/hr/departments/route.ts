import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/hr/departments - List all departments
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: departments, error } = await supabase
      .from('departments')
      .select(
        `
        *,
        manager:profiles!manager_id(*),
        parent:departments!parent_department_id(id, name, code),
        employee_count:employees(count)
      `
      )
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ departments });
  } catch (error) { 
    logger.error(
      'Error fetching departments:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST /api/hr/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await parseBody<Record<string, any>>(request);

    const {
      name,
      code,
      description,
      parent_department_id,
      manager_id,
      cost_center,
      budget,
    } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code' },
        { status: 400 }
      );
    }

    const { data: department, error } = await supabase
      .from('departments')
      .insert({
        name,
        code,
        description,
        parent_department_id,
        manager_id,
        cost_center,
        budget,
      })
      .select(
        `
        *,
        manager:profiles!manager_id(*),
        parent:departments!parent_department_id(id, name, code)
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) { 
    logger.error(
      'Error creating department:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create department' },
      { status: 500 }
    );
  }
}
