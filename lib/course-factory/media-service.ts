import { requireAdminClient } from '@/lib/supabase/admin';
import { createJob, type VideoJob } from '@/lib/video/job-queue';
import { hasCanonicalMediaQualityEvidence, resetCanonicalMediaJob } from '@/lib/course-factory/media-manager';
import { logger } from '@/lib/logger';
import { generateInstructorIntro, getInstructorById, getInstructorForCourse } from '@/lib/ai-instructors';

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
    ? experience.quickClips.slice(0, 2)
    : [];
}

function assetIdentity(lessonId: string, assetKind: string, assetKey?: string | null) {
  return `${lessonId}:${assetKind}:${assetKey ?? ''}`;
}

/**
 * Canonical course-media enqueue service.
 * Course Builder/Factory owns orchestration; lib/video owns rendering mechanics.
 * Each persisted lesson owns one primary lesson video and at most two canonical
 * quick-clip assets so media counts remain deterministic across generation and reruns.
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

  let lessonQuery = db
    .from('course_lessons')
    .select(
      'id, module_id, title, script, bullet_points, scene_data, content_json, video_config, video_url, video_status, media_origin, media_quality_status, order_index',
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
    .select('*')
    .eq('course_id', input.courseId);
  if (jobsError) throw new Error(`Failed to load existing video jobs: ${jobsError.message}`);

  const existingByAsset = new Map<string, VideoJob>();
  for (const job of (existingJobs ?? []) as VideoJob[]) {
    existingByAsset.set(assetIdentity(job.lesson_id, job.asset_kind ?? 'lesson', job.asset_key), job);
  }

  const moduleOrder = new Map((modules ?? []).map((row) => [row.id, Number(row.order_index)]));
  const rows = [...(lessons ?? [])].sort((left, right) => {
    const moduleDelta =
      (moduleOrder.get(left.module_id) ?? Number.MAX_SAFE_INTEGER) -
      (moduleOrder.get(right.module_id) ?? Number.MAX_SAFE_INTEGER);
    return moduleDelta || Number(left.order_index) - Number(right.order_index);
  });

  const onlyMissing = input.onlyMissing !== false;
  const force = input.force === true;
  let candidates = rows;
  if (typeof input.limit === 'number' && input.limit > 0) candidates = candidates.slice(0, input.limit);

  let queued = 0;
  let microclipsQueued = 0;
  let failed = 0;

  async function ensureQueued(
    existing: VideoJob | undefined,
    create: () => Promise<VideoJob>,
  ): Promise<VideoJob> {
    if (!existing) return create();
    if (existing.status === 'failed' || (force && existing.status !== 'rendering')) {
      return resetCanonicalMediaJob(
        {
          courseId: existing.course_id,
          lessonId: existing.lesson_id,
          assetKind: existing.asset_kind ?? 'lesson',
          assetKey: existing.asset_key,
        },
        { force, reason: force ? 'Authorized Course Factory media repair' : existing.error_message ?? 'Retrying failed media asset' },
      );
    }
    return existing;
  }

  for (const [candidateIndex, lesson] of candidates.entries()) {
    try {
      const videoConfig = lesson.video_config && typeof lesson.video_config === 'object'
        ? lesson.video_config as Record<string, unknown>
        : {};
      const instructorId = [videoConfig.instructorId, videoConfig.instructor_id]
        .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
        ?.trim() ?? '';
      const instructor = instructorId
        ? getInstructorById(instructorId)
        : getInstructorForCourse(course.title);
      const lessonKey = assetIdentity(lesson.id, 'lesson', null);
      const existingLessonJob = existingByAsset.get(lessonKey);
      const hasVideo = typeof lesson.video_url === 'string' && lesson.video_url.trim().length > 0;
      const mainComplete = hasVideo && lesson.video_status === 'complete'
        && lesson.media_origin === 'generated' && lesson.media_quality_status === 'approved'
        && existingLessonJob?.review_status === 'approved'
        && hasCanonicalMediaQualityEvidence(existingLessonJob.quality_evidence);
      const mainInFlight = lesson.video_status === 'queued' || lesson.video_status === 'rendering';
      const shouldQueueMain = force || (!mainInFlight && (!onlyMissing || !mainComplete));

      if (shouldQueueMain) {
        const job = await ensureQueued(existingLessonJob, () => createJob({
          lesson_id: lesson.id,
          course_id: input.courseId,
          lesson_title: lesson.title,
          script:
            candidateIndex === 0
              ? `${generateInstructorIntro(instructor, course.title)} ${lesson.script ?? ''}`.trim()
              : String(lesson.script ?? '').trim(),
          bullet_points: Array.isArray(lesson.bullet_points) ? (lesson.bullet_points as string[]) : [],
          scene_data: lesson.scene_data ?? null,
          asset_kind: 'lesson',
        }));
        existingByAsset.set(lessonKey, job);
        if (job.status === 'queued') queued += 1;
      }

      for (const clip of readQuickClips(lesson.content_json)) {
        const clipId = typeof clip.id === 'string' ? clip.id : '';
        if (!clipId) continue;
        const hasRenderedClip = typeof clip.videoUrl === 'string' && clip.videoUrl.trim().length > 0;
        const clipKey = assetIdentity(lesson.id, 'microclip', clipId);
        const existingClipJob = existingByAsset.get(clipKey);
        if (!force && hasRenderedClip && existingClipJob?.status === 'complete') continue;

        const job = await ensureQueued(existingClipJob, () => createJob({
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
        }));
        existingByAsset.set(clipKey, job);
        if (job.status === 'queued') microclipsQueued += 1;
      }
    } catch (err) {
      failed += 1;
      logger.warn('[course-factory/media] Failed to enqueue/retry media assets', {
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
