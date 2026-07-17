/**
 * POST /api/videos/external/complete
 *
 * Callback endpoint for external video generation systems.
 *
 * Auth:
 *   - Preferred: X-External-Video-Secret header must match EXTERNAL_VIDEO_WEBHOOK_SECRET
 *   - Fallback: admin session auth (apiRequireAdmin)
 *
 * Body:
 * {
 *   jobId: string,
 *   status: 'complete' | 'failed',
 *   videoUrl?: string,
 *   audioUrl?: string,
 *   durationSeconds?: number,
 *   sceneCount?: number,
 *   sceneData?: unknown,
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getJob, markComplete, markFailed } from '@/lib/video/job-queue';

export const runtime = 'nodejs';

function secretsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const configuredSecret = process.env.EXTERNAL_VIDEO_WEBHOOK_SECRET?.trim() ?? '';
  const providedSecret = request.headers.get('x-external-video-secret')?.trim() ?? '';

  // Prefer secret-based auth for machine-to-machine callbacks.
  if (configuredSecret && secretsMatch(configuredSecret, providedSecret)) {
    return true;
  }

  // Optional fallback for manual/admin testing.
  const auth = await apiRequireAdmin(request);
  return !auth.error;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const authorized = await isAuthorized(request);
  if (!authorized) {
    return safeError('Unauthorized callback', 401);
  }

  let body: {
    jobId?: string;
    status?: 'complete' | 'failed';
    videoUrl?: string;
    audioUrl?: string;
    durationSeconds?: number;
    sceneCount?: number;
    sceneData?: unknown;
    error?: string;
  };

  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const jobId = body.jobId?.trim();
  if (!jobId) return safeError('jobId is required', 400);

  const status = body.status;
  if (status !== 'complete' && status !== 'failed') {
    return safeError('status must be "complete" or "failed"', 400);
  }

  try {
    const job = await getJob(jobId);
    if (!job) return safeError('Job not found', 404);

    if (status === 'failed') {
      const message = body.error?.trim() || 'External video provider reported failure';
      await markFailed(jobId, message);
      return NextResponse.json({ ok: true, jobId, status: 'failed' });
    }

    if (!body.videoUrl?.trim()) {
      return safeError('videoUrl is required when status="complete"', 400);
    }

    await markComplete(jobId, {
      video_url: body.videoUrl.trim(),
      audio_url: body.audioUrl?.trim() || undefined,
      duration_seconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : undefined,
      scene_count: typeof body.sceneCount === 'number' ? body.sceneCount : undefined,
      scene_data: body.sceneData,
    });

    return NextResponse.json({ ok: true, jobId, status: 'complete' });
  } catch (error) {
    return safeInternalError(error, 'Failed to process external video callback');
  }
}
