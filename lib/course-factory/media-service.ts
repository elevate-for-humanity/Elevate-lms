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
  /** Primary lesson-video jobs accepted by the renderer queue or already valid. */
  lessonVideosReady: number;
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

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

const NON_NARRATED_KEYS = new Set([
  'id',
  'videoUrl',
  'audioUrl',
  'captionUrl',
  'transcriptUrl',
  'visualPrompt',
  'visual_prompt',
  'instructions',
  'expectedArtifact',
  'autoGrade',
  'automations',
  'actions',
  'action',
  'targetedActions',
  'nextActionOnMastery',
  'nextActionBelowMastery',
  'reflectionPrompt',
  'expertFeedbackPrompt',
  'prompt',
  'status',
  'type',
]);

function collectInstructionalText(value: unknown, key = '', seen = new Set<string>()): string[] {
  if (value == null || NON_NARRATED_KEYS.has(key)) return [];
  if (typeof value === 'string') {
    const normalized = decodeHtmlEntities(value)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|div|section|article|h[1-6]|li|ul|ol|table|tr|blockquote)>/gi, '. ')
      .replace(/<br\s*\/?>/gi, '. ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim();
    const internalDirective =
      /\b(the narration should|the script should|in this clip|apply this to .{0,160} by identifying|end with the action the learner|as an ai|return (?:valid )?json|prompt engineering)\b/i;
    if (normalized.length < 3 || internalDirective.test(normalized) || seen.has(normalized)) return [];
    seen.add(normalized);
    return [normalized];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectInstructionalText(item, key, seen));
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([childKey, child]) => collectInstructionalText(child, childKey, seen));
  }
  return [];
}

function canonicalLessonNarration(lesson: Record<string, any>): string {
  // Persisted lessons contain both a short display HTML fragment and the full
  // structured lesson experience. Narration must be derived from the richest
  // canonical source so readings, procedures, activities, knowledge checks,
  // explanations, and remediation stay synchronized with the video.
  const sources = [lesson.rendered_html, lesson.content, lesson.content_json]
    .map((source) => collectInstructionalText(source).join(' '))
    .map((source) => source.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const plain = sources.sort((left, right) => right.length - left.length)[0] ?? '';

  if (plain.length < 1_200) {
    throw new Error(
      `Lesson "${lesson.title}" does not contain enough canonical instruction for a full lesson video`,
    );
  }

  return plain;
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
      'id, module_id, title, content, rendered_html, script, bullet_points, scene_data, content_json, video_config, video_url, video_status, media_origin, media_quality_status, order_index',
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
  let lessonVideosReady = 0;

  async function ensureQueued(
    _existing: VideoJob | undefined,
    create: () => Promise<VideoJob>,
  ): Promise<VideoJob> {
    // createJob is an upsert-by-canonical-identity and synchronizes refreshed
    // lesson narration/scene data into any non-rendering existing job.
    const current = await create();
    // A queued job is already renderer-ready and must not consume retry budget.
    // Force only replaces a completed asset or retries a failed asset after the
    // canonical source has been deliberately repaired.
    if (current.status === 'failed' || (force && current.status === 'complete')) {
      return resetCanonicalMediaJob(
        {
          courseId: current.course_id,
          lessonId: current.lesson_id,
          assetKind: current.asset_kind ?? 'lesson',
          assetKey: current.asset_key,
        },
        {
          force,
          sourceRepaired: force && current.status === 'failed',
          reason: force
            ? 'Authorized Course Factory media source repair'
            : current.error_message ?? 'Retrying failed media asset',
        },
      );
    }
    return current;
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
      // Queued/draft jobs still need their canonical payload synchronized after
      // a curriculum refresh. Only a renderer-owned active lease is immutable.
      const shouldQueueMain =
        force ||
        existingLessonJob?.status === 'queued' ||
        existingLessonJob?.status === 'draft' ||
        (!mainInFlight && (!onlyMissing || !mainComplete));

      if (shouldQueueMain) {
        const lessonNarration = canonicalLessonNarration(lesson);
        const job = await ensureQueued(existingLessonJob, () => createJob({
          lesson_id: lesson.id,
          course_id: input.courseId,
          lesson_title: lesson.title,
          script: [
            candidateIndex === 0 ? generateInstructorIntro(instructor, course.title) : '',
            Array.isArray(lesson.bullet_points) && lesson.bullet_points.length
              ? `By the end of this lesson, you will be able to: ${lesson.bullet_points.join('. ')}.`
              : '',
            lessonNarration,
          ].filter(Boolean).join(' ').trim(),
          bullet_points: Array.isArray(lesson.bullet_points) ? (lesson.bullet_points as string[]) : [],
          // A refreshed full narration requires a fresh storyboard. Reusing
          // lesson.scene_data from an older teaser causes visual/narration drift.
          scene_data: null,
          asset_kind: 'lesson',
        }));
        existingByAsset.set(lessonKey, job);
        if (job.status === 'queued') queued += 1;
        if (job.status === 'queued' || job.status === 'rendering' || job.status === 'complete') {
          lessonVideosReady += 1;
        }
      } else if (mainComplete || mainInFlight) {
        lessonVideosReady += 1;
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
    lessonVideosReady,
  };
}
