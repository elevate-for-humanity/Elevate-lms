/**
 * POST /api/admin/courses/[courseId]/clone
 *
 * Clones a course (course_modules + course_lessons) into a new draft course.
 * Does not clone enrollments, progress, or certificates.
 *
 * Body (optional): { title?: string; slug?: string }
 * Returns: { ok, course: { id, slug, title } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const body = await request.json().catch(() => ({}));

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // ── Load source course ────────────────────────────────────────────────────

  const { data: src, error: srcErr } = await db
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  if (srcErr) return safeInternalError(srcErr, 'Failed to load source course');
  if (!src) return safeError('Course not found', 404);

  // ── Resolve unique slug ───────────────────────────────────────────────────

  const newTitle = (body.title as string | undefined)?.trim() || `${src.title} (Copy)`;
  const baseSlug = (body.slug as string | undefined)?.trim() || `${src.slug}-copy`;

  let newSlug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data: existing } = await db
      .from('courses')
      .select('id')
      .eq('slug', newSlug)
      .maybeSingle();
    if (!existing) break;
    attempt++;
    newSlug = `${baseSlug}-${attempt}`;
  }

  // ── Clone courses row ─────────────────────────────────────────────────────

  const {
    id: _id,
    created_at: _ca,
    updated_at: _ua,
    slug: _slug,
    title: _title,
    status: _status,
    ...rest
  } = src;

  const { data: newCourse, error: courseErr } = await db
    .from('courses')
    .insert({
      ...rest,
      title: newTitle,
      slug: newSlug,
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .select('id, slug, title')
    .single();

  if (courseErr) return safeInternalError(courseErr, 'Failed to create course clone');

  const newCourseId = newCourse.id;
  const errors: string[] = [];

  // ── Clone course_modules + course_lessons ─────────────────────────────────

  const { data: modules } = await db
    .from('course_modules')
    .select('*, course_lessons(*)')
    .eq('course_id', courseId)
    .order('order_index');

  for (const mod of modules ?? []) {
    const { course_lessons: lessons, id: _mid, course_id: _cid, ...modRest } = mod as any;

    const { data: newMod, error: modErr } = await db
      .from('course_modules')
      .insert({ ...modRest, course_id: newCourseId })
      .select('id')
      .single();

    if (modErr || !newMod) {
      errors.push(`module '${mod.title}': ${modErr?.message}`);
      continue;
    }

    if (lessons?.length) {
      const { error: lessonErr } = await db.from('course_lessons').insert(
        lessons.map(({ id: _, course_id: __, course_module_id: ___, ...l }: any) => ({
          ...l,
          course_id: newCourseId,
          course_module_id: newMod.id,
          // Reset publish state on clone — admin must explicitly re-publish.
          status: 'draft',
          is_published: false,
        })),
      );
      if (lessonErr) errors.push(`lessons in '${mod.title}': ${lessonErr.message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    course: { id: newCourseId, slug: newSlug, title: newTitle },
    ...(errors.length ? { warnings: errors } : {}),
  });
}
