import type { SupabaseClient } from '@supabase/supabase-js';
import { UltimateJobQueue } from './job-queue';
import { createUltimateRuntime } from '../core/runtime-factory';
import { createProductionHandlers } from '../core/production-handlers';
import { UltimateBuildRunner } from '../core/build-runner';
import { runUltimateCourse } from '../core/full-course-runner';
import type { UltimateCredentialProfile } from '../core/types';
import { assertCompleteLesson } from '../core/lesson-contract';
import { UltimateReleaseService } from '../release/release-service';
import { nextCourseWork } from './course-cursor';
import { resolveReleaseActor } from './release-actor';
import { hydrateUltimateProfileSources } from '../core/course-profile';
import { materializeUltimateDraft } from './materialize-draft';
export async function processUltimateJob(db: SupabaseClient, workerId: string) {
  const queue = new UltimateJobQueue(db);
  const job = await queue.claim(workerId, 300);
  if (!job) return { claimed: false };
  const generation = Number(job.execution_generation);
  if (!Number.isSafeInteger(generation) || generation < 1)
    throw new Error('ULTIMATE_EXECUTION_GENERATION_REQUIRED');
  const fence = {jobId: job.id, workerId, generation};
  console.info('[UltimateWorker] job claimed', { jobId: job.id, buildId: job.build_id, workerId, generation });
  let leaseLost = false;
  let heartbeatInFlight = false;
  let lastHeartbeat = Date.now();
  const assertActive = () => {
    if (leaseLost || Date.now() - lastHeartbeat >= 300000) throw new Error('ULTIMATE_JOB_LEASE_LOST:' + job.id);
  };
  let timer: ReturnType<typeof setInterval> | null = setInterval(
    () => {
      if (heartbeatInFlight || leaseLost) return;
      heartbeatInFlight = true;
      void queue.heartbeat(job.id, workerId, 300)
      .then((renewed) => {
        if (!renewed) {
          leaseLost = true;
          console.error('[UltimateWorker] heartbeat rejected or lease lost', {jobId: job.id, workerId});
        } else {
          lastHeartbeat = Date.now();
          console.info('[UltimateWorker] heartbeat acknowledged', {jobId: job.id});
        }
      })
      .catch((error) => console.error('[UltimateWorker] heartbeat failed', {
        jobId: job.id, workerId,
        error: error instanceof Error ? {message: error.message, stack: error.stack} :
          (typeof error === 'object' ? JSON.stringify(error) : String(error)),
      }))
      .finally(() => { heartbeatInFlight = false; });
    },
    60000,
  );
  try {
    const { data: build, error } = await db
      .from('ultimate_course_builds')
      .select('id,course_id,profile,status')
      .eq('id', job.build_id)
      .single();
    if (error || !build) throw error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
    const storedProfile = build.profile as UltimateCredentialProfile;
    if (!storedProfile?.competencies?.length) throw new Error('ULTIMATE_PROFILE_REPAIR_REQUIRED');
    const profile = await materializeUltimateDraft(db, build.course_id,
      await hydrateUltimateProfileSources(db, build.course_id, storedProfile));
    if (
      JSON.stringify(profile) !== JSON.stringify(storedProfile)
    ) {
      const { error: profileError } = await db.rpc('ultimate_fenced_write', {
        p_job: job.id, p_worker: workerId, p_generation: generation,
        p_action: 'update_profile', p_target: build.id, p_data: {profile},
      });
      if (profileError) throw profileError;
    }
    console.info('[UltimateWorker] profile hydrated', { jobId: job.id, competencies: profile.competencies.length });
    const runtime = await createUltimateRuntime(db, fence);
    console.info('[UltimateWorker] runtime ready', { jobId: job.id });
    const handlers = createProductionHandlers(runtime);
    const payload = (job.payload ?? {}) as any;
    const targeted = Boolean(payload.competencyId || payload.lessonBuildId || payload.acceptance);
    console.info('[UltimateWorker] lesson processing started', { jobId: job.id, targeted, competencyId: payload.competencyId ?? null });
    const result = await runUltimateCourse(
      {
        buildId: build.id,
        courseId: build.course_id,
        profile,
        targetLessonBuildId: payload.lessonBuildId,
        targetCompetencyId:
          payload.competencyId ?? payload.repairCompetencyId ?? (payload.acceptance ? profile.competencies?.[0]?.id : undefined),
        startIndex: Number.isInteger(payload.nextCompetencyIndex) ? payload.nextCompetencyIndex : 0,
        maxLessons: 1,
      },
      () => new UltimateBuildRunner(handlers as any),
      runtime.persistence,
      runtime.artifacts,
      assertActive,
    );
    assertActive();
    console.info('[UltimateWorker] lesson processing returned', { jobId: job.id, completed: result.completed, findings: result.findings.length });
    if (!targeted) {
      const continuation = nextCourseWork(payload, result);
      if (continuation.continue) {
        await queue.yieldProgress(job.id, workerId, continuation.payload, generation);
        return { claimed: true, completed: false, continuing: true, jobId: job.id, result };
      }
      if (continuation.unresolved?.length) {
        // A missing dependency is a blocked prerequisite, not a failed render.
        // Preserve the cursor and await an explicit dependency wake-up instead
        // of exhausting attempts or continuously retrying missing media.
        await queue.waitForDependency(job.id,workerId,`ULTIMATE_DEPENDENCIES_UNRESOLVED:${continuation.unresolved.join(',')}`,generation);
        return {claimed:true,completed:false,jobId:job.id,result};
      }
    }
    if (!result.completed) {
      // Quality findings are repair work, not a terminal queue state. Requeue
      // the durable build so the worker resumes from its persisted checkpoint
      // and selective-repair plan instead of stranding the entire course.
      await queue.fail(
        job.id,
        workerId,
        `ULTIMATE_REPAIR_REQUIRED:${JSON.stringify(result.findings.map(f => ({step:f.step,code:f.code,message:f.message}))).slice(0,4000)}`,
        generation,
      );
      return { claimed: true, completed: false, repairQueued: true, jobId: job.id, result };
    }
    if (!targeted) {
      // Completion is the current contract for every competency plus canonical
      // publication readback, never the last lesson's status or legacy flags.
      const { data: lessons, error: lessonError } = await db.from('ultimate_lesson_builds')
        .select('competency_id,status,artifacts').eq('build_id', build.id);
      if (lessonError) throw lessonError;
      for (const competency of profile.competencies) {
        const lesson = lessons?.find(l => l.competency_id === competency.id);
        if (!lesson || lesson.status !== 'built') throw new Error(`ULTIMATE_COMPETENCY_NOT_COMPLETE:${competency.id}`);
        assertCompleteLesson(lesson.artifacts, profile);
      }
      const releaseActor = await resolveReleaseActor(db, build.course_id, profile.mediaAcquisitionOwnerId);
      await runtime.persistence.updateBuild({buildId:build.id,status:'built',currentStep:'credential_release'});
      assertActive();
      await new UltimateReleaseService(db).publish(build.id, releaseActor);
    }
    if (targeted) {
      // A lesson acceptance/repair job does not complete or publish the course.
      // There is no continuation lease after this job, so do not leave the
      // course claiming to be running while the remaining work is idle.
      await runtime.persistence.updateBuild({
        buildId: build.id, status: 'blocked', currentStep: 'selective_repair',
      });
    }
    assertActive();
    await queue.complete(job.id, workerId, generation);
    return { claimed: true, completed: true, jobId: job.id, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (leaseLost || message.startsWith('ULTIMATE_JOB_LEASE_LOST')) {
      console.error('[UltimateWorker] lease lost; not changing job state', {jobId: job.id, message});
      return {claimed:true,completed:false,jobId:job.id,error:message};
    }
    await queue.fail(job.id, workerId, message, generation, true);
    return { claimed: true, completed: false, jobId: job.id, error: message };
  } finally {
    if (timer) clearInterval(timer);
    timer = null;
  }
}
