/**
 * Course repository — canonical read path.
 *
 * ALL student-facing course reads go through here.
 * Source: courses / course_modules / course_lessons ONLY.
 * training_* and curriculum_* tables are NOT read here.
 * If data is missing, throw — do not fall back silently.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface CourseLesson {
  id: string;
  slug: string;
  title: string;
  lesson_type: string;
  order_index: number;
  passing_score: number | null;
  quiz_questions: unknown | null;
  is_required: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  order_index: number;
  course_lessons: CourseLesson[];
}

export interface Course {
  id: string;
  program_id: string | null;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  status: string;
  published_at: string | null;
}

export interface CourseWithModules extends Course {
  course_modules: CourseModule[];
}

/**
 * All published active courses. Used by catalog pages.
 */
export async function getPublishedCourses(db: SupabaseClient): Promise<Course[]> {
  const { data, error } = await db
    .from('courses')
    .select('id, program_id, slug, title, short_description, description, status, published_at')
    .eq('status', 'published')
    .eq('is_active', true)
    .order('published_at', { ascending: false });

  if (error) throw new Error(`getPublishedCourses failed: ${error.message}`);
  return data ?? [];
}

/**
 * Single published course by slug with full module+lesson tree.
 * Throws if not found or not published — no fallback.
 */
export async function getPublishedCourseBySlug(
  db: SupabaseClient,
  slug: string,
): Promise<CourseWithModules> {
  const { data, error } = await db
    .from('courses')
    .select(`
      id, program_id, slug, title, short_description, description, status, published_at,
      course_modules (
        id, title, order_index,
        course_lessons (
          id, slug, title, lesson_type, order_index,
          passing_score, quiz_questions, is_required
        )
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_active', true)
    .single();

  if (error) throw new Error(`Course "${slug}" not found or not published: ${error.message}`);
  if (!data) throw new Error(`Course "${slug}" not found`);

  // Sort modules and lessons deterministically
  const sorted: CourseWithModules = {
    ...data,
    course_modules: (data.course_modules ?? [])
      .sort((a: CourseModule, b: CourseModule) => a.order_index - b.order_index)
      .map((mod: CourseModule) => ({
        ...mod,
        course_lessons: (mod.course_lessons ?? [])
          .sort((a: CourseLesson, b: CourseLesson) => a.order_index - b.order_index),
      })),
  };

  return sorted;
}

/**
 * Single published course by ID.
 */
export async function getPublishedCourseById(
  db: SupabaseClient,
  courseId: string,
): Promise<CourseWithModules> {
  const { data, error } = await db
    .from('courses')
    .select(`
      id, program_id, slug, title, short_description, description, status, published_at,
      course_modules (
        id, title, order_index,
        course_lessons (
          id, slug, title, lesson_type, order_index,
          passing_score, quiz_questions, is_required
        )
      )
    `)
    .eq('id', courseId)
    .eq('status', 'published')
    .eq('is_active', true)
    .single();

  if (error) throw new Error(`Course ${courseId} not found or not published: ${error.message}`);
  if (!data) throw new Error(`Course ${courseId} not found`);

  return {
    ...data,
    course_modules: (data.course_modules ?? [])
      .sort((a: CourseModule, b: CourseModule) => a.order_index - b.order_index)
      .map((mod: CourseModule) => ({
        ...mod,
        course_lessons: (mod.course_lessons ?? [])
          .sort((a: CourseLesson, b: CourseLesson) => a.order_index - b.order_index),
      })),
  };
}

/**
 * Single lesson by ID — confirms it belongs to a published course.
 * Throws if lesson not found or course not published.
 */
export async function getPublishedLesson(
  db: SupabaseClient,
  lessonId: string,
) {
  const { data, error } = await db
    .from('course_lessons')
    .select(`
      id, course_id, module_id, slug, title, content,
      lesson_type, order_index, passing_score, quiz_questions, is_required,
      courses!inner(id, slug, title, status, is_active)
    `)
    .eq('id', lessonId)
    .eq('courses.status', 'published')
    .eq('courses.is_active', true)
    .single();

  if (error) throw new Error(`Lesson ${lessonId} not found or course not published: ${error.message}`);
  return data;
}
