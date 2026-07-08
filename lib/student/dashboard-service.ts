/**
 * Student Dashboard Service
 * 
 * Provides enrolled course data for student dashboard.
 * Students only see courses they are enrolled in.
 */

import { createClient } from '@/lib/supabase/server';
import { getPublicCourseAssetUrl } from '@/lib/storage/course-assets';

export interface EnrolledCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  progress_percent: number;
  current_module: number;
  current_lesson: number;
  total_modules: number;
  total_lessons: number;
  enrolled_at: string;
  last_activity_at: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  certificate_earned: boolean;
  next_lesson_title: string | null;
  quiz_status: 'not_started' | 'in_progress' | 'passed' | 'failed';
  practice_test_status: 'not_started' | 'available' | 'attempted';
  practice_test_attempts: number;
  max_practice_attempts: number;
}

/**
 * Get all enrolled courses for a student
 */
export async function getStudentEnrolledCourses(userId: string): Promise<EnrolledCourse[]> {
  const supabase = await createClient();

  const { data: enrollments, error } = await supabase
    .from('student_enrollments')
    .select(`
      *,
      course:courses(
        id,
        slug,
        title,
        description,
        hero_image_url,
        thumbnail_url
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });

  if (error || !enrollments) {
    console.error('Error fetching enrolled courses:', error);
    return [];
  }

  // Get progress for each enrollment
  const coursesWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const { data: progress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', enrollment.course_id)
        .single();

      const { count: lessonCount } = await supabase
        .from('course_lessons')
        .select('id', { count: 'exact' })
        .eq('course_id', enrollment.course_id)
        .eq('is_published', true);

      const { count: moduleCount } = await supabase
        .from('course_modules')
        .select('id', { count: 'exact' })
        .eq('course_id', enrollment.course_id)
        .eq('is_published', true);

      const { data: certificate } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', enrollment.course_id)
        .maybeSingle();

      // Get next lesson
      const { data: nextLesson } = await supabase
        .from('course_lessons')
        .select('title')
        .eq('course_id', enrollment.course_id)
        .eq('is_published', true)
        .gt('order_index', progress?.current_lesson_index || 0)
        .order('order_index')
        .limit(1)
        .single();

      return {
        id: enrollment.course_id,
        slug: enrollment.course_slug,
        title: enrollment.course?.title || 'Unknown Course',
        description: enrollment.course?.description || '',
        hero_image_url: enrollment.course?.hero_image_url || 
          getPublicCourseAssetUrl(enrollment.course_slug, 'hero', 'default.jpg'),
        thumbnail_url: enrollment.course?.thumbnail_url ||
          getPublicCourseAssetUrl(enrollment.course_slug, 'images', 'thumbnail.jpg'),
        progress_percent: progress?.progress_percent || 0,
        current_module: progress?.current_module_index || 1,
        current_lesson: (progress?.current_lesson_index || 0) + 1,
        total_modules: moduleCount || 0,
        total_lessons: lessonCount || 0,
        enrolled_at: enrollment.created_at,
        last_activity_at: progress?.last_activity_at || null,
        status: enrollment.status as 'active' | 'completed' | 'paused' | 'cancelled',
        certificate_earned: !!certificate,
        next_lesson_title: nextLesson?.title || null,
        quiz_status: progress?.quiz_status || 'not_started',
        practice_test_status: progress?.practice_test_status || 'not_started',
        practice_test_attempts: progress?.practice_test_attempts || 0,
        max_practice_attempts: 6,
      };
    })
  );

  return coursesWithProgress;
}

/**
 * Check if student has access to a course
 */
export async function hasCourseAccess(
  userId: string,
  courseSlug: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from('student_enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_slug', courseSlug)
    .eq('status', 'active')
    .single();

  return !!enrollment;
}