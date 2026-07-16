/**
 * Evaluation Tasks API
 * CRUD operations for evaluation task definitions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { evaluationTaskService, validateTaskDefinition } from '@/lib/evaluation/service';
import type { PaginationParams, FilterParams } from '@/lib/evaluation/types';

const supabase = createPublicClient()
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// GET /api/evaluation/tasks - List tasks
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const pagination: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const filters: FilterParams = {
      status: searchParams.get('status')?.split(',') as FilterParams['status'],
      domain: searchParams.get('domain')?.split(','),
      category: searchParams.get('category')?.split(','),
      tags: searchParams.get('tags')?.split(','),
      createdBy: searchParams.get('createdBy') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    };

    const { tasks, total } = await evaluationTaskService.list(pagination, filters);

    return NextResponse.json({
      success: true,
      data: tasks,
      meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) },
    });
  } catch (error) {
    console.error('Error listing tasks:', error);
    return NextResponse.json({ success: false, error: { code: 'LIST_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}

// ============================================================================
// POST /api/evaluation/tasks - Create task
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authorization required' } }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const errors = validateTaskDefinition(body);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.join(', ') } }, { status: 400 });
    }

    const task = await evaluationTaskService.create(body, userId);
    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ success: false, error: { code: 'CREATE_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
