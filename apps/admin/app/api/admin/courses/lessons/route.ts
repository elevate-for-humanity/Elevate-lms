import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { AdminAction, logAdminAudit } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const courseId = req.nextUrl.searchParams.get('courseId') || '';
    if (!courseId) return safeError('courseId is required', 400);

    const { data, error } = await db
      .from('course_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (error) return safeError('Failed to fetch lessons', 400);

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const body = await req.json();

    // Derive next order_index if not provided
    let orderIndex = body.order_index ?? 0;
    if (orderIndex === 0 && body.course_id) {
      const { count } = await db
        .from('course_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', body.course_id);
      orderIndex = (count ?? 0);
    }

    const payload = {
      course_id: body.course_id,
      module_id: body.module_id ?? null,
      title: body.title,
      content: body.content ?? null,
      video_url: body.video_url ?? null,
      duration_minutes: body.duration_minutes ?? null,
      order_index: orderIndex,
      lesson_type: body.lesson_type ?? body.step_type ?? 'lesson',
      is_published: body.is_published ?? false,
    };

    const { data, error } = await db.from('course_lessons').insert(payload).select('*').single();
    if (error) return safeError(`Failed to create lesson: ${error.message}`, 400);

    await logAdminAudit({
      action: AdminAction.LESSON_CREATED,
      actorId: auth.id,
      entityType: 'course_lessons',
      entityId: data.id,
      metadata: { course_id: payload.course_id },
    });

    return NextResponse.json({ data });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

async function _PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const body = await req.json();
    const id = String(body.id || '').trim();
    if (!id) return safeError('Lesson id is required', 400);

    const payload: Record<string, unknown> = {
      title: body.title,
      content: body.content ?? null,
      video_url: body.video_url ?? null,
      duration_minutes: body.duration_minutes ?? null,
      order_index: body.order_index ?? 0,
      updated_at: new Date().toISOString(),
    };
    if (body.lesson_type !== undefined) payload.lesson_type = body.lesson_type;
    if (body.module_id !== undefined) payload.module_id = body.module_id;
    if (body.is_published !== undefined) payload.is_published = body.is_published;

    const { data, error } = await db.from('course_lessons').update(payload).eq('id', id).select('*').single();
    if (error) return safeError(`Failed to update lesson: ${error.message}`, 400);

    await logAdminAudit({
      action: AdminAction.LESSON_UPDATED,
      actorId: auth.id,
      entityType: 'course_lessons',
      entityId: id,
      metadata: { title: String(payload.title) },
    });

    return NextResponse.json({ data });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

async function _PUT(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const body = await req.json();
    const lessonA = body.lessonA as { id: string; order_index: number };
    const lessonB = body.lessonB as { id: string; order_index: number };
    if (!lessonA?.id || !lessonB?.id) return safeError('Reorder payload is required', 400);

    const { error: errA } = await db.from('course_lessons').update({ order_index: lessonA.order_index }).eq('id', lessonA.id);
    if (errA) return safeError('Failed to reorder lessons', 400);
    const { error: errB } = await db.from('course_lessons').update({ order_index: lessonB.order_index }).eq('id', lessonB.id);
    if (errB) return safeError('Failed to reorder lessons', 400);

    await logAdminAudit({
      action: AdminAction.LESSON_UPDATED,
      actorId: auth.id,
      entityType: 'course_lessons',
      entityId: lessonA.id,
      metadata: { operation: 'reorder', paired_lesson_id: lessonB.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

async function _DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const body = await req.json();
    const id = String(body.id || '').trim();
    if (!id) return safeError('Lesson id is required', 400);

    const { error } = await db.from('course_lessons').delete().eq('id', id);
    if (error) return safeError(`Failed to delete lesson: ${error.message}`, 400);

    await logAdminAudit({
      action: AdminAction.LESSON_DELETED,
      actorId: auth.id,
      entityType: 'course_lessons',
      entityId: id,
      metadata: {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

export const GET = withApiAudit('/api/admin/courses/lessons', _GET);
export const POST = withApiAudit('/api/admin/courses/lessons', _POST);
export const PATCH = withApiAudit('/api/admin/courses/lessons', _PATCH);
export const PUT = withApiAudit('/api/admin/courses/lessons', _PUT);
export const DELETE = withApiAudit('/api/admin/courses/lessons', _DELETE);
