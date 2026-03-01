import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { COURSE_DEFINITIONS } from '@/lib/courses/definitions';
import { HVAC_LESSON_UUID, HVAC_MODULE_UUID } from '@/lib/courses/hvac-uuids';
import { HVAC_QUIZ_MAP } from '@/lib/courses/hvac-quiz-map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Known course UUID → definition slug mapping for pre-migration fallback
const COURSE_ID_TO_SLUG: Record<string, string> = {
  'f0593164-55be-5867-98e7-8a86770a8dd0': 'hvac-technician',
};

// Lesson definition ID → UUID lookup (currently only HVAC)
const LESSON_ID_TO_UUID: Record<string, Record<string, string>> = {
  'hvac-technician': HVAC_LESSON_UUID,
};
const MODULE_ID_TO_UUID: Record<string, Record<string, string>> = {
  'hvac-technician': HVAC_MODULE_UUID,
};
// Quiz data lookup by slug
const QUIZ_MAPS: Record<string, typeof HVAC_QUIZ_MAP> = {
  'hvac-technician': HVAC_QUIZ_MAP,
};

/**
 * Build lesson/module response from local CourseDefinition when Supabase
 * hasn't been seeded yet. Uses deterministic UUIDs so lesson URLs match.
 */
function buildLocalFallback(courseId: string, slug: string) {
  const def = COURSE_DEFINITIONS.find((c) => c.slug === slug);
  if (!def) return null;

  const lessonUuids = LESSON_ID_TO_UUID[slug] || {};
  const moduleUuids = MODULE_ID_TO_UUID[slug] || {};

  const course = {
    id: courseId,
    title: def.title,
    course_name: def.title,
    description: def.subtitle,
    is_active: true,
  };

  let lessonNumber = 0;
  const modules = def.modules.map((mod, mi) => ({
    id: moduleUuids[mod.id] || mod.id,
    title: mod.title,
    description: mod.description,
    order_index: mi + 1,
  }));

  const quizMap = QUIZ_MAPS[slug] || {};

  const lessons = def.modules.flatMap((mod, mi) =>
    mod.lessons.map((lesson, li) => {
      lessonNumber++;
      const quiz = quizMap[lesson.id];
      return {
        id: lessonUuids[lesson.id] || lesson.id,
        course_id: courseId,
        title: lesson.title,
        content: lesson.description || '',
        video_url: lesson.contentUrl || null,
        lesson_number: lessonNumber,
        order_index: li + 1,
        duration_minutes: lesson.durationMinutes || (lesson.type === 'reading' ? 15 : lesson.type === 'assignment' ? 30 : 20),
        is_required: true,
        is_published: true,
        content_type: lesson.type,
        quiz_id: quiz ? lesson.id : null,
        quiz_questions: quiz ? quiz.questions : null,
        passing_score: quiz ? quiz.passingScore : null,
        description: lesson.description || '',
        topics: null,
      };
    }),
  );

  return { course: { ...course, title: course.course_name }, lessons, modules };
}

/**
 * Public lesson list for a course. Returns lesson metadata (no quiz answers).
 * Used by the public lesson player page which can't read training_lessons
 * directly due to RLS (authenticated + tenant-scoped).
 *
 * Falls back to local course definitions when the course hasn't been seeded
 * into Supabase yet.
 */
async function _GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;

  const admin = createAdminClient();
  const supabase = admin || (await createClient());
  if (!supabase) {
    // No DB — try local fallback
    const slug = COURSE_ID_TO_SLUG[courseId];
    if (slug) {
      const fallback = buildLocalFallback(courseId, slug);
      if (fallback) return NextResponse.json(fallback);
    }
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Fetch course
  const { data: course, error: courseErr } = await supabase
    .from('training_courses')
    .select('id, course_name, description, is_active')
    .eq('id', courseId)
    .single();

  if (courseErr || !course) {
    // Fallback to local definitions for known courses not yet in Supabase
    const slug = COURSE_ID_TO_SLUG[courseId];
    if (slug) {
      const fallback = buildLocalFallback(courseId, slug);
      if (fallback) return NextResponse.json(fallback);
    }
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Fetch published lessons via admin client (bypasses RLS)
  const { data: lessons, error: lessonsErr } = await supabase
    .from('training_lessons')
    .select('id, course_id, title, content, video_url, lesson_number, order_index, duration_minutes, is_required, is_published, content_type, quiz_id, quiz_questions, passing_score, description, topics')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('lesson_number');

  if (lessonsErr) {
    return NextResponse.json({ error: 'Failed to load lessons' }, { status: 500 });
  }

  // Fetch course modules for week grouping
  const { data: modules } = await supabase
    .from('course_modules')
    .select('id, title, description, order_index')
    .eq('course_id', courseId)
    .order('order_index');

  // Normalize course_name → title for frontend compatibility
  const normalizedCourse = { ...course, title: course.course_name };
  return NextResponse.json({
    course: normalizedCourse,
    lessons: lessons || [],
    modules: modules || [],
  });
}
export const GET = withApiAudit('/api/courses/[courseId]/lessons/public', _GET);
