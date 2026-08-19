import 'server-only';

import { getInstructorForCourse } from '@/lib/ai-instructors';
import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { markComplete, markFailed, type VideoJob } from './job-queue';

// Remotion reaches @rspack native binaries and edge-tts TypeScript sources.
// Keep the renderer behind a runtime-only dynamic boundary so importing the
// queue processor does not force Next/Webpack to parse those dependencies.
type RemotionRender = typeof import('./remotion-render');
let remotionRender: RemotionRender | null = null;
async function getRemotionRender(): Promise<RemotionRender> {
  if (!remotionRender) {
    remotionRender = await import('./remotion-render');
  }
  return remotionRender;
}

/** Render one already-claimed video job using the universal Elevate pipeline. */
export async function processClaimedVideoJob(job: VideoJob): Promise<void> {
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

  try {
    const { inferDomainKey, renderLessonVideo } = await getRemotionRender();
    const result = await renderLessonVideo({
      lessonId: job.lesson_id,
      title: job.lesson_title,
      moduleTitle: courseTitle,
      objective: bulletPoints[0] ?? job.lesson_title,
      keyPoints: bulletPoints.length
        ? bulletPoints.slice(0, 5)
        : script.split(/\.\s+/).filter(Boolean).slice(0, 5),
      example: script.slice(0, 700),
      summary: script.slice(-500),
      quizTeaser: 'Complete the knowledge check and review any missed objectives to continue.',
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
