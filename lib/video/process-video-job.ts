import 'server-only';

import { getInstructorForCourse } from '@/lib/ai-instructors';
import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { markComplete, markFailed, type VideoJob } from './job-queue';
import { inferDomainKey, renderLessonVideo } from './remotion-render';

async function hydrateMediaRuntimeSecrets(): Promise<void> {
  const missing = ['ELEVENLABS_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'PEXELS_API_KEY'].filter(
    (key) => !process.env[key]?.trim(),
  );
  if (!missing.length) return;

  const db = createAdminClient();
  for (const key of missing) {
    try {
      const { data, error } = await db.rpc('get_platform_secret', { p_key: key });
      if (!error && typeof data === 'string' && data.trim()) {
        process.env[key] = data.trim();
      }
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

/** Render one already-claimed video job using the universal Elevate pipeline. */
export async function processClaimedVideoJob(job: VideoJob): Promise<void> {
  await hydrateMediaRuntimeSecrets();

  const db = createAdminClient();
  const { data: course } = await db
    .from('courses')
    .select('title')
    .eq('id', job.course_id)
    .maybeSingle();
  const courseTitle = course?.title ?? 'Elevate LMS';
  const instructor = getInstructorForCourse(courseTitle);
  const script = job.script?.trim() || job.lesson_title;
  const bulletPoints = Array.isArray(job.bullet_points) ? job.bullet_points : [];
  const sceneData =
    job.scene_data && typeof job.scene_data === 'object'
      ? (job.scene_data as Record<string, unknown>)
      : {};
  const isMicroclip = job.asset_kind === 'microclip';
  const renderId = isMicroclip
    ? `${job.lesson_id}-${safeAssetKey(job.asset_key ?? job.id)}`
    : job.lesson_id;

  try {
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
      visualPrompt:
        typeof sceneData.visual_prompt === 'string' ? sceneData.visual_prompt : undefined,
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
