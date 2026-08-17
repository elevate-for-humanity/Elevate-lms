import { requireAdminClient } from '@/lib/supabase/admin';
import { createJob } from '@/lib/video/job-queue';
import { logger } from '@/lib/logger';
import { generateInstructorIntro, getInstructorForCourse } from '@/lib/ai-instructors';

interface QueueCourseLessonVideosInput {
  courseId: string;
  onlyMissing?: boolean;
  limit?: number | null;
  force?: boolean;
}

interface QueueCourseLessonVideosResult {
  totalLessons: number;
  attempted: number;
  queued: number;
  skipped: number;
  failed: number;
}

export async function queueCourseLessonVideos(
  input: QueueCourseLessonVideosInput,
): Promise<QueueCourseLessonVideosResult> {
  const db = await requireAdminClient();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('title')
    .eq('id', input.courseId)
    .maybeSingle();

  if (courseError || !course) {
    throw new Error(`Failed to load course for instructor assignment: ${courseError?.message ?? 'not found'}`);
  }

  const instructor = getInstructorForCourse(course.title);

  const { data: lessons, error } = await db
    .from('course_lessons')
    .select('id, title, script, bullet_points, video_url, video_status, order_index')
    .eq('course_id', input.courseId)
    .order('order_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to load lessons for video queue: ${error.message}`);
  }

  const rows = lessons ?? [];
  const onlyMissing = input.onlyMissing !== false;
  const force = input.force === true;

  let candidates = rows.filter((lesson) => {
    if (force) return true;

    if (lesson.video_status === 'queued' || lesson.video_status === 'rendering') {
      return false;
    }

    if (!onlyMissing) return true;

    const hasVideo = typeof lesson.video_url === 'string' && lesson.video_url.trim().length > 0;
    const isComplete = lesson.video_status === 'complete';
    return !(hasVideo && isComplete);
  });

  if (typeof input.limit === 'number' && input.limit > 0) {
    candidates = candidates.slice(0, input.limit);
  }

  let queued = 0;
  let failed = 0;

  for (const lesson of candidates) {
    try {
      await createJob({
        lesson_id: lesson.id,
        course_id: input.courseId,
        lesson_title: lesson.title,
        script:
          lesson.order_index === 0
            ? `${generateInstructorIntro(instructor, course.title)} ${lesson.script ?? ''}`.trim()
            : `Welcome back. I'm ${instructor.name}, your ${instructor.title}. ${lesson.script ?? ''}`.trim(),
        bullet_points: Array.isArray(lesson.bullet_points)
          ? (lesson.bullet_points as string[])
          : [],
      });
      queued += 1;
    } catch (err) {
      failed += 1;
      logger.warn('[video-queue] Failed to enqueue lesson video job', {
        courseId: input.courseId,
        lessonId: lesson.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    totalLessons: rows.length,
    attempted: candidates.length,
    queued,
    skipped: Math.max(rows.length - candidates.length, 0),
    failed,
  };
}
