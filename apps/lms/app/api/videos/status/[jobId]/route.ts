/**
 * GET /api/videos/status/:job_id
 *
 * Poll endpoint for video render progress.
 * Returns job status, video_url when complete, and error when failed.
 *
 * Statuses: draft | queued | rendering | complete | failed
 *
 * Admin course builder polls this every 5s after calling /api/videos/generate.
 * PUBLIC ROUTE for the LMS lesson page (students need to check if video is ready).
 * Auth is checked — unauthenticated users get a 401.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { getJob } from '@/lib/video/job-queue';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  const { jobId } = await params;
  if (!jobId) return safeError('job_id is required', 400);

  const job = await getJob(jobId);
  if (!job) return safeError('Job not found', 404);

  // Calculate elapsed time for in-progress jobs
  const elapsedMs = job.started_at ? Date.now() - new Date(job.started_at).getTime() : null;

  return NextResponse.json({
    job_id: job.id,
    lesson_id: job.lesson_id,
    status: job.status,
    video_url: job.video_url,
    audio_url: job.audio_url,
    duration_seconds: job.duration_seconds,
    scene_count: job.scene_count,
    error: job.error_message,
    elapsed_seconds: elapsedMs ? Math.round(elapsedMs / 1000) : null,
    queued_at: job.queued_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
  });
}
