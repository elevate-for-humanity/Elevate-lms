import { loadLearnerCourseIds } from '@/lib/lms/learner-course-ids';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// GET /api/assignments - Fetch assignments for enrolled courses
async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const db = await requireAdminClient();
    const courseIds = await loadLearnerCourseIds(db, user.id, true);
    if (courseId && !courseIds.includes(courseId))
      return NextResponse.json({ error: 'Course enrollment required.' }, { status: 403 });
    const allowedIds = courseId ? [courseId] : courseIds;
    if (!allowedIds.length)
      return NextResponse.json(
        { assignments: [] },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    const [
      { data: rows, error: assignmentError },
      { data: submissions, error: submissionError },
      { data: courses, error: courseError },
    ] = await Promise.all([
      db
        .from('assignments')
        .select('id,course_id,title,description,due_date,max_points,submission_type')
        .in('course_id', allowedIds)
        .order('due_date'),
      db
        .from('assignment_submissions')
        .select('id,assignment_id,status,grade,submitted_at')
        .or(`user_id.eq.${user.id},student_id.eq.${user.id}`),
      db.from('courses').select('id,title').in('id', allowedIds),
    ]);
    if (assignmentError) throw assignmentError;
    if (submissionError) throw submissionError;
    if (courseError) throw courseError;
    const assignments = (rows || []).map((row) => ({
      ...row,
      points_possible: row.max_points,
      courses: (courses || []).find((course) => course.id === row.course_id) || null,
      assignment_submissions: (submissions || [])
        .filter((submission) => submission.assignment_id === row.id)
        .map((submission) => ({ ...submission, score: submission.grade })),
    }));
    return NextResponse.json(
      { assignments },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    logger.error(
      'Error in GET /api/assignments',
      normalizeError(error, 'Failed to fetch assignments'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/assignments - Create new assignment (admin/instructor only)
async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user || !['admin', 'instructor'].includes(user.profile?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { courseId, title, description, instructions, dueDate, pointsPossible, submissionType } =
      body;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, title' },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Assignment service unavailable' }, { status: 503 });
    }

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
      .maybeSingle();

    if (error) {
      logger.error(
        'Error creating assignment',
        normalizeError(error, 'Failed to create assignment'),
        getErrorContext(error),
      );
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    logger.error(
      'Error in POST /api/assignments',
      normalizeError(error, 'Failed to create assignment'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/assignments', _GET);
export const POST = withApiAudit('/api/assignments', _POST);
