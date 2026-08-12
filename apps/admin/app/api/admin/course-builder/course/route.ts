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
    const { data: course, error: courseError } = await db
      .from('courses')
      .select('id,title,slug,description,status,is_active,published_at,version,program_id,duration_hours,passing_score,review_status,review_notes,compliance_profile_key,governing_body,governing_region,governing_standard_version')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError) throw courseError;
    if (!course) return safeError('Course not found', 404);

    const { data: modules, error: moduleError } = await db
      .from('course_modules')
      .select('id,title,slug,order_index,target_hours,domain_key,is_published,is_draft')
      .eq('course_id', courseId)
      .order('order_index');
    if (moduleError) throw moduleError;

    const moduleIds = (modules ?? []).map((module) => module.id);
    let lessons: any[] = [];
    if (moduleIds.length) {
      const { data, error } = await db
        .from('course_lessons')
        .select('id,course_id,module_id,title,slug,order_index,lesson_type,content,content_json,rendered_html,video_url,video_status,duration_minutes,minimum_seat_time_minutes,passing_score,status,is_published,learning_objectives,practical_required,requires_instructor_signoff,competency_checks,hour_category,delivery_method')
        .in('module_id', moduleIds)
        .order('order_index');
      if (error) throw error;
      lessons = data ?? [];
    }

    const mappedModules = (modules ?? []).map((module) => ({
      id: module.id,
      title: module.title,
      slug: module.slug,
      module_order: module.order_index,
      target_hours: module.target_hours,
      domain_key: module.domain_key,
      is_published: module.is_published,
      is_draft: module.is_draft,
      lessons: lessons
        .filter((lesson) => lesson.module_id === module.id)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          lesson_order: lesson.order_index,
          step_type: lesson.lesson_type ?? 'lesson',
          content: lesson.content ?? '',
          content_json: lesson.content_json ?? {},
          rendered_html: lesson.rendered_html ?? '',
          video_url: lesson.video_url ?? '',
          video_status: lesson.video_status ?? 'pending',
          duration_minutes: lesson.duration_minutes,
          minimum_seat_time_minutes: lesson.minimum_seat_time_minutes,
          passing_score: lesson.passing_score,
          status: lesson.status ?? 'draft',
          is_published: lesson.is_published,
          learning_objectives: lesson.learning_objectives,
          practical_required: lesson.practical_required,
          requires_instructor_signoff: lesson.requires_instructor_signoff,
          competency_checks: lesson.competency_checks,
          hour_category: lesson.hour_category,
          delivery_method: lesson.delivery_method,
        })),
    }));

    return NextResponse.json({ ok: true, course, modules: mappedModules });
  } catch (error) {
    return safeInternalError(error, 'Failed to load course workspace');
  }
}
