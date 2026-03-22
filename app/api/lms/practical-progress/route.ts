import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lms/practical-progress?course_id=&lesson_id=
 * Returns the learner's practical progress for a lesson.
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
    .from('student_practical_progress')
    .select('accumulated_hours, approved_attempts, status, last_updated_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to fetch practical progress');
  return NextResponse.json({ progress: data ?? null });
}

/**
 * PATCH /api/lms/practical-progress
 * Admin/instructor logs hours for a learner's practical lesson.
 */
export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  let body: Record<string, any>;
  try { body = await request.json(); }
  catch { return safeError('Invalid JSON', 400); }

  const { user_id, course_id, lesson_id, hours_to_add } = body;
  if (!user_id || !course_id || !lesson_id) return safeError('user_id, course_id, lesson_id required', 400);
  if (typeof hours_to_add !== 'number' || hours_to_add <= 0) return safeError('hours_to_add must be a positive number', 400);

  const db = createAdminClient();

  const { data: existing } = await db
    .from('student_practical_progress')
    .select('id, accumulated_hours, approved_attempts')
    .eq('user_id', user_id)
    .eq('lesson_id', lesson_id)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await db
      .from('student_practical_progress')
      .update({
        accumulated_hours: (existing.accumulated_hours ?? 0) + hours_to_add,
        status:            'in_progress',
        last_updated_at:   new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return safeDbError(error, 'Failed to update progress');
    return NextResponse.json({ progress: updated });
  } else {
    const { data: created, error } = await db
      .from('student_practical_progress')
      .insert({ user_id, course_id, lesson_id, accumulated_hours: hours_to_add, approved_attempts: 0, status: 'in_progress' })
      .select()
      .single();
    if (error) return safeDbError(error, 'Failed to create progress');
    return NextResponse.json({ progress: created }, { status: 201 });
  }
}
