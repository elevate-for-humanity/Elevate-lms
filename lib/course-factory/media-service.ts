import { requireAdminClient } from '@/lib/supabase/admin';
import { assertCourseBuilderGenerationEnabled } from '@/lib/course-builder/generation-control';
import { createJob, type VideoJob } from '@/lib/video/job-queue';
import {
  hasCanonicalMediaQualityEvidence,
  resetCanonicalMediaJob,
} from '@/lib/course-factory/media-manager';
import { logger } from '@/lib/logger';
import {
  generateInstructorIntro,
  getInstructorById,
  getInstructorForCourse,
} from '@/lib/ai-instructors';

export interface QueueCourseLessonVideosInput {
  courseId: string;
  lessonId?: string | null;
  onlyMissing?: boolean;
  limit?: number | null;
  force?: boolean;
  /** Validate the exact production scope without writing jobs or invoking providers. */
  validateOnly?: boolean;
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
  /** Jobs that a subsequent non-validation request would create or deliberately restart. */
  wouldQueue: number;
  /** Existing queued/rendering jobs left untouched by validation and repeated requests. */
  alreadyActive: number;
  validateOnly: boolean;
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
    if (normalized.length < 3 || internalDirective.test(normalized) || seen.has(normalized))
      return [];
    seen.add(normalized);
    return [normalized];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectInstructionalText(item, key, seen));
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([childKey, child]) =>
      collectInstructionalText(child, childKey, seen),
    );
  }
  return [];
}

function canonicalLessonNarration(lesson: Record<string, any>): string {
  // Persisted `content` contains the authored lesson experience and display HTML.
  // `content_json` also carries LMS orchestration metadata (learning_objects and
  // learning_experience). Narrating that metadata leaks internal field names and
  // workflow tokens into learner audio, so it must never be a narration source.
  const sources = [lesson.rendered_html, lesson.content]
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
  await assertCourseBuilderGenerationEnabled(db, input.courseId);
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

  const { data: firstLesson, error: firstLessonError } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', input.courseId)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstLessonError)
    throw new Error(`Failed to resolve course introduction lesson: ${firstLessonError.message}`);

  let lessonQuery = db
    .from('course_lessons')
    .select(
      'id, module_id, title, content, rendered_html, script, bullet_points, learning_objectives, scene_data, content_json, video_config, video_url, video_status, media_origin, media_quality_status, order_index',
    )
    .eq('course_id', input.courseId);
  if (input.lessonId) lessonQuery = lessonQuery.eq('id', input.lessonId);
  const { data: lessons, error } = await lessonQuery.order('order_index', { ascending: true });
  if (error) throw new Error(`Failed to load lessons for video queue: ${error.message}`);

  const { data: modules, error: moduleError } = await db
    .from('course_modules')
    .select('id, order_index')
    .eq('course_id', input.courseId);
  if (moduleError)
    throw new Error(`Failed to load module order for video queue: ${moduleError.message}`);

  const { data: existingJobs, error: jobsError } = await db
    .from('video_jobs')
    .select('*')
    .eq('course_id', input.courseId);
  if (jobsError) throw new Error(`Failed to load existing video jobs: ${jobsError.message}`);

  const existingByAsset = new Map<string, VideoJob>();
  for (const job of (existingJobs ?? []) as VideoJob[]) {
    existingByAsset.set(
      assetIdentity(job.lesson_id, job.asset_kind ?? 'lesson', job.asset_key),
      job,
    );
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
  if (typeof input.limit === 'number' && input.limit > 0)
    candidates = candidates.slice(0, input.limit);

  let queued = 0;
  let microclipsQueued = 0;
  let failed = 0;
  let lessonVideosReady = 0;
  let wouldQueue = 0;
  let alreadyActive = 0;

  async function ensureQueued(
    _existing: VideoJob | undefined,
    create: () => Promise<VideoJob>,
    replaceCompletedSource = false,
  ): Promise<VideoJob> {
    // createJob is an upsert-by-canonical-identity and synchronizes refreshed
    // lesson narration/scene data into any non-rendering existing job.
    const current = await create();
    // A queued job is already renderer-ready and must not consume retry budget.
    // Force only replaces a completed asset or retries a failed asset after the
    // canonical source has been deliberately repaired.
    if (
      current.status === 'failed' ||
      ((force || replaceCompletedSource) && current.status === 'complete')
    ) {
      return resetCanonicalMediaJob(
        {
          courseId: current.course_id,
          lessonId: current.lesson_id,
          assetKind: current.asset_kind ?? 'lesson',
          assetKey: current.asset_key,
        },
        {
          force: force || replaceCompletedSource,
          sourceRepaired: (force || replaceCompletedSource) && current.status === 'failed',
          reason: replaceCompletedSource
            ? 'Canonical lesson narration changed during unified course rebuild'
            : force
              ? 'Authorized Course Factory media source repair'
              : (current.error_message ?? 'Retrying failed media asset'),
        },
      );
    }
    return current;
  }

  for (const lesson of candidates) {
    try {
      const videoConfig =
        lesson.video_config && typeof lesson.video_config === 'object'
          ? (lesson.video_config as Record<string, unknown>)
          : {};
      const allowPaidNarration = videoConfig.allow_paid_narration === true;
      const instructorId =
        [videoConfig.instructorId, videoConfig.instructor_id]
          .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
          ?.trim() ?? '';
      const instructor = instructorId
        ? getInstructorById(instructorId)
        : getInstructorForCourse(course.title);
      const lessonKey = assetIdentity(lesson.id, 'lesson', null);
      const existingLessonJob = existingByAsset.get(lessonKey);
      const lessonNarration = canonicalLessonNarration(lesson);
      const sourceFingerprint =
        typeof videoConfig.source_fingerprint === 'string'
          ? videoConfig.source_fingerprint.trim()
          : '';
      if (!sourceFingerprint) {
        throw new Error(`Lesson "${lesson.title}" has no locked unified-media fingerprint`);
      }
      const canonicalObjectives =
        Array.isArray(lesson.learning_objectives) && lesson.learning_objectives.length
          ? (lesson.learning_objectives as string[]).filter(
              (value) => typeof value === 'string' && value.trim().length > 0,
            )
          : Array.isArray(lesson.bullet_points)
            ? (lesson.bullet_points as string[]).filter(
                (value) => typeof value === 'string' && value.trim().length > 0,
              )
            : [];
      const canonicalScript = [
        lesson.id === firstLesson?.id ? generateInstructorIntro(instructor, course.title) : '',
        canonicalObjectives.length
          ? `By the end of this lesson, you will be able to: ${canonicalObjectives.join('. ')}.`
          : '',
        lessonNarration,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      const sourceChanged = Boolean(
        existingLessonJob?.status === 'complete' &&
        (existingLessonJob.script ?? '').trim() !== canonicalScript,
      );
      const hasVideo = typeof lesson.video_url === 'string' && lesson.video_url.trim().length > 0;
      const mainComplete =
        hasVideo &&
        lesson.video_status === 'complete' &&
        lesson.media_origin === 'generated' &&
        lesson.media_quality_status === 'approved' &&
        existingLessonJob?.review_status === 'approved' &&
        hasCanonicalMediaQualityEvidence(existingLessonJob.quality_evidence);
      // video_jobs is the durable execution authority. course_lessons.video_status
      // is a denormalized display field and may be stale after a worker crash or
      // failed retry; trusting it here can strand a failed canonical job forever.
      const mainInFlight =
        existingLessonJob?.status === 'queued' || existingLessonJob?.status === 'rendering';
      // Queued/draft jobs still need their canonical payload synchronized after
      // a curriculum refresh. Only a renderer-owned active lease is immutable.
      const shouldQueueMain =
        force ||
        sourceChanged ||
        existingLessonJob?.status === 'queued' ||
        existingLessonJob?.status === 'draft' ||
        (!mainInFlight && (!onlyMissing || !mainComplete));

      if (!force && mainInFlight && existingLessonJob && !sourceChanged) {
        alreadyActive += 1;
      }

      if (shouldQueueMain) {
        if (input.validateOnly) {
          // Validation is intentionally side-effect free. Existing active jobs
          // are reported, not refreshed or restarted, and no provider work is invoked.
          if (!mainInFlight || force || sourceChanged) wouldQueue += 1;
          if (mainComplete || mainInFlight) lessonVideosReady += 1;
          continue;
        }
        const job = await ensureQueued(
          existingLessonJob,
          () =>
            createJob({
              lesson_id: lesson.id,
              course_id: input.courseId,
              lesson_title: lesson.title,
              script: canonicalScript,
              bullet_points: canonicalObjectives,
              // A refreshed full narration requires a fresh storyboard. Reusing
              // lesson.scene_data from an older teaser causes visual/narration drift.
              scene_data: {
                source_contract: {
                  version: Number(videoConfig.source_contract_version ?? 1),
                  fingerprint: sourceFingerprint,
                  narration_locked: videoConfig.narration_locked === true,
                },
                media_policy: {
                  version: 1,
                  locked_by: 'course_builder',
                  narration: {
                    strategy: 'repository_voice',
                    instructor_id: instructor.id,
                    voice: instructor.voice,
                    allow_paid_provider: allowPaidNarration,
                    ...(allowPaidNarration ? { provider: 'cloudflare' } : {}),
                  },
                  visuals: {
                    strategy: 'existing_then_pexels',
                    generated_only_for_exact_instructional_evidence: true,
                  },
                },
              },
              asset_kind: 'lesson',
            }),
          sourceChanged,
        );
        existingByAsset.set(lessonKey, job);
        if (job.status === 'queued') queued += 1;
        if (job.status === 'queued' || job.status === 'rendering' || job.status === 'complete') {
          lessonVideosReady += 1;
        }
      } else if (mainComplete || mainInFlight) {
        lessonVideosReady += 1;
      }

      // Supplemental quick clips are explicit opt-in assets. The universal
      // builder defaults to one unified full instructional video per lesson;
      // activities and knowledge checks remain in the lesson flow.
      for (const clip of videoConfig.enableMicroclips === true
        ? readQuickClips(lesson.content_json)
        : []) {
        const clipId = typeof clip.id === 'string' ? clip.id : '';
        if (!clipId) continue;
        const hasRenderedClip =
          typeof clip.videoUrl === 'string' && clip.videoUrl.trim().length > 0;
        const clipKey = assetIdentity(lesson.id, 'microclip', clipId);
        const existingClipJob = existingByAsset.get(clipKey);
        if (!force && hasRenderedClip && existingClipJob?.status === 'complete') continue;

        if (input.validateOnly) {
          if (existingClipJob?.status === 'queued' || existingClipJob?.status === 'rendering') {
            alreadyActive += 1;
          } else {
            wouldQueue += 1;
          }
          continue;
        }

        const job = await ensureQueued(existingClipJob, () =>
          createJob({
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
              media_policy: {
                version: 1,
                locked_by: 'course_builder',
                narration: {
                  strategy: 'repository_voice',
                  instructor_id: instructor.id,
                  voice: instructor.voice,
                  allow_paid_provider: allowPaidNarration,
                  ...(allowPaidNarration ? { provider: 'cloudflare' } : {}),
                },
                visuals: {
                  strategy: 'existing_then_pexels',
                  generated_only_for_exact_instructional_evidence: true,
                },
              },
            },
            asset_kind: 'microclip',
            asset_key: clipId,
          }),
        );
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
    wouldQueue,
    alreadyActive,
    validateOnly: input.validateOnly === true,
  };
}
