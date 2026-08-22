import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function forwardCourseBuilder(req: NextRequest, body: Record<string, unknown>) {
  const url = new URL('/api/admin/course-builder', req.url);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const cookie = req.headers.get('cookie');
  const authorization = req.headers.get('authorization');
  if (cookie) headers.set('cookie', cookie);
  if (authorization) headers.set('authorization', authorization);
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
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
    const body = await req.json();
    const courseId = String(body.course_id || '').trim();
    const title = String(body.title || '').trim();
    if (!courseId || !title) return safeError('course_id and title are required', 400);

    const { data: firstModule, error: moduleError } = await db
      .from('course_modules')
      .select('id')
      .eq('course_id', courseId)
      .order('order_index')
      .limit(1)
      .maybeSingle();
    if (moduleError) return safeError('Failed to resolve course module', 400);
    const moduleId = String(body.module_id || firstModule?.id || '').trim();
    if (!moduleId) return safeError('Create a course module before adding lessons', 409);

    let orderIndex = Number.isInteger(body.order_index) ? body.order_index : 0;
    if (!Number.isInteger(body.order_index)) {
      const { count } = await db
        .from('course_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId);
      orderIndex = count ?? 0;
    }
    const slug = String(body.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `lesson-${orderIndex + 1}`;
    const rawType = String(body.lesson_type ?? body.step_type ?? 'lesson');
    const lessonType = ['lesson','video','reading','quiz','assignment','practical','checkpoint','exam','live_session','fieldwork','observation'].includes(rawType)
      ? rawType
      : 'lesson';
    const contentText = typeof body.content === 'string' ? body.content : '';

    const response = await forwardCourseBuilder(req, {
      action: 'save-lesson',
      lesson: {
        courseId,
        moduleId,
        slug,
        title,
        orderIndex,
        lessonType,
        durationMinutes: Math.max(1, Number(body.duration_minutes) || 15),
        learningObjectives: Array.isArray(body.learning_objectives) && body.learning_objectives.length
          ? body.learning_objectives
          : [`Apply the concepts and procedures introduced in ${title}.`],
        content: { html: contentText },
        renderedHtml: contentText || null,
        videoUrl: body.video_url || null,
        isRequired: true,
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json(result, { status: response.status });
    return NextResponse.json({ data: result.lesson });
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
    const body = await req.json();
    const lessonId = String(body.id || '').trim();
    if (!lessonId) return safeError('Lesson id is required', 400);
    const response = await forwardCourseBuilder(req, {
      action: 'patch-lesson',
      lesson: {
        lessonId,
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.video_url !== undefined ? { video_url: body.video_url } : {}),
        ...(body.lesson_type !== undefined ? { step_type: body.lesson_type } : {}),
        ...(body.duration_minutes !== undefined ? { duration_minutes: body.duration_minutes } : {}),
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json(result, { status: response.status });
    return NextResponse.json({ data: result.lesson });
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
    const body = await req.json();
    const lessonA = body.lessonA as { id?: string; order_index?: number };
    const lessonB = body.lessonB as { id?: string; order_index?: number };
    if (!lessonA?.id || !lessonB?.id) return safeError('Reorder payload is required', 400);
    const { data: lesson, error } = await db
      .from('course_lessons')
      .select('course_id')
      .eq('id', lessonA.id)
      .maybeSingle();
    if (error || !lesson?.course_id) return safeError('Unable to resolve course for reorder', 400);

    const response = await forwardCourseBuilder(req, {
      action: 'reorder-lessons',
      courseId: lesson.course_id,
      lessonA: { id: lessonA.id, orderIndex: Number(lessonA.order_index) },
      lessonB: { id: lessonB.id, orderIndex: Number(lessonB.order_index) },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json(result, { status: response.status });
    return NextResponse.json({ success: true, data: result.result });
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
    const body = await req.json();
    const lessonId = String(body.id || '').trim();
    if (!lessonId) return safeError('Lesson id is required', 400);
    const response = await forwardCourseBuilder(req, {
      action: 'delete-lesson',
      lesson: { lessonId },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json(result, { status: response.status });
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
