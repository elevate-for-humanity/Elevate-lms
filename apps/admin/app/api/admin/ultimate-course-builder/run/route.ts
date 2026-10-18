import { recordCourseDispatch } from '@/lib/ultimate-course-builder/worker/dispatch-evidence';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { UltimateJobQueue } from '@/lib/ultimate-course-builder/worker/job-queue';
import { requestCourseWorker } from '@/lib/gcp/course-worker-launch';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => null);
  if (typeof body?.buildId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.buildId))
    return NextResponse.json({ error: 'A valid buildId is required' }, { status: 400 });
  try {
    const db = await requireAdminClient();
    const { data: build, error } = await db
      .from('ultimate_course_builds')
      .select('id,status,profile')
      .eq('id', body.buildId)
      .single();
    if (error || !build)
      return NextResponse.json({ error: 'Ultimate build not found' }, { status: 404 });
    if (['built', 'published', 'archived'].includes(build.status))
      return NextResponse.json(
        { error: 'This build has finished. Use the verified release action.' },
        { status: 409 },
      );
    // An explicit authenticated Resume must clear a saved production pause.
    // Record the real authenticated actor; the legacy flag alone proves no actor.
    const profile = build.profile as Record<string, unknown>;
    if (profile?.ownerPaused === true) {
      const now = new Date().toISOString();
      const resumed = await db
        .from('ultimate_course_builds')
        .update({
          profile: {
            ...profile,
            ownerPaused: false,
            pauseResumeAudit: {
              previousPauseFlag: true,
              resumedBy: auth.id,
              resumedAt: now,
              action: 'explicit-admin-resume',
            },
          },
          updated_at: now,
        })
        .eq('id', build.id)
        .in('status', [
          'initializing',
          'queued',
          'running',
          'blocked',
          'failed',
          'built_with_findings',
        ])
        .eq('profile', JSON.stringify(profile))
        .select('id');
      if (resumed.error || resumed.data?.length !== 1)
        return NextResponse.json(
          { error: 'The saved build changed. Refresh before resuming; no worker was launched.' },
          { status: 409 },
        );
    }
    // Enqueue is idempotent: keep the same checkpoints and any existing lease.
    let job = await new UltimateJobQueue(db as any).enqueue(build.id, { requestedBy: auth.id });
    if (!job)
      return NextResponse.json({ error: 'No runnable build job was saved' }, { status: 409 });
    if (
      job.status === 'running' &&
      Date.parse(job.lease_expires_at ?? '') > Date.now() &&
      Date.now() - Date.parse(job.heartbeat_at ?? '') >= 0 &&
      Date.now() - Date.parse(job.heartbeat_at ?? '') < 90000
    )
      return NextResponse.json({
        ok: true,
        alreadyRunning: true,
        executionVerified: true,
        message: 'The existing worker is active. No duplicate execution was started.',
      });
    if (job.status === 'running' && Date.parse(job.lease_expires_at ?? '') > Date.now())
      return NextResponse.json(
        {
          error:
            'The existing worker still holds its lease. Refresh its heartbeat before requesting recovery.',
        },
        { status: 409 },
      );
    if (job.status === 'running' || job.attempts >= job.max_attempts) {
      const now = new Date().toISOString();
      const recovery = await db
        .from('ultimate_build_jobs')
        .update({
          status: 'queued',
          attempts: 0,
          execution_generation: job.execution_generation + 1,
          lease_owner: null,
          lease_expires_at: null,
          available_at: now,
          last_error: null,
          payload: { ...job.payload, requestedBy: auth.id },
          updated_at: now,
        })
        .eq('id', job.id)
        .eq('status', job.status)
        .eq('execution_generation', job.execution_generation)
        .or('lease_expires_at.is.null,lease_expires_at.lt.' + now)
        .select('*')
        .single();
      if (recovery.error || !recovery.data)
        return NextResponse.json(
          { error: 'The worker state changed. Refresh before requesting recovery.' },
          { status: 409 },
        );
      job = recovery.data;
    }
    const dispatch = await requestCourseWorker();
    const dispatchEvidenceSaved = await recordCourseDispatch(db, job.id, dispatch, auth.id);
    // A persisted queue request is not a live execution. Surface a retryable
    // service error when both launch paths fail instead of a misleading 202.
    if (!dispatch.dispatched) {
      return NextResponse.json(
        {
          ok: false,
          queued: true,
          dispatched: false,
          buildId: build.id,
          jobId: job.id,
          error:
            'The build is safely queued, but Google worker launch failed. ' +
            'Check the Admin Google service identity (run.jobs.run) and GitHub dispatch credentials.',
          dispatchError:
            'dispatchError' in dispatch
              ? dispatch.dispatchError
              : 'COURSE_WORKER_LAUNCH_UNAVAILABLE',
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        ok: true,
        queued: true,
        buildId: build.id,
        jobId: job.id,
        ...dispatch, dispatchEvidenceSaved,
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Google GitHub dispatch refused: HTTP 401')
      return safeInternalError(
        error,
        'Course Builder worker dispatch authentication rejected',
        'Worker launch authentication was rejected. Refresh the GitHub connection in Studio, then Resume. Your saved build is preserved.',
      );
    return safeInternalError(
      error,
      'Course Builder worker dispatch failed',
      'The worker launch failed. Your saved build is preserved. Check deployment access and retry Resume.',
    );
  }
}
