import { requireAdminClient } from '@/lib/supabase/admin';
import { createJob } from '@/lib/video/job-queue';
import { logger } from '@/lib/logger';
import { generateInstructorIntro, getInstructorForCourse } from '@/lib/ai-instructors';

export interface QueueCourseLessonVideosInput {
  courseId: string;
  lessonId?: string | null;
  onlyMissing?: boolean;
  limit?: number | null;
  force?: boolean;
}

export interface QueueCourseLessonVideosResult {
  totalLessons: number;
  attempted: number;
  queued: number;
  microclipsQueued: number;
  skipped: number;
  failed: number;
}

function readQuickClips(contentJson: unknown): Array<Record<string, any>> {
  if (!contentJson || typeof contentJson !== 'object') return [];
  const experience = (contentJson as Record<string, any>).experience;
  return experience && typeof experience === 'object' && Array.isArray(experience.quickClips)
    ? experience.quickClips
    : [];
}

/**
 * Canonical course-media enqueue service.
 * Course Builder/Factory owns orchestration; lib/video owns rendering mechanics.
 */
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
    throw new Error(
      `Failed to load course for instructor assignment: ${courseError?.message ?? 'not found'}`,
    );
  }

  const instructor = getInstructorForCourse(course.title);
  let lessonQuery = db
    .from('course_lessons')
    .select(
      'id, module_id, title, script, bullet_points, scene_data, content_json, video_url, video_status, order_index',
    )
    .eq('course_id', input.courseId);
  if (input.lessonId) lessonQuery = lessonQuery.eq('id', input.lessonId);
  const { data: lessons, error } = await lessonQuery.order('order_index', { ascending: true });
  if (error) throw new Error(`Failed to load lessons for video queue: ${error.message}`);

  const { data: modules, error: moduleError } = await db
    .from('course_modules')
    .select('id, order_index')
    .eq('course_id', input.courseId);
  if (moduleError) throw new Error(`Failed to load module order for video queue: ${moduleError.message}`);

  const { data: existingJobs, error: jobsError } = await db
    .from('video_jobs')
    .select('lesson_id, asset_kind, asset_key, status')
    .eq('course_id', input.courseId)
    .in('status', ['queued', 'rendering', 'complete']);
  if (jobsError) throw new Error(`Failed to load existing video jobs: ${jobsError.message}`);

  const activeAssets = new Set(
    (existingJobs ?? []).map((job) => `${job.lesson_id}:${job.asset_kind ?? 'lesson'}:${job.asset_key ?? ''}`),
  );

  const moduleOrder = new Map((modules ?? []).map((row) => [row.id, Number(row.order_index)]));
  const rows = [...(lessons ?? [])].sort((left, right) => {
    const moduleDelta =
      (moduleOrder.get(left.module_id) ?? Number.MAX_SAFE_INTEGER) -
      (moduleOrder.get(right.module_id) ?? Number.MAX_SAFE_INTEGER);
    return moduleDelta || Number(left.order_index) - Number(right.order_index);
  });

  const onlyMissing = input.onlyMissing !== false;
  const force = input.force === true;
  let candidates = rows.filter((lesson) => {
    if (force) return true;
    if (lesson.video_status === 'queued' || lesson.video_status === 'rendering') return false;
    if (!onlyMissing) return true;
    const hasVideo = typeof lesson.video_url === 'string' && lesson.video_url.trim().length > 0;
    const isComplete = lesson.video_status === 'complete';
    return !(hasVideo && isComplete);
  });
  if (typeof input.limit === 'number' && input.limit > 0) candidates = candidates.slice(0, input.limit);

  let queued = 0;
  let microclipsQueued = 0;
  let failed = 0;

  for (const [candidateIndex, lesson] of candidates.entries()) {
    try {
      const lessonKey = `${lesson.id}:lesson:`;
      if (force || !activeAssets.has(lessonKey)) {
        await createJob({
          lesson_id: lesson.id,
          course_id: input.courseId,
          lesson_title: lesson.title,
          script:
            candidateIndex === 0
              ? `${generateInstructorIntro(instructor, course.title)} ${lesson.script ?? ''}`.trim()
              : `Welcome back. I'm ${instructor.name}, your ${instructor.title}. ${lesson.script ?? ''}`.trim(),
          bullet_points: Array.isArray(lesson.bullet_points) ? (lesson.bullet_points as string[]) : [],
          scene_data: lesson.scene_data ?? null,
          asset_kind: 'lesson',
        });
        queued += 1;
      }

      for (const clip of readQuickClips(lesson.content_json)) {
        const clipId = typeof clip.id === 'string' ? clip.id : '';
        if (!clipId) continue;
        const hasRenderedClip = typeof clip.videoUrl === 'string' && clip.videoUrl.trim().length > 0;
        const clipKey = `${lesson.id}:microclip:${clipId}`;
        if (!force && (hasRenderedClip || activeAssets.has(clipKey))) continue;

        await createJob({
          lesson_id: lesson.id,
          course_id: input.courseId,
          lesson_title: `${lesson.title} — ${String(clip.title ?? clipId)}`,
          script: String(clip.script ?? ''),
          bullet_points: [String(clip.objective ?? '')].filter(Boolean),
          scene_data: {
            asset_kind: 'microclip',
            asset_key: clipId,
            visual_prompt: clip.visualPrompt ?? null,
            target_duration_seconds: clip.durationSeconds ?? 180,
          },
          asset_kind: 'microclip',
          asset_key: clipId,
        });
        microclipsQueued += 1;
      }
    } catch (err) {
      failed += 1;
      logger.warn('[course-factory/media] Failed to enqueue media assets', {
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
    microclipsQueued,
    skipped: Math.max(rows.length - candidates.length, 0),
    failed,
  };
}
