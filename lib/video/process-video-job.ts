import 'server-only';

import { getInstructorById, getInstructorForCourse } from '@/lib/ai-instructors';
import { logger } from '@/lib/logger';
import { recordPlatformUsage } from '@/lib/platform/usage-metering';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  deleteGpuVideoAsset,
  downloadGpuVideoAsset,
  generateGpuVideo,
  gpuVideoAvailable,
} from './gpu-video-client';
import { heartbeatJob, markCandidate, markComplete, markFailed, type VideoJob } from './job-queue';
import { enforceMediaQuality } from './media-quality-gate';
import { enforceInstructionalQuality } from './instructional-quality-gate';
import { repairInstructionalScript } from './instructional-script-repair';
import { directMedia, scenePrompt, type MediaCharacterReference } from './media-director';
import { recordMediaProvenance } from './media-provenance';
import { renderStoryboardVideo } from './remotion-render';
import { uploadLessonMediaBuffer } from './upload-lesson-media';
import { generateLessonScenes } from '@/server/video-generator/generateLessonScenes';
import type { LessonRenderPlanDraft } from '@/server/video-generator/types';
import { assertNarrationProviderConfigured } from './edge-tts';

const REMOTION_PROVIDER = 'remotion';
const REMOTION_MODEL = 'ElevateLesson';

async function hydrateMediaRuntimeSecrets(): Promise<void> {
  const missing = [
    'AI_NARRATION_PROVIDER',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_AI_API_TOKEN',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_TTS_MODEL',
    'AI_GATEWAY_ID',
    'ELEVENLABS_API_KEY',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
    'PEXELS_API_KEY',
    'DID_API_KEY',
  ].filter((key) => !process.env[key]?.trim());
  if (!missing.length) return;
  const db = createAdminClient();
  const { data: runtimeSettings } = await db
    .from('platform_settings')
    .select('key,value')
    .in('key', [
      'AI_PROVIDER',
      'AI_PROVIDER_ORDER',
      'AI_NARRATION_PROVIDER',
      'CLOUDFLARE_TTS_MODEL',
      'AI_GATEWAY_ID',
      'AI_TRANSCRIPTION_MODEL',
    ])
    .eq('is_active', true);
  for (const setting of runtimeSettings ?? []) {
    if (
      !process.env[setting.key]?.trim() &&
      typeof setting.value === 'string' &&
      setting.value.trim()
    ) {
      process.env[setting.key] = setting.value.trim();
    }
  }
  for (const key of missing) {
    try {
      const { data, error } = await db.rpc('get_platform_secret', { p_key: key });
      if (!error && typeof data === 'string' && data.trim()) process.env[key] = data.trim();
    } catch (error) {
      logger.warn('[video-worker] Unable to hydrate optional media secret', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function safeAssetKey(value: string): string {
  return (
    value
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'clip'
  );
}

function mediaCharacters(sceneData: Record<string, unknown>): MediaCharacterReference[] {
  if (!Array.isArray(sceneData.characters)) return [];
  return sceneData.characters
    .filter((value): value is Record<string, unknown> =>
      Boolean(value && typeof value === 'object'),
    )
    .map((value, index) => ({
      id: typeof value.id === 'string' && value.id ? value.id : `character-${index + 1}`,
      ...(typeof value.name === 'string' ? { name: value.name } : {}),
      ...(typeof value.reference_image_url === 'string'
        ? { referenceImageUrl: value.reference_image_url }
        : {}),
      ...(typeof value.appearance_prompt === 'string'
        ? { appearancePrompt: value.appearance_prompt }
        : {}),
      ...(typeof value.voice_id === 'string' ? { voiceId: value.voice_id } : {}),
      ...(typeof value.consent_record_id === 'string'
        ? { consentRecordId: value.consent_record_id }
        : {}),
    }));
}

function generatedSceneData(plan: LessonRenderPlanDraft): Record<string, unknown> {
  return {
    instructional_plan_version: '2.0',
    teaching_model: {
      name: plan.teachingModel.name,
      memory_anchor: plan.teachingModel.memoryAnchor,
      plain_language_map: plan.teachingModel.plainLanguageMap,
      misconception: plan.teachingModel.misconception,
      transfer_question: plan.teachingModel.transferQuestion,
    },
    voice: plan.voice,
    video_style: plan.videoStyle,
    target_resolution: plan.targetResolution,
    scenes: plan.scenes.map((scene) => ({
      id: scene.id,
      scene_type: scene.sceneType,
      duration_seconds: scene.maxClipSeconds ?? scene.minClipSeconds ?? 8,
      subject: plan.title,
      environment: scene.videoQuery,
      action: scene.demonstrationStep,
      visual_prompt: scene.visualFocus ?? scene.videoQuery,
      visual_style: plan.videoStyle,
      dialogue: scene.narration,
      procedure_phase: scene.instructionalObjective,
      required_visual_evidence: scene.evidenceExpectation,
      shot_size: /close|detail|inspect/i.test(scene.visualFocus ?? '')
        ? 'close-up'
        : 'medium-close',
      camera_move: 'dolly-in',
      transition: scene.transitionOut === 'crossfade' ? 'crossfade' : 'cut',
      source_authority: {
        dol_competency_id: scene.dolCompetencyId,
        state_requirement: scene.stateRequirement,
        exam_domain: scene.examDomain,
      },
    })),
  };
}

function persistedInstructionalScript(input: {
  lessonTitle: string;
  jobScript: string;
  contentJson: unknown;
}): string {
  const content =
    input.contentJson && typeof input.contentJson === 'object'
      ? (input.contentJson as Record<string, unknown>)
      : {};
  const experience =
    content.experience && typeof content.experience === 'object'
      ? (content.experience as Record<string, unknown>)
      : {};
  const readingGuide =
    experience.readingGuide && typeof experience.readingGuide === 'object'
      ? (experience.readingGuide as Record<string, unknown>)
      : {};
  const sections = Array.isArray(readingGuide.sections) ? readingGuide.sections : [];
  const sectionNarration = sections.flatMap((section) => {
    if (!section || typeof section !== 'object') return [];
    const row = section as Record<string, unknown>;
    return [row.heading, row.body].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );
  });
  const takeaways = Array.isArray(readingGuide.keyTakeaways)
    ? readingGuide.keyTakeaways.filter((value): value is string => typeof value === 'string')
    : [];
  const practicalTask =
    experience.practicalTask && typeof experience.practicalTask === 'object'
      ? (experience.practicalTask as Record<string, unknown>)
      : {};
  const practicalInstructions = Array.isArray(practicalTask.instructions)
    ? practicalTask.instructions.filter((value): value is string => typeof value === 'string')
    : [];

  return [
    `Today's lesson is ${input.lessonTitle}.`,
    input.jobScript,
    typeof readingGuide.summary === 'string' ? readingGuide.summary : '',
    ...sectionNarration,
    takeaways.length ? `Key takeaways: ${takeaways.join('. ')}.` : '',
    practicalInstructions.length
      ? `Apply the lesson in this order: ${practicalInstructions.join('. ')}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Render one already-claimed canonical video job. GPU generation is an optional
 * rendering mechanic for microclips; Remotion is the common fallback. Both
 * report terminal state through the same video_jobs identity. */
export async function processClaimedVideoJob(job: VideoJob): Promise<void> {
  // Start lease renewal before secret hydration, scene generation, and quality
  // planning. Those pre-render stages can call external providers and must not
  // leave an actively-owned job looking stale.
  let heartbeatRunning = false;
  const heartbeatTimer = job.lease_token
    ? setInterval(() => {
        if (heartbeatRunning) return;
        heartbeatRunning = true;
        void heartbeatJob(job)
          .then((renewed) => {
            if (!renewed)
              logger.warn('[video-worker] Rendering lease was not renewed', { jobId: job.id });
          })
          .catch((error) => {
            logger.error('[video-worker] Rendering heartbeat failed', error, { jobId: job.id });
          })
          .finally(() => {
            heartbeatRunning = false;
          });
      }, 60_000)
    : null;

  try {
    await hydrateMediaRuntimeSecrets();
    // Validate the canonical media route before scene planning or any GPU
    // request. A missing route must never consume rendering capacity or spend
    // GPU time only to fail later at narration.
    assertNarrationProviderConfigured();
    const db = createAdminClient();
    const { data: course } = await db
      .from('courses')
      .select(
        'title,org_id,program_id,compliance_profile_key,governing_body,governing_region,governing_standard_version',
      )
      .eq('id', job.course_id)
      .maybeSingle();
    const courseTitle = course?.title ?? 'Elevate LMS';
    let tenantId: string | null = null;
    if (course?.org_id) {
      const { data: organization } = await db
        .from('organizations')
        .select('tenant_id')
        .eq('id', course.org_id)
        .maybeSingle();
      tenantId = typeof organization?.tenant_id === 'string' ? organization.tenant_id : null;
    }
    const bulletPoints = Array.isArray(job.bullet_points) ? job.bullet_points : [];
    const persistedSceneData =
      job.scene_data && typeof job.scene_data === 'object'
        ? (job.scene_data as Record<string, unknown>)
        : {};
    const { data: lesson } = await db
      .from('course_lessons')
      .select(
        'content,content_json,domain_key,compliance_profile_key,lesson_type,evidence_type,video_config,script,script_text,learning_objectives',
      )
      .eq('id', job.lesson_id)
      .maybeSingle();
    const videoConfig =
      lesson?.video_config && typeof lesson.video_config === 'object'
        ? (lesson.video_config as Record<string, unknown>)
        : {};
    // The lesson is the canonical source of truth. Jobs can survive course
    // repairs and deployments, so their persisted script may contain stale
    // trade or instructor identity. Prefer the current governed narration and
    // keep the job copy only as a compatibility fallback.
    const baseScript =
      [
        // Course Builder synchronizes the full canonical narration into the
        // durable job. It must win over legacy lesson script columns, which may
        // contain only a short teaser from an older build.
        job.script,
        lesson?.script_text,
        lesson?.script,
        videoConfig.narration,
        videoConfig.transcript,
        job.lesson_title,
      ]
        .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
        ?.trim() ?? job.lesson_title;
    const configuredInstructorId =
      [videoConfig.instructorId, videoConfig.instructor_id]
        .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
        ?.trim() ?? '';
    const instructor = configuredInstructorId
      ? getInstructorById(configuredInstructorId)
      : getInstructorForCourse(courseTitle);
    const { data: program } = course?.program_id
      ? await db
          .from('programs')
          .select('occupation_code,category,track,type')
          .eq('id', course.program_id)
          .maybeSingle()
      : { data: null };
    const domainProfileKey =
      [
        persistedSceneData.domain_profile_key,
        lesson?.compliance_profile_key,
        course?.compliance_profile_key,
        program?.occupation_code,
        program?.track,
        program?.category,
        program?.type,
      ].find((value): value is string => typeof value === 'string' && value.trim().length > 0) ??
      null;
    const persistedScript =
      baseScript.split(/\s+/).filter(Boolean).length >= 180
        ? baseScript
        : persistedInstructionalScript({
            lessonTitle: job.lesson_title,
            jobScript: baseScript,
            contentJson: lesson?.content_json,
          });
    const repairedScript = repairInstructionalScript({
      lessonTitle: job.lesson_title,
      lessonType: lesson?.lesson_type,
      evidenceType: lesson?.evidence_type,
      baseScript: persistedScript,
      content: lesson?.content,
      contentJson: lesson?.content_json,
    });
    const script = repairedScript.script;
    if (repairedScript.repaired) {
      const now = new Date().toISOString();
      const [{ error: lessonRepairError }, { error: jobRepairError }] = await Promise.all([
        db
          .from('course_lessons')
          .update({
            script,
            script_text: script,
            video_status: 'rendering',
            video_error: null,
            updated_at: now,
          })
          .eq('id', job.lesson_id),
        db
          .from('video_jobs')
          .update({
            script,
            scene_data: null,
            error_message: null,
            updated_at: now,
          })
          .eq('id', job.id),
      ]);
      if (lessonRepairError || jobRepairError) {
        throw new Error(
          `Canonical narration repair could not be persisted: ${lessonRepairError?.message ?? jobRepairError?.message}`,
        );
      }
      logger.info('[video-worker] Automatically repaired undersized canonical narration', {
        jobId: job.id,
        lessonId: job.lesson_id,
        wordCount: repairedScript.wordCount,
        minimumWordCount: repairedScript.minimumWordCount,
      });
    }
    const suppliedScenes =
      !repairedScript.repaired &&
      Array.isArray(persistedSceneData.scenes) &&
      persistedSceneData.scenes.length > 0;
    let generatedPlan: LessonRenderPlanDraft | null = null;
    if (!suppliedScenes) {
      try {
        generatedPlan = await generateLessonScenes({
          lessonId: job.lesson_id,
          title: job.lesson_title,
          content: script,
          domainKey: domainProfileKey,
          occupationTitle: typeof program?.track === 'string' ? program.track : undefined,
          stateAuthority: course?.governing_body ?? undefined,
          stateStandardVersion: course?.governing_standard_version ?? undefined,
          stateRequirement:
            typeof lesson?.compliance_profile_key === 'string'
              ? lesson.compliance_profile_key
              : undefined,
          lessonType: lesson?.lesson_type ?? undefined,
          requiresPracticalEvidence:
            lesson?.evidence_type === 'practical' || lesson?.lesson_type === 'lab',
        });
      } catch (scenePlanError) {
        // Scene enrichment must never strand an otherwise complete persisted
        // course. directMedia() deterministically derives an evidence-bearing
        // storyboard from the governed narration when the optional AI provider
        // is unavailable, rate-limited, or misconfigured.
        logger.warn(
          '[video-worker] AI scene enrichment unavailable; using deterministic storyboard',
          {
            jobId: job.id,
            courseId: job.course_id,
            error:
              scenePlanError instanceof Error ? scenePlanError.message : String(scenePlanError),
          },
        );
      }
    }
    const sceneData = generatedPlan
      ? { ...persistedSceneData, ...generatedSceneData(generatedPlan) }
      : persistedSceneData;
    const isMicroclip = job.asset_kind === 'microclip';
    // Every render is an immutable candidate. Approval, not rendering, changes
    // the learner-facing lesson URL.
    const renderId = `${job.lesson_id}-${safeAssetKey(job.asset_key ?? job.id)}-${job.id}`;
    const characters = mediaCharacters(sceneData);
    const storyboard = directMedia({
      title: job.lesson_title,
      objective: bulletPoints[0] ?? job.lesson_title,
      script,
      sceneData,
      characters,
      defaultDurationSeconds: 5,
    });
    const instructionalQuality = enforceInstructionalQuality({
      courseTitle,
      lessonTitle: job.lesson_title,
      lessonType: lesson?.lesson_type,
      evidenceType: lesson?.evidence_type,
      script,
      learningObjectives: Array.isArray(lesson?.learning_objectives)
        ? lesson.learning_objectives.filter((value): value is string => typeof value === 'string')
        : bulletPoints,
      instructor,
      storyboard,
    });

    const primaryScene = storyboard.scenes[0];
    if (!primaryScene) throw new Error('MEDIA_STORYBOARD_EMPTY');

    // A single GPU clip is a valid terminal asset only for a single-scene plan.
    // Multi-scene instructional clips must continue to the compositor so the
    // remaining objective-aligned scenes are not discarded.
    // Direct GPU microclips do not currently produce the captions, transcript,
    // or multi-scene evidence required by the canonical quality gate. Keep this
    // expensive path opt-in until it can satisfy that same completion contract.
    if (isMicroclip && storyboard.scenes.length === 1 && (await gpuVideoAvailable())) {
      const scene = primaryScene;
      const requestedDuration = Math.min(15, Math.max(1, scene.durationSeconds));
      const gpuStartedAt = Date.now();
      let generated: Awaited<ReturnType<typeof generateGpuVideo>> = null;
      try {
        generated = await generateGpuVideo({
          prompt: scenePrompt(scene, storyboard.characters),
          operation: scene.operation,
          width: storyboard.width,
          height: storyboard.height,
          durationSeconds: requestedDuration,
          ...(scene.seed !== undefined ? { seed: scene.seed } : {}),
          ...(scene.referenceImageUrl ? { imageUrl: scene.referenceImageUrl } : {}),
          ...(scene.sourceVideoUrl ? { sourceVideoUrl: scene.sourceVideoUrl } : {}),
          ...(scene.negativePrompt ? { negativePrompt: scene.negativePrompt } : {}),
        });
        if (generated) {
          const buffer = await downloadGpuVideoAsset(generated);
          const videoUrl = await uploadLessonMediaBuffer(buffer, renderId, 'mp4');
          const renderSeconds = Math.max(0, (Date.now() - gpuStartedAt) / 1000);
          const outputSeconds = generated.durationSeconds ?? requestedDuration;
          const model = generated.provider === 'wan' ? 'Wan2.2-TI2V-5B' : 'LTX-Video';

          try {
            await Promise.all([
              recordPlatformUsage(db, {
                tenantId,
                source: 'video.gpu-worker',
                metric: 'video_generation_attempt',
                quantity: 1,
                unit: 'attempt',
                externalRef: job.id,
                idempotencyKey: `gpu-attempt:${job.id}:success`,
                metadata: {
                  provider: generated.provider,
                  operation: scene.operation,
                  success: true,
                  course_id: job.course_id,
                  lesson_id: job.lesson_id,
                  storyboard_hash: storyboard.promptHash,
                },
              }),
              recordPlatformUsage(db, {
                tenantId,
                source: 'video.gpu-worker',
                metric: 'gpu_video_seconds',
                quantity: outputSeconds,
                unit: 'second',
                externalRef: job.id,
                idempotencyKey: `gpu-video-seconds:${job.id}`,
                metadata: {
                  provider: generated.provider,
                  operation: scene.operation,
                  course_id: job.course_id,
                  lesson_id: job.lesson_id,
                },
              }),
              recordPlatformUsage(db, {
                tenantId,
                source: 'video.gpu-worker',
                metric: 'gpu_render_seconds',
                quantity: renderSeconds,
                unit: 'second',
                externalRef: job.id,
                idempotencyKey: `gpu-render-seconds:${job.id}`,
                metadata: {
                  provider: generated.provider,
                  operation: scene.operation,
                  course_id: job.course_id,
                  lesson_id: job.lesson_id,
                },
              }),
              recordPlatformUsage(db, {
                tenantId,
                source: 'video.gpu-worker',
                metric: 'gpu_output_bytes',
                quantity: buffer.length,
                unit: 'byte',
                externalRef: job.id,
                idempotencyKey: `gpu-output-bytes:${job.id}`,
                metadata: {
                  provider: generated.provider,
                  operation: scene.operation,
                  course_id: job.course_id,
                  lesson_id: job.lesson_id,
                },
              }),
              recordMediaProvenance(db, {
                tenantId,
                courseId: job.course_id,
                lessonId: job.lesson_id,
                videoJobId: job.id,
                storyboard,
                scene,
                provider: generated.provider,
                model,
                operation: scene.operation,
                referenceUrls: [scene.referenceImageUrl, scene.sourceVideoUrl].filter(
                  (value): value is string => Boolean(value),
                ),
                likenessConsentRecordIds: storyboard.characters
                  .map((character) => character.consentRecordId)
                  .filter((value): value is string => Boolean(value)),
                moderationDecision: 'approved',
                generatedAssetUrl: videoUrl,
                generatedBytes: buffer.length,
              }),
            ]);
          } catch (meterError) {
            logger.error(
              '[video-worker] GPU output succeeded but usage/provenance recording failed',
              meterError,
              {
                jobId: job.id,
                tenantId,
              },
            );
          }

          // The GPU clip is a scene candidate, not a terminal lesson asset.
          // Feed it through the compositor below so captions, transcript,
          // compression, and final quality evidence are always produced.
          Object.assign(scene, {
            sourceVideoUrl: videoUrl,
            resolvedProvider: generated.provider,
            resolvedModel: model,
          });
        }
      } catch (gpuError) {
        const gpuMessage = gpuError instanceof Error ? gpuError.message : String(gpuError);
        await db
          .from('video_jobs')
          .update({
            last_provider: 'gpu',
            last_provider_model: null,
            last_failure_at: new Date().toISOString(),
            error_message: `GPU fallback: ${gpuMessage}`.slice(0, 2000),
          })
          .eq('id', job.id);
        try {
          await recordPlatformUsage(db, {
            tenantId,
            source: 'video.gpu-worker',
            metric: 'video_generation_attempt',
            quantity: 1,
            unit: 'attempt',
            externalRef: job.id,
            idempotencyKey: `gpu-attempt:${job.id}:failed`,
            metadata: {
              success: false,
              operation: scene.operation,
              storyboard_hash: storyboard.promptHash,
              course_id: job.course_id,
              lesson_id: job.lesson_id,
              elapsed_seconds: Math.max(0, (Date.now() - gpuStartedAt) / 1000),
              error: gpuMessage.slice(0, 500),
            },
          });
        } catch (meterError) {
          logger.warn('[video-worker] Unable to meter failed GPU attempt', {
            jobId: job.id,
            error: meterError instanceof Error ? meterError.message : String(meterError),
          });
        }
        logger.warn('[video-worker] GPU scene failed; falling back to Remotion', {
          jobId: job.id,
          operation: scene.operation,
          error: gpuMessage,
        });
      } finally {
        if (generated) await deleteGpuVideoAsset(generated);
      }
    }

    const result = await renderStoryboardVideo({
      lessonId: renderId,
      courseTitle,
      storyboard,
      instructorId: instructor.id,
    });
    if (!result.success || !result.videoUrl) {
      await markFailed(job.id, result.error ?? 'Render returned no playable video URL', {
        provider: REMOTION_PROVIDER,
        provider_model: REMOTION_MODEL,
      });
      return;
    }
    const completedStoryboard = {
      ...(result.sceneData ?? storyboard),
      source_contract: persistedSceneData.source_contract ?? null,
    };
    await markCandidate(job.id, {
      video_url: result.videoUrl,
      ...(result.audioUrl ? { audio_url: result.audioUrl } : {}),
      ...(result.duration !== undefined ? { duration_seconds: result.duration } : {}),
      provider: REMOTION_PROVIDER,
      provider_model: storyboard.scenes.length > 1 ? 'SlideLesson' : REMOTION_MODEL,
      scene_count: storyboard.scenes.length,
      scene_data: completedStoryboard,
    });
    const qualityEvidence = await enforceMediaQuality({
      videoUrl: result.videoUrl,
      expectedDurationSeconds: result.duration ?? 0,
      expectedSceneCount: storyboard.scenes.length,
      sceneData: completedStoryboard,
      provider: REMOTION_PROVIDER,
      providerModel: storyboard.scenes.length > 1 ? 'SlideLesson' : REMOTION_MODEL,
      expectedScript: script,
      instructionalQuality,
    });
    const sourceContract = persistedSceneData.source_contract && typeof persistedSceneData.source_contract === 'object'
      ? persistedSceneData.source_contract as Record<string, unknown>
      : {};
    const expectedFingerprint = typeof sourceContract.fingerprint === 'string'
      ? sourceContract.fingerprint
      : '';
    const { data: currentLessonSource, error: currentLessonSourceError } = await db
      .from('course_lessons')
      .select('video_config')
      .eq('id', job.lesson_id)
      .maybeSingle();
    const currentVideoConfig = currentLessonSource?.video_config && typeof currentLessonSource.video_config === 'object'
      ? currentLessonSource.video_config as Record<string, unknown>
      : {};
    if (
      currentLessonSourceError ||
      !expectedFingerprint ||
      currentVideoConfig.source_fingerprint !== expectedFingerprint ||
      currentVideoConfig.narration_locked !== true
    ) {
      throw new Error('MEDIA_SOURCE_VERSION_MISMATCH');
    }
    await markComplete(job.id, {
      video_url: result.videoUrl,
      ...(result.audioUrl ? { audio_url: result.audioUrl } : {}),
      ...(result.duration !== undefined ? { duration_seconds: result.duration } : {}),
      provider: REMOTION_PROVIDER,
      provider_model: storyboard.scenes.length > 1 ? 'SlideLesson' : REMOTION_MODEL,
      scene_count: storyboard.scenes.length,
      scene_data: completedStoryboard,
      quality_evidence: qualityEvidence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[video-worker] Render failed', error, { jobId: job.id });
    await markFailed(job.id, message, { provider: 'video-worker' });
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}
