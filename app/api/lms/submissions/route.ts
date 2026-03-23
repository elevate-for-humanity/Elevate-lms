import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/lms/submissions
 *
 * Learner submits a lab or assignment for instructor sign-off.
 * Creates a step_submissions row with status='submitted'.
 *
 * Body: { course_lesson_id, course_id, step_type, submission_text?, file_urls? }
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard();
  if (!auth.authorized || !auth.user) return safeError(auth.error ?? 'Unauthorized', 401);
  const { user } = auth;

  let body: {
    course_lesson_id: string;
    course_id: string;
    step_type: string;
    submission_text?: string;
    file_urls?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { course_lesson_id, course_id, step_type, submission_text, file_urls } = body;

  if (!course_lesson_id || !course_id || !step_type) {
    return safeError('course_lesson_id, course_id, and step_type are required', 400);
  }

  const SIGN_OFF_TYPES = ['lab', 'assignment'];
  if (!SIGN_OFF_TYPES.includes(step_type)) {
    return safeError('step_type must be lab or assignment', 400);
  }

  if (!submission_text?.trim() && (!file_urls || file_urls.length === 0)) {
    return safeError('submission_text or file_urls is required', 400);
  }

  const db = createAdminClient();

  // Verify the lesson exists and belongs to the course
  const { data: lesson, error: lessonErr } = await db
    .from('course_lessons')
    .select('id, lesson_type, course_id')
    .eq('id', course_lesson_id)
    .eq('course_id', course_id)
    .single();

  if (lessonErr || !lesson) {
    return safeError('Lesson not found', 404);
  }

  if (!SIGN_OFF_TYPES.includes(lesson.lesson_type)) {
    return safeError('This lesson does not accept submissions', 400);
  }

  // Verify learner is enrolled
  const { data: enrollment } = await db
    .from('training_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course_id)
    .eq('status', 'active')
    .maybeSingle();

  if (!enrollment) {
    return safeError('Not enrolled in this course', 403);
  }

  // Insert submission — upsert not used because each attempt is a new row
  const { data: submission, error: insertErr } = await db
    .from('step_submissions')
    .insert({
      user_id:          user.id,
      course_lesson_id,
      course_id,
      step_type,
      submission_text:  submission_text?.trim() || null,
      file_urls:        file_urls ?? [],
      status:           'submitted',
      updated_at:       new Date().toISOString(),
    })
    .select('id, status, created_at')
    .single();

  if (insertErr) return safeDbError(insertErr, 'Failed to create submission');

  return NextResponse.json({ submission }, { status: 201 });
}

/**
 * GET /api/lms/submissions?course_id=&course_lesson_id=
 *
 * Returns the learner's own submissions for a lesson.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard();
  if (!auth.authorized || !auth.user) return safeError(auth.error ?? 'Unauthorized', 401);
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const course_id        = searchParams.get('course_id');
  const course_lesson_id = searchParams.get('course_lesson_id');

  if (!course_id) return safeError('course_id is required', 400);

  const db = createAdminClient();

  let query = db
    .from('step_submissions')
    .select('id, course_lesson_id, step_type, submission_text, file_urls, status, instructor_note, reviewed_at, created_at')
    .eq('user_id', user.id)
    .eq('course_id', course_id)
    .order('created_at', { ascending: false });

  if (course_lesson_id) query = query.eq('course_lesson_id', course_lesson_id);

  const { data, error } = await query;
  if (error) return safeDbError(error, 'Failed to fetch submissions');

  return NextResponse.json({ submissions: data ?? [] });
}
