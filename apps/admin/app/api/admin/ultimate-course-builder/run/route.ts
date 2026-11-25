import { recordCourseDispatch } from '@/lib/ultimate-course-builder/worker/dispatch-evidence';
import { inspectOrphanedPool } from '@/lib/ultimate-course-builder/worker/paris-monitor.mjs';
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
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => null);
  if (typeof body?.buildId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.buildId))
    return NextResponse.json({ error: 'A valid buildId is required' }, { status: 400 });
  // Unrelated Studio requests must not consume this administrator's resume quota.
  // Keep the strict limit and derive its scope only from the authenticated actor.
  const limited = await applyRateLimit(req, 'strict', { key: `course-resume:${auth.id}` });
  if (limited) return limited;
  try {
    const db = await requireAdminClient();
    const { data: build, error } = await db
      .from('ultimate_course_builds')
      .select('id,status,profile,updated_at')
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
    if (typeof build.updated_at !== 'string')
      return NextResponse.json({ error: 'The saved revision is unavailable. Refresh before changing the build.' }, { status: 409 });
    const profile = build.profile as Record<string, unknown>;
    // Claims require an explicit ownerPaused:false. An explicit pause and a
    // missing/unknown flag both fail closed, so an authenticated Resume must
    // record the explicit unpause in either case.
    if (profile?.ownerPaused !== false) {
      const now = new Date().toISOString();
      const resumed = await db
        .from('ultimate_course_builds')
        .update({
          profile: {
            ...profile,
            ownerPaused: false,
            pauseResumeAudit: {
              previousPauseFlag: profile?.ownerPaused ?? null,
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
        .eq('updated_at', build.updated_at)
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
      Boolean(job.lease_owner) &&
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
    if (job.attempts >= job.max_attempts) {
      return NextResponse.json({
        error: 'Retry budget exhausted. A verified source repair is required before another attempt.',
        jobId: job.id,
      }, { status: 409 });
    }
    if (job.status === 'running') {
      const now = new Date().toISOString();
      const recovery = await db
        .from('ultimate_build_jobs')
        .update({
          status: 'queued',
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
    // A pool that still says 'active' blocks the coordinator claim in SQL and
    // hides the job from the dispatcher, so a launch would be accepted and
    // then wait for a heartbeat that can never arrive. When that pool is
    // orphaned (failed stages, no live worker for hours), say so plainly and
    // route the root cause to PARIS instead of reporting a launch.
    const { data: pool } = await db
      .from('ultimate_autopilot_pools')
      .select('id,state,created_at,updated_at')
      .eq('build_id', build.id)
      .maybeSingle();
    if (pool?.state === 'active') {
      const { data: buildJobs } = await db
        .from('ultimate_build_jobs')
        .select('id,job_type,status,heartbeat_at,updated_at,lease_expires_at,payload')
        .eq('build_id', build.id)
        .limit(500);
      const orphan = inspectOrphanedPool(pool, buildJobs ?? []);
      if (orphan) {
        await recordCourseDispatch(db, job.id, { dispatched: false, launchMode: 'pool-orphaned' }, auth.id);
        try {
          const { enqueueParisRepair } = await import('@/lib/ai/runtime/code-repair');
          await enqueueParisRepair({
            actorId: auth.id,
            sourceJobId: job.id,
            goal:
              `Course Builder worker cannot start for build ${build.id}: its autopilot pool ${pool.id} is orphaned. ` +
              `${orphan.reason} Failed stage jobs: ${orphan.failedJobIds.join(', ')}. ` +
              'Repair the failed stages (or their producer code) so the pool can advance and the coordinator can claim. ' +
              'Preserve lesson IDs, approved content, licenses, quality gates and unrelated jobs.',
          });
        } catch {
          // The refusal below still names the root cause; a failed repair
          // enqueue must not turn an honest answer into a 500.
        }
        return NextResponse.json(
          {
            ok: true,
            queued: true,
            dispatched: false,
            launchBlocked: 'POOL_ORPHANED',
            buildId: build.id,
            jobId: job.id,
            message:
              'The build is safely queued, but no worker can start yet: ' +
              orphan.reason +
              ' A PARIS repair has been requested for the failed stages.',
          },
          { status: 202 },
        );
      }
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
