import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import {
  resolveCourseSlug,
  getHvacLegacyLessonCount,
  getHvacLegacyModules,
} from '@/lib/courses/hvac-legacy-maps';
import {
  buildHvacLessonContent,
  getHvacLessonDuration,
} from '@/lib/courses/hvac-content-builder';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { HVAC_COURSE_IDS } from '@/lib/courses/hvac-uuids';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title, description, thumbnail_url, image_url, published, status')
    .or(`id.eq.${courseId},slug.eq.${courseId}`)
    .maybeSingle();

  if (!course) {
    const resolvedSlug = resolveCourseSlug(courseId);
    if (resolvedSlug === 'hvac-technician') {
      const legacyModules = getHvacLegacyModules();
      const lessons = legacyModules.flatMap((module) =>
        module.lessons.map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description,
          module_id: module.id,
          module_title: module.title,
          module_order: module.order,
          lesson_order: lesson.order,
          duration_minutes: getHvacLessonDuration(lesson.slug),
          content: buildHvacLessonContent(lesson.slug),
          video_url: null,
          quiz_questions: null,
          passing_score: 80,
        })),
      );

      return NextResponse.json({
        course: {
          id: HVAC_COURSE_IDS.COURSE,
          slug: 'hvac-technician',
          title: 'HVAC Technician',
          description: 'HVAC technician training',
          thumbnail_url: null,
          image_url: null,
          published: true,
          status: 'published',
        },
        lessons: user ? lessons : lessons.map(({ content, video_url, quiz_questions, ...lesson }) => lesson),
        modules: legacyModules.map((module) => ({
          id: module.id,
          title: module.title,
          order_index: module.order,
        })),
        enrolled: false,
        authenticated: Boolean(user),
        lessonCount: getHvacLegacyLessonCount(),
      });
    }

    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const [{ data: enrollment }, { data: modules }, { data: lessons }] = await Promise.all([
    user
      ? supabase
          .from('program_enrollments')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('course_id', course.id)
          .in('status', ['active', 'enrolled', 'in_progress', 'completed'])
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('course_modules')
      .select('id, title, description, order_index')
      .eq('course_id', course.id)
      .order('order_index', { ascending: true }),
    supabase
      .from('course_lessons')
      .select('id, title, description, module_id, order_index, duration_minutes')
      .eq('course_id', course.id)
      .order('order_index', { ascending: true }),
  ]);

  const isEnrolled = Boolean(enrollment);
  const isAuthenticated = Boolean(user);
  const payload = {
    course,
    lessons: lessons || [],
    modules: modules || [],
    enrolled: isEnrolled,
    authenticated: isAuthenticated,
  };

  // Full content (video_url, quiz_questions, HTML) requires enrollment.
  // Unauthenticated and non-enrolled callers receive syllabus only.
  // Enrolled users get a second targeted fetch for sensitive fields —
  // these are never fetched from the DB for unenrolled callers.
  if (isEnrolled) {
    const lessonIds = payload.lessons.map((l: any) => l.id);
    const { data: enriched } = await supabase
      .from('course_lessons')
      .select('id, content, video_url, quiz_questions, passing_score')
      .in('id', lessonIds);

    const enrichMap = new Map<string, Record<string, unknown>>(
      (enriched ?? []).map((r: any) => [String(r.id), r as Record<string, unknown>]),
    );
    const fullLessons = payload.lessons.map((l: any) => ({
      ...l,
      ...(enrichMap.get(String(l.id)) ?? {}),
    }));
    return NextResponse.json({ ...payload, lessons: fullLessons });
  }
  return NextResponse.json(stripSensitiveFields(payload));
}

/**
 * Strip video URLs, full content, and quiz answers from lesson data.
 * Returns only what's needed for the course syllabus/overview page.
 */
function stripSensitiveFields(data: any) {
  if (!data?.lessons) return data;
  return {
    ...data,
    lessons: data.lessons.map((lesson: any) => {
      const {
        content: _content,
        video_url: _videoUrl,
        quiz_questions: _quizQuestions,
        answers: _answers,
        correct_answer: _correctAnswer,
        ...safe
      } = lesson;
      return safe;
    }),
  };
}

export const GET = withApiAudit('/api/courses/[courseId]/lessons/public', _GET);
