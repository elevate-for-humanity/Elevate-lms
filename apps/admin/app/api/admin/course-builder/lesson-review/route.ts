import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  approved: z.boolean(),
});

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const courseId = request.nextUrl.searchParams.get('courseId');
  if (!courseId) return safeError('courseId is required', 400);

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('course_lessons')
      .select('id,title,slug,lesson_type,order_index,status,is_published,approved,content,content_json,learning_objectives,passing_score,video_url')
      .eq('course_id', courseId)
      .order('order_index');
    if (error) throw error;

    const lessons = data ?? [];
    return NextResponse.json({
      ok: true,
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        lesson_type: lesson.lesson_type,
        order_index: lesson.order_index,
        status: lesson.status,
        is_published: lesson.is_published,
        approved: Boolean(lesson.approved),
        has_content: Boolean(String(lesson.content ?? '').trim()) || Boolean(lesson.content_json),
        has_objectives: Array.isArray(lesson.learning_objectives) && lesson.learning_objectives.length > 0,
        has_passing_score: !['quiz', 'checkpoint', 'exam'].includes(lesson.lesson_type ?? '') || lesson.passing_score != null,
        has_video: Boolean(lesson.video_url),
      })),
      total: lessons.length,
      approved: lessons.filter((lesson) => lesson.approved).length,
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load lesson review status');
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid lesson review request', 400);

  try {
    const db = await requireAdminClient();
    const { data: lesson, error: loadError } = await db
      .from('course_lessons')
      .select('id,title,lesson_type,content,content_json,learning_objectives,passing_score')
      .eq('id', parsed.data.lessonId)
      .eq('course_id', parsed.data.courseId)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!lesson) return safeError('Lesson not found', 404);

    if (parsed.data.approved) {
      const blockers: string[] = [];
      if (!String(lesson.content ?? '').trim() && !lesson.content_json) blockers.push('Lesson has no instructional content.');
      if (!Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length === 0) blockers.push('Lesson has no learning objectives.');
      if (['quiz', 'checkpoint', 'exam'].includes(lesson.lesson_type ?? '') && lesson.passing_score == null) blockers.push('Assessment lesson has no passing score.');
      if (blockers.length) {
        return NextResponse.json({ ok: false, error: 'Lesson cannot be approved until review blockers are resolved.', blockers }, { status: 409 });
      }
    }

    const { error } = await db
      .from('course_lessons')
      .update({ approved: parsed.data.approved, updated_at: new Date().toISOString() })
      .eq('id', lesson.id);
    if (error) throw error;

    await logAdminAudit({
      action: AdminAction.COURSE_SEED_RUN,
      actorId: auth.id,
      entityType: 'course_lessons',
      entityId: lesson.id,
      metadata: { operation: parsed.data.approved ? 'lesson.approved' : 'lesson.approval_revoked', courseId: parsed.data.courseId, title: lesson.title },
      req: request,
    });

    return NextResponse.json({ ok: true, lessonId: lesson.id, approved: parsed.data.approved });
  } catch (error) {
    return safeInternalError(error, 'Failed to update lesson approval');
  }
}
