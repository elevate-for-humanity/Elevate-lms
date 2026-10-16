import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { ULTIMATE_BUILD_STEPS } from '@/lib/ultimate-course-builder/core/types';
import { validateStepOutput } from '@/lib/ultimate-course-builder/core/lesson-contract';
import { routeSelectiveRepairs } from '@/lib/ultimate-course-builder/core/repair-router';
import { renderMediaUrl, renderPlaybackUrl } from '@/lib/ultimate-course-builder/media/playback-source.mjs';
import { requestCourseWorker } from '@/lib/gcp/course-worker-launch';
import { safeInternalError } from '@/lib/api/safe-error';
import { checkpointRepairPayload } from '@/lib/ultimate-course-builder/worker/live-checkpoint-repair';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9-]{36}$/i.test(v);
function valid(input: any) { return uuid(input.buildId) && uuid(input.lessonBuildId) && ULTIMATE_BUILD_STEPS.includes(input.step); }
async function context(db: any, input: any) {
  const [build, lesson, steps, jobs] = await Promise.all([
    db.from('ultimate_course_builds').select('id,status,profile').eq('id', input.buildId).single(),
    db.from('ultimate_lesson_builds').select('id,competency_id,status,artifacts').eq('id', input.lessonBuildId).eq('build_id', input.buildId).single(),
    db.from('ultimate_lesson_steps').select('step,state,findings,completed_at').eq('lesson_build_id', input.lessonBuildId),
    db.from('ultimate_build_jobs').select('*').eq('build_id', input.buildId).eq('job_type', 'course_build').order('created_at', { ascending: false }).limit(30),
  ]);
  for (const result of [build, lesson, steps, jobs]) if (result.error) throw result.error;
  return { build: build.data, lesson: lesson.data, steps: steps.data ?? [], job: (jobs.data ?? []).find((job: any) => ['running', 'queued', 'waiting_for_dependency'].includes(job.status)) ?? jobs.data?.[0] };
}
export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req); if (auth.error) return auth.error;
  const input = Object.fromEntries(req.nextUrl.searchParams);
  if (!valid(input)) return NextResponse.json({ error: 'Select a valid lesson checkpoint.' }, { status: 400 });
  try {
    const db = await requireAdminClient(); const c = await context(db, input);
    const step = c.steps.find((s: any) => s.step === input.step);
    const findings = step?.findings ?? [];
    const missing = validateStepOutput(input.step as any, c.lesson.artifacts?.[input.step] ?? {});
    const predecessors = ULTIMATE_BUILD_STEPS.slice(0, ULTIMATE_BUILD_STEPS.indexOf(input.step as any));
    const prerequisites = predecessors.filter(p => !c.steps.some((s: any) => s.step === p && s.state === 'passed'));
    const competency = c.build.profile.competencies?.find((x: any) => x.id === c.lesson.competency_id);
    let videoUrl = renderMediaUrl(c.lesson.artifacts?.lesson_film_render?.render) ?? renderPlaybackUrl(c.lesson.artifacts?.lesson_film_render?.render);
    let historicalVersion: number | null = null;
    if (!videoUrl) {
      const artifact = await db.from('ultimate_artifacts').select('id').eq('build_id', input.buildId)
        .eq('lesson_build_id', input.lessonBuildId).eq('stage', 'lesson_film_render').eq('artifact_type', 'stage_output').maybeSingle();
      if (artifact.error) throw artifact.error;
      if (artifact.data?.id) {
        const versions = await db.from('ultimate_artifact_versions').select('version,content')
          .eq('artifact_id', artifact.data.id).order('version', { ascending: false }).limit(20);
        if (versions.error) throw versions.error;
        for (const version of versions.data ?? []) {
          videoUrl = renderMediaUrl(version.content?.render) ?? renderPlaybackUrl(version.content?.render);
          if (videoUrl) { historicalVersion = version.version; break; }
        }
      }
    }
    return NextResponse.json({ diagnostic: { lessonTitle: competency?.title ?? competency?.description ?? 'Lesson',
      state: step?.state ?? 'not_started', findings, missingEvidence: missing, prerequisites,
      awaitingPrerequisites: step?.state !== 'failed' && step?.state !== 'passed' && missing.length > 0,
      repairTargets: routeSelectiveRepairs(findings), completedAt: step?.completed_at ?? null,
      videoUrl, historicalVersion,
      mediaApproved: historicalVersion === null && c.lesson.artifacts?.finished_media_qa?.mediaQA?.pass === true,
      workerStatus: c.job?.status ?? 'not_started', heartbeatAt: c.job?.heartbeat_at ?? null,
    } });
  } catch (e) { return safeInternalError(e, 'Checkpoint diagnostic failed', 'The checkpoint diagnostic could not be loaded. Saved work is unchanged.'); }
}
export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req); if (auth.error) return auth.error;
  const input = await req.json().catch(() => null);
  if (!valid(input ?? {})) return NextResponse.json({ error: 'Select a valid lesson checkpoint.' }, { status: 400 });
  let queued = false;
  try {
    const db = await requireAdminClient(); const c = await context(db, input);
    if (c.build.status === 'published') return NextResponse.json({ error: 'Create a new draft revision before repairing a published course.' }, { status: 409 });
    if (!c.job) return NextResponse.json({ error: 'Start this course before requesting checkpoint repair.' }, { status: 409 });
    const index = c.build.profile.competencies?.findIndex((x: any) => x.id === c.lesson.competency_id);
    if (!(index >= 0)) return NextResponse.json({ error: 'This lesson is not in the saved course plan.' }, { status: 409 });
    const checkpoint = c.steps.find((s: any) => s.step === input.step);
    if (checkpoint?.state === 'passed' && !(checkpoint.findings ?? []).length) {
      return NextResponse.json({
        error: 'This checkpoint has already passed. Choose the failed learner runthrough or another checkpoint with findings. No completed media was changed.',
        checkpointState: 'passed',
      }, { status: 409 });
    }
    const targets = routeSelectiveRepairs(checkpoint?.findings ?? []);
    const ordered = [input.step, ...targets.map((x: any) => x.step)].sort((a, b) => ULTIMATE_BUILD_STEPS.indexOf(a) - ULTIMATE_BUILD_STEPS.indexOf(b));
    const fromStep = ordered[0];
    const request = { lessonBuildId: c.lesson.id, competencyId: c.lesson.competency_id, fromStep, requestedBy: auth.id, requestedAt: new Date().toISOString() };
    if (c.job.status === 'running' && Date.parse(c.job.lease_expires_at ?? '') > Date.now()) {
      const pending = checkpointRepairPayload(c.job, request, index);
      let query = db.from('ultimate_build_jobs').update({ pending_dependency_resume: pending })
        .eq('id', c.job.id).eq('status', 'running').eq('execution_generation', c.job.execution_generation);
      query = c.job.pending_dependency_resume == null ? query.is('pending_dependency_resume', null)
        : query.eq('pending_dependency_resume', JSON.stringify(c.job.pending_dependency_resume));
      const saved = await query.select('id');
      if (saved.error) throw saved.error;
      if (saved.data?.length !== 1) return NextResponse.json({ error: 'The worker advanced while saving. Refresh and request the repair again.' }, { status: 409 });
      return NextResponse.json({ queued: true, executionVerified: false, deferred: true,
        message: 'Repair request saved while the builder continues. It will be applied at a checkpoint boundary; active rendering is preserved.' }, { status: 202 });
    }
    if (c.job.status === 'queued' && c.job.attempts < c.job.max_attempts) {
      const launch = await requestCourseWorker();
      return NextResponse.json({
        queued: true, jobId: c.job.id, ...launch,
        message: launch.dispatched
          ? 'Existing queued work was preserved and the worker start was requested. ' + launch.message
          : 'Existing queued work was preserved. No new rendering or retry was created. ' + launch.message,
      }, { status: launch.dispatched ? 202 : 503 });
    }
    if (c.job.status === 'failed' && c.job.attempts >= c.job.max_attempts) {
      return NextResponse.json({
        error: 'The existing build exhausted its repair attempts. Diagnose the failing learner runthrough and worker access before retrying. No new attempts were charged.',
        jobId: c.job.id, lastError: c.job.last_error,
      }, { status: 409 });
    }
    const counts = { ...c.job.payload?.lessonRepairCounts }; delete counts[c.lesson.competency_id];
    const now = new Date().toISOString();
    const payload = { ...c.job.payload, nextCompetencyIndex: index, lessonRepairCounts: counts, unresolvedCompetencyIds: [],
      competencyId: undefined, lessonBuildId: undefined, repairCompetencyId: undefined, repairCompetencyIds: [], acceptance: undefined,
      checkpointRepair: { lessonBuildId: c.lesson.id, competencyId: c.lesson.competency_id, fromStep, requestedBy: auth.id, requestedAt: now } };
    const changed = await db.from('ultimate_build_jobs').update({ status: 'queued', payload, attempts: 0, last_error: null,
      lease_owner: null, lease_expires_at: null, available_at: now, execution_generation: c.job.execution_generation + 1, updated_at: now })
      .eq('id', c.job.id).eq('status', c.job.status).eq('execution_generation', c.job.execution_generation)
      .or('lease_expires_at.is.null,lease_expires_at.lt.' + now).select('id');
    if (changed.error) throw changed.error;
    if (changed.data?.length !== 1) return NextResponse.json({ error: 'The worker state changed. Refresh diagnostics before repairing.' }, { status: 409 });
    queued = true;
    const build = await db.from('ultimate_course_builds').update({ status: 'queued', current_step: fromStep, updated_at: now })
      .eq('id', c.build.id).eq('status', c.build.status);
    if (build.error) throw build.error;
    const launch = await requestCourseWorker();
    return NextResponse.json({ queued: true, ...launch,
      message: 'Checkpoint repair saved. Earlier checkpoints are preserved; dependent checks will run again. ' + launch.message }, { status: 202 });
  } catch (e) {
    if (queued && e instanceof Error && e.message === 'Google GitHub dispatch refused: HTTP 401')
      return safeInternalError(e, 'Checkpoint repair dispatch authentication rejected', 'Repair is saved. Worker launch authentication was rejected. Refresh the GitHub connection in Studio, then Resume.');
    return safeInternalError(e, 'Checkpoint repair dispatch failed', queued
    ? 'Repair was saved, but the worker launch failed. Use Resume to retry the launch.'
    : 'Checkpoint repair could not be queued. Your saved lesson is preserved.'); }
}
