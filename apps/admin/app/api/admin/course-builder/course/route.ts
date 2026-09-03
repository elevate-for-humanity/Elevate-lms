import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const courseId = req.nextUrl.searchParams.get('courseId');
  if (!courseId) return safeError('courseId is required', 400);

  try {
    const db = await requireAdminClient();
    const { data: course, error: courseError } = await db.from('courses').select('id,title,slug,description,status,program_id,duration_hours,passing_score,review_status,compliance_profile_key,governing_body,governing_region,governing_standard_version').eq('id', courseId).maybeSingle();
    if (courseError) throw courseError;
    if (!course) return safeError('Course not found', 404);

    const { data: modules, error: moduleError } = await db.from('course_modules').select('id,title,slug,order_index,target_hours,domain_key,is_published,is_draft').eq('course_id', courseId).order('order_index');
    if (moduleError) throw moduleError;
    const moduleIds = (modules ?? []).map((m) => m.id);
    let lessons: any[] = [];
    if (moduleIds.length) {
      const { data, error } = await db.from('course_lessons').select('id,course_id,module_id,title,slug,order_index,lesson_type,content,video_url,duration_minutes,passing_score,status,learning_objectives,practical_required,requires_instructor_signoff,competency_checks,hour_category,minimum_seat_time_minutes').in('module_id', moduleIds).order('order_index');
      if (error) throw error;
      lessons = data ?? [];
    }

    const mappedModules = (modules ?? []).map((mod) => ({
      id: mod.id,
      title: mod.title,
      slug: mod.slug,
      module_order: mod.order_index,
      target_hours: mod.target_hours,
      domain_key: mod.domain_key,
      is_published: mod.is_published,
      is_draft: mod.is_draft,
      lessons: lessons.filter((lesson) => lesson.module_id === mod.id).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        lesson_order: lesson.order_index,
        step_type: lesson.lesson_type ?? 'lesson',
        content: lesson.content ?? '',
        video_url: lesson.video_url ?? '',
        duration_minutes: lesson.duration_minutes,
        passing_score: lesson.passing_score,
        status: lesson.status ?? 'draft',
        learning_objectives: lesson.learning_objectives,
        practical_required: lesson.practical_required,
        requires_instructor_signoff: lesson.requires_instructor_signoff,
        competency_checks: lesson.competency_checks,
        hour_category: lesson.hour_category,
        minimum_seat_time_minutes: lesson.minimum_seat_time_minutes,
      })),
    }));

    return NextResponse.json({ ok: true, course, modules: mappedModules });
  } catch (error) {
    return safeInternalError(error, 'Failed to load course workspace');
  }
}
