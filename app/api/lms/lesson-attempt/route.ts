/**
 * POST /api/lms/lesson-attempt
 *
 * Records a quiz attempt for a lesson. Called by TrainingLessonFlow after
 * every quiz submission — pass or fail.
 *
 * Body: { lessonId, courseId, score, attemptNumber, answers }
 *
 * Returns: { id, passed, score, attemptNumber }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  let body: {
    lessonId?: string;
    courseId?: string;
    score?: number;
    attemptNumber?: number;
    answers?: Record<string, number>;
  };

  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const { lessonId, courseId, score, attemptNumber = 1, answers } = body;

  if (!lessonId || !courseId || score === undefined) {
    return safeError('lessonId, courseId, and score are required', 400);
  }

  if (typeof score !== 'number' || score < 0 || score > 100) {
    return safeError('score must be an integer 0–100', 400);
  }

  // Verify the lesson belongs to the course (prevents cross-course injection)
  const { data: lesson, error: lessonErr } = await supabase
    .from('course_lessons')
    .select('id, course_id')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .single();

  if (lessonErr || !lesson) {
    return safeError('Lesson not found in this course', 404);
  }

  const { data: attempt, error: insertErr } = await supabase
    .from('user_lesson_attempts')
    .insert({
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      score: Math.round(score),
      attempt_number: attemptNumber,
      answers: answers ?? null,
    })
    .select('id, score, passed, attempt_number')
    .single();

  if (insertErr) return safeDbError(insertErr, 'Failed to record attempt');

  return NextResponse.json({
    id: attempt.id,
    passed: attempt.passed,
    score: attempt.score,
    attemptNumber: attempt.attempt_number,
  });
}

/**
 * GET /api/lms/lesson-attempt?lessonId=&courseId=
 *
 * Returns the learner's best attempt for a lesson.
 * Used on page load to restore passed state without re-querying lesson_progress.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lessonId');
  const courseId = searchParams.get('courseId');

  if (!lessonId || !courseId) {
    return safeError('lessonId and courseId are required', 400);
  }

  const { data: attempts, error } = await supabase
    .from('user_lesson_attempts')
    .select('id, score, passed, attempt_number, created_at')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) return safeDbError(error, 'Failed to fetch attempts');

  const best = attempts?.find(a => a.passed) ?? attempts?.[0] ?? null;

  return NextResponse.json({
    hasPassed: attempts?.some(a => a.passed) ?? false,
    bestScore: best?.score ?? null,
    totalAttempts: attempts?.length ?? 0,
    latestAttempt: best,
  });
}
