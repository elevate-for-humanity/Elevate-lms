export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

// GET /api/assignments - Fetch assignments for enrolled courses
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('assignments')
      .select(
        `
        id,
        title,
        description,
        due_date,
        points_possible,
        submission_type,
        courses (
          id,
          title
        ),
        assignment_submissions!left (
          id,
          status,
          score,
          submitted_at
        )
      `
      )
      .order('due_date', { ascending: true });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: assignments, error } = await query;

    if (error) {
      logger.error('Error fetching assignments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignments });
  } catch (error) { /* Error handled silently */ 
    logger.error('Error in GET /api/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/assignments - Create new assignment (admin/instructor only)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['admin', 'instructor'].includes(user.profile?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const {
      courseId,
      title,
      description,
      instructions,
      dueDate,
      pointsPossible,
      submissionType,
    } = body;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, title' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        course_id: courseId,
        title,
        description,
        instructions,
        due_date: dueDate,
        points_possible: pointsPossible || 100,
        submission_type: submissionType || 'text',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating assignment:', error);
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) { /* Error handled silently */ 
    logger.error('Error in POST /api/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
