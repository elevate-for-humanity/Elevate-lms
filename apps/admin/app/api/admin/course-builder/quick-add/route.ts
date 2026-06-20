/**
 * POST /api/admin/course-builder/quick-add
 *
 * Lightweight endpoint for the LiveCourseBuilder sidebar.
 * Creates a module or lesson with minimal required fields.
 *
 * Body (module):  { type: 'module', courseId, title }
 * Body (lesson):  { type: 'lesson', courseId, moduleId, title, stepType? }
 *
 * Returns the created row so the UI can update state immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

function slugify(title: string, suffix?: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) +
    '-' +
    Date.now().toString(36)
  );
}

const ModuleSchema = z.object({
  type: z.literal('module'),
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
});

const LessonSchema = z.object({
  type: z.literal('lesson'),
  courseId: z.string().uuid(),
  moduleId: z.string().uuid(),
  title: z.string().min(1).max(200),
  stepType: z
    .enum(['lesson', 'quiz', 'checkpoint', 'lab', 'assignment', 'exam', 'certification'])
    .default('lesson'),
});

const BodySchema = z.discriminatedUnion('type', [ModuleSchema, LessonSchema]);

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid input', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);
  const body = parsed.data;

  if (body.type === 'module') {
    // Get current max order_index for this course
    const { data: existing } = await db
      .from('course_modules')
      .select('order_index')
      .eq('course_id', body.courseId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = ((existing?.[0]?.order_index ?? 0) as number) + 1;

    const { data, error } = await db
      .from('course_modules')
      .insert({
        course_id: body.courseId,
        title: body.title,
        slug: slugify(body.title),
        order_index: nextOrder,
      })
      .select('id, title, slug, order_index')
      .single();

    if (error) return safeInternalError(error, 'Failed to create module');
    // Return with module_order key so LiveCourseBuilder state stays consistent
    return NextResponse.json({ ok: true, module: { ...data, module_order: data.order_index } });
  }

  // Lesson
  const { data: existing } = await db
    .from('course_lessons')
    .select('order_index')
    .eq('module_id', body.moduleId)
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrder = ((existing?.[0]?.order_index ?? 0) as number) + 1;

  const { data, error } = await db
    .from('course_lessons')
    .insert({
      course_id: body.courseId,
      module_id: body.moduleId,
      title: body.title,
      slug: slugify(body.title),
      order_index: nextOrder,
      lesson_type: body.stepType,
      status: 'draft',
      content: '',
    })
    .select(
      'id, title, slug, order_index, lesson_type, content, video_url, duration_minutes, passing_score, status',
    )
    .single();

  if (error) return safeInternalError(error, 'Failed to create lesson');

  return NextResponse.json({
    ok: true,
    lesson: {
      id: data.id,
      title: data.title,
      slug: data.slug,
      lesson_order: data.order_index,
      step_type: data.lesson_type ?? 'lesson',
      content: data.content ?? '',
      video_url: data.video_url ?? '',
      duration_minutes: data.duration_minutes,
      passing_score: data.passing_score,
      status: data.status ?? 'draft',
    },
  });
}
