import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public lesson list for a course. Returns lesson metadata (no quiz answers).
 * Used by the public lesson player page which can't read training_lessons
 * directly due to RLS (authenticated + tenant-scoped).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;

  const admin = createAdminClient();
  const supabase = admin || (await createClient());
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Fetch course
  const { data: course, error: courseErr } = await supabase
    .from('training_courses')
    .select('id, course_name, description, is_active')
    .eq('id', courseId)
    .single();

  if (courseErr || !course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Fetch published lessons via admin client (bypasses RLS)
  const { data: lessons, error: lessonsErr } = await supabase
    .from('lessons')
    .select('id, course_id, title, content, video_url, lesson_number, order_index, duration_minutes, is_required, is_published, content_type')
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
