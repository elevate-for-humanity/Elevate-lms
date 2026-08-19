import { logger } from '@/lib/logger';
/**
 * POST /api/videos/regenerate
 *
 * Re-queues a video render for a lesson that previously failed or
 * whose video needs to be refreshed after script/content changes.
 *
 * Creates a new video_jobs row (preserving history) and fires a fresh render.
 * The old job row is left intact for audit purposes.
 *
 * Input:  { lesson_id: string }
 * Output: { job_id, status: 'queued' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { resetJob, markRendering, markComplete, markFailed } from '@/lib/video/job-queue';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { readFile, unlink } from 'fs/promises';
import path from 'path';

// Keep Remotion/Rspack native binaries out of the LMS webpack graph. The
// renderer is loaded only when an authenticated admin actually requests a
// regeneration, matching the canonical Admin video-generation boundary.
type RemotionRender = typeof import('@/lib/video/remotion-render');
let remotionRender: RemotionRender | null = null;
async function getRemotionRender(): Promise<RemotionRender> {
  if (!remotionRender) {
    remotionRender = await import('@/lib/video/remotion-render');
  }
  return remotionRender;
}

export const runtime = 'nodejs';
export const maxDuration = 600;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let lessonId: string;
  try {
    const body = await request.json();
    lessonId = body.lesson_id;
    if (!lessonId) return safeError('lesson_id is required', 400);
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const supabase = await createClient();
  const adminDb = await requireAdminClient();

  const { data: lesson } = await supabase
    .from('course_lessons')
    .select('id, title, script, bullet_points, course_id, video_status')
    .eq('id', lessonId)
    .maybeSingle();

  if (!lesson) return safeError('Lesson not found', 404);
  if (lesson.video_status === 'rendering') return safeError('Video is already rendering', 409);

  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', lesson.course_id)
    .maybeSingle();

  const job = await resetJob(lessonId, lesson.course_id);

  runRender({
    jobId: job.id,
    lessonId,
    courseTitle: course?.title ?? 'Elevate LMS',
    lessonTitle: lesson.title,
    script: lesson.script ?? lesson.title,
    bulletPoints: Array.isArray(lesson.bullet_points) ? lesson.bullet_points : [],
    adminDb,
  }).catch((err) => {
    logger.error('[VideoRegenerate] Background render threw', normalizeError(err, 'Video regeneration error'), getErrorContext(err));
  });

  return NextResponse.json(
    {
      success: true,
      job_id: job.id,
      status: 'queued',
      message: 'Video re-render queued. Poll /api/videos/status/' + job.id,
    },
    { status: 202 },
  );
}

async function runRender(opts: {
  jobId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  script: string;
  bulletPoints: string[];
  adminDb: NonNullable<Awaited<ReturnType<typeof requireAdminClient>>>;
}) {
  const { jobId, lessonId, courseTitle, lessonTitle, script, bulletPoints, adminDb } = opts;

  await markRendering(jobId);

  try {
    const { renderLessonVideo, inferDomainKey } = await getRemotionRender();
    const result = await renderLessonVideo({
      lessonId,
      title: lessonTitle,
      moduleTitle: courseTitle,
      objective: lessonTitle,
      keyPoints: bulletPoints.length
        ? bulletPoints
        : script.split(/\.\s+/).filter(Boolean).slice(0, 5),
      example: script.substring(0, 300),
      summary: script.substring(0, 150),
      quizTeaser: 'Complete the knowledge check to continue.',
      domainKey: inferDomainKey(courseTitle, lessonTitle),
      courseName: courseTitle,
    });

    if (!result.success || !result.videoUrl) {
      await markFailed(jobId, result.error ?? 'Render returned no video URL');
      return;
    }

    const localPath = path.join(process.cwd(), 'public', result.videoUrl);
    let storageUrl = result.videoUrl;

    try {
      const buffer = await readFile(localPath);
      const storagePath = `lessons/${lessonId}/lesson-video.mp4`;
      const { error: uploadErr } = await adminDb.storage
        .from('course-videos')
        .upload(storagePath, buffer, { contentType: 'video/mp4', upsert: true });

      if (!uploadErr) {
        const { data: urlData } = adminDb.storage.from('course-videos').getPublicUrl(storagePath);
        storageUrl = urlData.publicUrl;
        await unlink(localPath).then(() => {}, () => {});
      }
    } catch {
      /* keep local URL */
    }

    await markComplete(jobId, {
      video_url: storageUrl,
      audio_url: result.audioUrl ?? undefined,
      duration_seconds: result.duration,
    });
  } catch (err) {
    const failMsg = err instanceof Error ? err.message : String(err);
    await markFailed(jobId, failMsg);
  }
}
