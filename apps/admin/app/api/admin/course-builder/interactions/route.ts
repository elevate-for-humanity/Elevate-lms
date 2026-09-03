import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { CourseExperienceSchema } from '@/lib/course-factory/experience-contract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const lessonId = req.nextUrl.searchParams.get('lessonId');
  if (!lessonId) return safeError('lessonId is required', 400);
  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('course_lessons')
      .select(
        'id,title,slug,content,content_json,practical_required,requires_instructor_signoff,competency_checks',
      )
      .eq('id', lessonId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return safeError('Lesson not found', 404);
    const contentJson =
      data.content_json && typeof data.content_json === 'object'
        ? (data.content_json as Record<string, unknown>)
        : {};
    const content =
      data.content && typeof data.content === 'object'
        ? (data.content as Record<string, unknown>)
        : {};
    return NextResponse.json({
      ok: true,
      lesson: data,
      experience: contentJson.experience ?? content.experience ?? {},
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load interactions');
  }
}

export async function PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body?.lessonId) return safeError('lessonId is required', 400);
  const parsed = CourseExperienceSchema.safeParse(body.experience ?? {});
  if (!parsed.success) return safeError('Invalid lesson experience', 400);
  try {
    const db = await requireAdminClient();
    const { data: existing, error: loadError } = await db
      .from('course_lessons')
      .select('content_json')
      .eq('id', body.lessonId)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!existing) return safeError('Lesson not found', 404);
    const current =
      existing.content_json && typeof existing.content_json === 'object'
        ? (existing.content_json as Record<string, unknown>)
        : {};
    const experience = parsed.data;
    const practicalRequired = !!experience.practicalTask;
    const update = {
      content_json: { ...current, experience },
      ...(experience.content
        ? { content: experience.content, rendered_html: experience.content }
        : {}),
      practical_required: body.practicalRequired ?? practicalRequired,
      requires_instructor_signoff: body.requiresInstructorSignoff ?? practicalRequired,
      competency_checks: body.competencyChecks ?? experience.knowledgeChecks ?? undefined,
      generation_status: 'generated',
      ai_generated: true,
      last_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db
      .from('course_lessons')
      .update(update)
      .eq('id', body.lessonId)
      .select(
        'id,title,content_json,practical_required,requires_instructor_signoff,competency_checks',
      )
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, lesson: data, experience });
  } catch (error) {
    return safeInternalError(error, 'Failed to save interactions');
  }
}
