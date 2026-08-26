import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/courses/[courseId]/lessons/public
 *
 * Canonical course syllabus endpoint.
 *
 * Source of truth:
 *   courses -> course_modules -> course_lessons
 *
 * Access tiers:
 *   anonymous / not enrolled -> syllabus metadata only
 *   authenticated + enrolled -> learner content fields
 *
 * There is intentionally no file-system or hardcoded UUID fallback here. A
 * missing database course is an integrity error, not permission to expose a
 * bundled legacy copy of course content.
 */
async function _GET(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const limited = await applyRateLimit(request, 'pageLoad');
  if (limited) return limited;

  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(user);
  let isEnrolled = false;

  if (user) {
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .in('status', ['active', 'enrolled', 'in_progress', 'completed'])
      .limit(1)
      .maybeSingle();

    isEnrolled = Boolean(enrollment);
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description, is_active')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json({ error: 'Failed to load course' }, { status: 500 });
  }
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const [lessonsResult, modulesResult] = await Promise.all([
    supabase
      .from('course_lessons')
      .select(
        'id, course_id, module_id, title, description, lesson_number, order_index, duration_minutes, is_required, is_published, content_type, quiz_id',
      )
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('lesson_number', { ascending: true }),
    supabase
      .from('course_modules')
      .select('id, title, description, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
  ]);

  if (lessonsResult.error) {
    return NextResponse.json({ error: 'Failed to load lessons' }, { status: 500 });
  }
  if (modulesResult.error) {
    return NextResponse.json({ error: 'Failed to load modules' }, { status: 500 });
  }

  const payload = {
    course,
    modules: modulesResult.data ?? [],
    lessons: lessonsResult.data ?? [],
    enrolled: isEnrolled,
    authenticated: isAuthenticated,
  };

  if (!isEnrolled) {
    return NextResponse.json(stripSensitiveFields(payload));
  }

  const lessonIds = payload.lessons.map((lesson) => lesson.id);
  if (lessonIds.length === 0) return NextResponse.json(payload);

  const { data: protectedFields, error: protectedError } = await supabase
    .from('course_lessons')
    .select('id, content, video_url, quiz_questions, passing_score, resources')
    .in('id', lessonIds);

  if (protectedError) {
    return NextResponse.json({ error: 'Failed to load learner content' }, { status: 500 });
  }

  const protectedMap = new Map(
    (protectedFields ?? []).map((row) => [String(row.id), row]),
  );

  return NextResponse.json({
    ...payload,
    lessons: payload.lessons.map((lesson) => ({
      ...lesson,
      ...(protectedMap.get(String(lesson.id)) ?? {}),
    })),
  });
}

function stripSensitiveFields(data: {
  course: unknown;
  modules: unknown[];
  lessons: Array<Record<string, any>>;
  enrolled: boolean;
  authenticated: boolean;
}) {
  return {
    course: data.course,
    modules: data.modules,
    enrolled: false,
    authenticated: data.authenticated,
    lessons: data.lessons.map((lesson) => ({
      id: lesson.id,
      course_id: lesson.course_id,
      module_id: lesson.module_id,
      title: lesson.title,
      description: lesson.description,
      lesson_number: lesson.lesson_number,
      order_index: lesson.order_index,
      duration_minutes: lesson.duration_minutes,
      is_required: lesson.is_required,
      is_published: lesson.is_published,
      content_type: lesson.content_type,
    })),
  };
}

export const GET = withApiAudit('/api/courses/[courseId]/lessons/public', _GET);
