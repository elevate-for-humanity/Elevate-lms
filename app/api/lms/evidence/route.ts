import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const VALID_MODES = ['text', 'file', 'image', 'video', 'audio', 'url'] as const;

/**
 * GET /api/lms/evidence?course_id=&lesson_id=
 * Returns the learner's evidence submissions for a lesson.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('course_id');
  const lessonId = searchParams.get('lesson_id');

  if (!courseId || !lessonId) return safeError('course_id and lesson_id required', 400);

  const db = createAdminClient();
  const { data, error } = await db
    .from('student_lesson_evidence')
    .select('id, submission_mode, body_text, file_url, media_url, external_url, status, evaluator_notes, submitted_at, reviewed_at, attempt_number')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .order('submitted_at', { ascending: false });

  if (error) return safeDbError(error, 'Failed to fetch evidence');
  return NextResponse.json({ evidence: data ?? [] });
}

/**
 * POST /api/lms/evidence
 * Learner submits evidence for a practical lesson.
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  let body: Record<string, any>;
  try { body = await request.json(); }
  catch { return safeError('Invalid JSON', 400); }

  const { lesson_id, course_id, submission_mode, body_text, file_url, media_url, external_url } = body;

  if (!lesson_id || !course_id) return safeError('lesson_id and course_id required', 400);
  if (!submission_mode || !VALID_MODES.includes(submission_mode)) {
    return safeError(`submission_mode must be one of: ${VALID_MODES.join(', ')}`, 400);
  }
  if (!body_text?.trim() && !file_url && !media_url && !external_url) {
    return safeError('At least one of body_text, file_url, media_url, or external_url is required', 400);
  }

  const db = createAdminClient();

  // Verify enrollment
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'enrolled', 'approved'])
    .maybeSingle();

  if (!enrollment) return safeError('You must be enrolled to submit evidence', 403);

  // Verify lesson exists and requires evidence
  const { data: lesson } = await db
    .from('course_lessons')
    .select('id, requires_evidence, course_id')
    .eq('id', lesson_id)
    .eq('course_id', course_id)
    .maybeSingle();

  if (!lesson) return safeError('Lesson not found', 404);
  if (!lesson.requires_evidence) return safeError('This lesson does not require evidence submission', 400);

  // Get attempt number
  const { count } = await db
    .from('student_lesson_evidence')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('lesson_id', lesson_id);

  const attemptNumber = (count ?? 0) + 1;

  const { data: newEvidence, error: insertErr } = await db
    .from('student_lesson_evidence')
    .insert({
      user_id:         user.id,
      course_id,
      lesson_id,
      submission_mode,
      body_text:       body_text?.trim() || null,
      file_url:        file_url || null,
      media_url:       media_url || null,
      external_url:    external_url || null,
      status:          'submitted',
      attempt_number:  attemptNumber,
    })
    .select()
    .single();

  if (insertErr) return safeDbError(insertErr, 'Failed to submit evidence');

  return NextResponse.json({ evidence: newEvidence }, { status: 201 });
}
