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
import { inferDomainKey, renderLessonVideo } from './remotion-render';
import { uploadLessonMediaBuffer } from './upload-lesson-media';

async function hydrateMediaRuntimeSecrets(): Promise<void> {
  const missing = ['ELEVENLABS_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'PEXELS_API_KEY'].filter(
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

/** Render one already-claimed video job using local generative scenes when available, with Remotion as the zero-failure fallback. */
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

  try {
    // Microclips are the cinematic insert layer. Prefer self-hosted Wan/LTX, but
    // never make learner-critical media dependent on GPU capacity. The GPU
    // service is intentionally not trusted with storage credentials: Admin
    // downloads the generated MP4, persists it through canonical course media
    // storage, then deletes the GPU worker's temporary asset.
    if (isMicroclip && (await gpuVideoAvailable())) {
      const visualPrompt = typeof sceneData.visual_prompt === 'string' ? sceneData.visual_prompt : script;
      const requestedDuration = Math.min(15, Math.max(3, Number(sceneData.duration_seconds) || 5));
      const gpuStartedAt = Date.now();
      let generated: Awaited<ReturnType<typeof generateGpuVideo>> = null;
      try {
        generated = await generateGpuVideo({
          prompt: visualPrompt,
          durationSeconds: requestedDuration,
        });
        if (generated) {
          const buffer = await downloadGpuVideoAsset(generated);
          const videoUrl = await uploadLessonMediaBuffer(buffer, renderId, 'mp4');
          const renderSeconds = Math.max(0, (Date.now() - gpuStartedAt) / 1000);
          const outputSeconds = generated.durationSeconds ?? requestedDuration;

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
                metadata: { provider: generated.provider, success: true, course_id: job.course_id, lesson_id: job.lesson_id },
              }),
              recordPlatformUsage(db, {
                tenantId,
                source: 'video.gpu-worker',
                metric: 'gpu_video_seconds',
                quantity: outputSeconds,
                unit: 'second',
                externalRef: job.id,
                idempotencyKey: `gpu-video-seconds:${job.id}`,
                metadata: { provider: generated.provider, course_id: job.course_id, lesson_id: job.lesson_id },
              }),
              recordPlatformUsage(db, {
                tenantId,
                source: 'video.gpu-worker',
                metric: 'gpu_render_seconds',
                quantity: renderSeconds,
                unit: 'second',
                externalRef: job.id,
                idempotencyKey: `gpu-render-seconds:${job.id}`,
                metadata: { provider: generated.provider, course_id: job.course_id, lesson_id: job.lesson_id },
              }),
              recordPlatformUsage(db, {
                tenantId,
                source: 'video.gpu-worker',
                metric: 'gpu_output_bytes',
                quantity: buffer.length,
                unit: 'byte',
                externalRef: job.id,
                idempotencyKey: `gpu-output-bytes:${job.id}`,
                metadata: { provider: generated.provider, course_id: job.course_id, lesson_id: job.lesson_id },
              }),
            ]);
          } catch (meterError) {
            logger.error('[video-worker] GPU output succeeded but usage metering failed', meterError, {
              jobId: job.id,
              tenantId,
            });
          }

          await markComplete(job.id, {
            video_url: videoUrl,
            duration_seconds: outputSeconds,
          });
          return;
        }
      } catch (gpuError) {
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
              course_id: job.course_id,
              lesson_id: job.lesson_id,
              elapsed_seconds: Math.max(0, (Date.now() - gpuStartedAt) / 1000),
              error: gpuError instanceof Error ? gpuError.message.slice(0, 500) : String(gpuError).slice(0, 500),
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
          error: gpuError instanceof Error ? gpuError.message : String(gpuError),
        });
      } finally {
        if (generated) await deleteGpuVideoAsset(generated);
      }
    }

    const result = await renderLessonVideo({
      lessonId: renderId,
      title: job.lesson_title,
      moduleTitle: courseTitle,
      objective: bulletPoints[0] ?? job.lesson_title,
      keyPoints: bulletPoints.length
        ? bulletPoints.slice(0, 5)
        : script.split(/\.\s+/).filter(Boolean).slice(0, 5),
      example: isMicroclip ? script : script.slice(0, 700),
      summary: isMicroclip ? 'Review the key idea, then apply it in the lesson activity.' : script.slice(-500),
      quizTeaser: isMicroclip
        ? 'Return to the lesson and apply this concept.'
        : 'Complete the knowledge check and review any missed objectives to continue.',
      domainKey: inferDomainKey(courseTitle, job.lesson_title),
      instructorId: instructor.id,
      courseName: courseTitle,
      visualPrompt: typeof sceneData.visual_prompt === 'string' ? sceneData.visual_prompt : undefined,
    });
    if (!result.success || !result.videoUrl) {
      await markFailed(job.id, result.error ?? 'Render returned no playable video URL');
      return;
    }
    await markComplete(job.id, {
      video_url: result.videoUrl,
      audio_url: result.audioUrl ?? undefined,
      duration_seconds: result.duration,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[video-worker] Render failed', error, { jobId: job.id });
    await markFailed(job.id, message);
  }
}
