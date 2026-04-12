import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { resolveLessonOjt } from '@/lib/ojt/resolveLessonOjt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const { lessonId } = await params;
    const body = await request.json().catch(() => ({}));
    const { notes, supervisorName, serviceCount, courseId } = body;

    const db = await getAdminClient();

    const lesson = await resolveLessonOjt(db, lessonId);
    if (!lesson) return safeError('Lesson not found', 404);
    if (lesson.lesson_type !== 'lab') return safeError('This lesson does not require OJT logging', 400);
    if (!lesson.required_skill_id) return safeError('No skill requirement configured for this lesson', 400);

    // Resolve program_id from enrollment
    const { data: enrollment } = await db
      .from('program_enrollments')
      .select('program_id')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id ?? courseId)
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed'])
      .maybeSingle();

    const count = Math.min(Math.max(1, parseInt(serviceCount) || 1), 20);

    const { error: insertErr } = await db
      .from('competency_log')
      .insert({
        apprentice_id: user.id,
        skill_id: lesson.required_skill_id,
        program_id: enrollment?.program_id ?? null,
        work_date: new Date().toISOString().split('T')[0],
        service_count: count,
        hours_credited: 0,
        notes: notes ?? null,
        supervisor_name: supervisorName ?? null,
        supervisor_verified: false,
        status: 'pending',
      });

    if (insertErr) return safeDbError(insertErr, 'Failed to log attempt');

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'OJT log failed');
  }
}
