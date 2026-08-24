import 'server-only';

import { getInstructorForCourse } from '@/lib/ai-instructors';
import { logger } from '@/lib/logger';
import { recordPlatformUsage } from '@/lib/platform/usage-metering';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  deleteGpuVideoAsset,
  downloadGpuVideoAsset,
  generateGpuVideo,
  gpuVideoAvailable,
} from './gpu-video-client';
import { markComplete, markFailed, type VideoJob } from './job-queue';
import { enforceMediaQuality } from './media-quality-gate';
import { directMedia, scenePrompt, type MediaCharacterReference } from './media-director';
import { recordMediaProvenance } from './media-provenance';
import { inferDomainKey, renderLessonVideo, renderStoryboardVideo } from './remotion-render';
import { uploadLessonMediaBuffer } from './upload-lesson-media';

const REMOTION_PROVIDER = 'remotion';
const REMOTION_MODEL = 'ElevateLesson';

async function hydrateMediaRuntimeSecrets(): Promise<void> {
  const missing = ['ELEVENLABS_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'PEXELS_API_KEY', 'DID_API_KEY'].filter(
    (key) => !process.env[key]?.trim(),
  );
  if (!missing.length) return;
  const db = createAdminClient();
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
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'clip';
}

function mediaCharacters(sceneData: Record<string, unknown>): MediaCharacterReference[] {
  if (!Array.isArray(sceneData.characters)) return [];
  return sceneData.characters
    .filter((value): value is Record<string, unknown> => Boolean(value && typeof value === 'object'))
    .map((value, index) => ({
      id: typeof value.id === 'string' && value.id ? value.id : `character-${index + 1}`,
      name: typeof value.name === 'string' ? value.name : undefined,
      referenceImageUrl: typeof value.reference_image_url === 'string' ? value.reference_image_url : undefined,
      appearancePrompt: typeof value.appearance_prompt === 'string' ? value.appearance_prompt : undefined,
      voiceId: typeof value.voice_id === 'string' ? value.voice_id : undefined,
      consentRecordId: typeof value.consent_record_id === 'string' ? value.consent_record_id : undefined,
    }));
}

/** Render one already-claimed canonical video job. GPU generation is an optional
 * rendering mechanic for microclips; Remotion is the common fallback. Both
 * report terminal state through the same video_jobs identity. */
export async function processClaimedVideoJob(job: VideoJob): Promise<void> {
  await hydrateMediaRuntimeSecrets();
  const db = createAdminClient();
  const { data: course } = await db
    .from('courses')
    .select('title,org_id')
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
  const instructor = getInstructorForCourse(courseTitle);
  const script = job.script?.trim() || job.lesson_title;
  const bulletPoints = Array.isArray(job.bullet_points) ? job.bullet_points : [];
  const sceneData = job.scene_data && typeof job.scene_data === 'object' ? (job.scene_data as Record<string, unknown>) : {};
  const isMicroclip = job.asset_kind === 'microclip';
  const renderId = isMicroclip ? `${job.lesson_id}-${safeAssetKey(job.asset_key ?? job.id)}` : job.lesson_id;
  const characters = mediaCharacters(sceneData);
  const storyboard = directMedia({
    title: job.lesson_title,
    objective: bulletPoints[0] ?? job.lesson_title,
    script,
    sceneData,
    characters,
    defaultDurationSeconds: 5,
  });

  try {
    // A single GPU clip is a valid terminal asset only for a single-scene plan.
    // Multi-scene instructional clips must continue to the compositor so the
    // remaining objective-aligned scenes are not discarded.
    if (isMicroclip && storyboard.scenes.length === 1 && (await gpuVideoAvailable())) {
      const scene = storyboard.scenes[0];
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
          seed: scene.seed,
          imageUrl: scene.referenceImageUrl,
          sourceVideoUrl: scene.sourceVideoUrl,
          negativePrompt: scene.negativePrompt,
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
                metadata: { provider: generated.provider, operation: scene.operation, course_id: job.course_id, lesson_id: job.lesson_id },
              }),
              recordPlatformUsage(db, {
                tenantId,
                source: 'video.gpu-worker',
                metric: 'gpu_render_seconds',
                quantity: renderSeconds,
                unit: 'second',
                externalRef: job.id,
                idempotencyKey: `gpu-render-seconds:${job.id}`,
                metadata: { provider: generated.provider, operation: scene.operation, course_id: job.course_id, lesson_id: job.lesson_id },
              }),
              recordPlatformUsage(db, {
                tenantId,
                source: 'video.gpu-worker',
                metric: 'gpu_output_bytes',
                quantity: buffer.length,
                unit: 'byte',
                externalRef: job.id,
                idempotencyKey: `gpu-output-bytes:${job.id}`,
                metadata: { provider: generated.provider, operation: scene.operation, course_id: job.course_id, lesson_id: job.lesson_id },
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
                referenceUrls: [scene.referenceImageUrl, scene.sourceVideoUrl].filter((value): value is string => Boolean(value)),
                likenessConsentRecordIds: storyboard.characters.map((character) => character.consentRecordId).filter((value): value is string => Boolean(value)),
                moderationDecision: 'approved',
                generatedAssetUrl: videoUrl,
                generatedBytes: buffer.length,
              }),
            ]);
          } catch (meterError) {
            logger.error('[video-worker] GPU output succeeded but usage/provenance recording failed', meterError, {
              jobId: job.id,
              tenantId,
            });
          }

          await enforceMediaQuality({
            videoUrl,
            expectedDurationSeconds: outputSeconds,
            expectedSceneCount: 1,
            sceneData: storyboard,
            provider: generated.provider,
            providerModel: model,
          });
          await markComplete(job.id, {
            video_url: videoUrl,
            duration_seconds: outputSeconds,
            provider: generated.provider,
            provider_model: model,
            scene_count: 1,
            scene_data: storyboard,
          });
          return;
        }
      } catch (gpuError) {
        const gpuMessage = gpuError instanceof Error ? gpuError.message : String(gpuError);
        await db.from('video_jobs').update({
          last_provider: 'gpu',
          last_provider_model: null,
          last_failure_at: new Date().toISOString(),
          error_message: `GPU fallback: ${gpuMessage}`.slice(0, 2000),
        }).eq('id', job.id);
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

    const primaryScene = storyboard.scenes[0];
    const result = storyboard.scenes.length > 1
      ? await renderStoryboardVideo({
          lessonId: renderId,
          courseTitle,
          storyboard,
          instructorId: instructor.id,
        })
      : await renderLessonVideo({
          lessonId: renderId,
          title: job.lesson_title,
          moduleTitle: courseTitle,
          objective: bulletPoints[0] ?? job.lesson_title,
          keyPoints: bulletPoints.length
            ? bulletPoints.slice(0, 5)
            : script.split(/\.\s+/).filter(Boolean).slice(0, 5),
          example: isMicroclip ? script : script.slice(0, 700),
          summary: isMicroclip
            ? 'Review the key idea, then apply it in the lesson activity.'
            : script.slice(-500),
          quizTeaser: isMicroclip
            ? 'Return to the lesson and apply this concept.'
            : 'Complete the knowledge check and review any missed objectives to continue.',
          domainKey: inferDomainKey(courseTitle, job.lesson_title),
          instructorId: instructor.id,
          courseName: courseTitle,
          visualPrompt: scenePrompt(primaryScene, storyboard.characters),
        });
    if (!result.success || !result.videoUrl) {
      await markFailed(job.id, result.error ?? 'Render returned no playable video URL', {
        provider: REMOTION_PROVIDER,
        provider_model: REMOTION_MODEL,
      });
      return;
    }
    const completedStoryboard = result.sceneData ?? storyboard;
    await enforceMediaQuality({
      videoUrl: result.videoUrl,
      expectedDurationSeconds: result.duration ?? 0,
      expectedSceneCount: storyboard.scenes.length,
      sceneData: completedStoryboard,
      provider: REMOTION_PROVIDER,
      providerModel: storyboard.scenes.length > 1 ? 'SlideLesson' : REMOTION_MODEL,
    });
    await markComplete(job.id, {
      video_url: result.videoUrl,
      audio_url: result.audioUrl ?? undefined,
      duration_seconds: result.duration,
      provider: REMOTION_PROVIDER,
      provider_model: storyboard.scenes.length > 1 ? 'SlideLesson' : REMOTION_MODEL,
      scene_count: storyboard.scenes.length,
      scene_data: completedStoryboard,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[video-worker] Render failed', error, { jobId: job.id });
    await markFailed(job.id, message, { provider: 'video-worker' });
  }
}
