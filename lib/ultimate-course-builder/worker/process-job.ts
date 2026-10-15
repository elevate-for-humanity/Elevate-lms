import {ULTIMATE_BUILD_STEPS} from '../core/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UltimateJobQueue } from './job-queue';
import {createCourseProgressWatch,reportCourseProgress} from './progress-watch.mjs';
import { createLeaseDeadline } from './runtime-guards.mjs';
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
import { isDurableExternalBlocker } from '../core/repair-router';
import { liveCheckpointRepairReader } from './live-checkpoint-repair';
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
  const deadline = createLeaseDeadline(job.id, {onLost: () => { leaseLost = true; }});
  const assertActive = () => deadline.assertActive();
  let timer: ReturnType<typeof setInterval> | null = setInterval(
    () => {
      if (heartbeatInFlight || leaseLost) return;
      heartbeatInFlight = true;
      void queue.heartbeat(job.id, workerId, 300)
      .then((renewed) => {
        if (!renewed) {
          deadline.lose();
          console.error('[UltimateWorker] heartbeat rejected or lease lost', {jobId: job.id, workerId});
        } else {
          if (!deadline.renew()) return;
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
  const progressWatch=createCourseProgressWatch({
    onProgress:async(progress:any)=>{
      const {data,error}=await db.from('ultimate_build_jobs').update({payload:{...job.payload,progress}}).eq('id',job.id).eq('lease_owner',workerId).eq('execution_generation',generation).eq('status','running').gt('lease_expires_at',new Date().toISOString()).select('id');
      if(error)throw error;
      if(!data?.length)throw Error('ULTIMATE_JOB_LEASE_LOST:'+job.id);
    },
    onStall:async(progress:any)=>{
      console.error('[UltimateWorker] progress stalled', {jobId:job.id,...progress});
      await queue.fail(job.id,workerId,'ULTIMATE_PROGRESS_STALLED:'+JSON.stringify(progress),generation,true);
      leaseLost=true;deadline.lose();
    },
  });
  const work = async () => {
  try {
    const { data: build, error } = await db
      .from('ultimate_course_builds')
      .select('id,course_id,profile,status')
      .eq('id', job.build_id)
      .single();
    if (error || !build) throw error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
    const storedProfile = build.profile as UltimateCredentialProfile;
    if ((storedProfile as any).ownerPaused === true) {
      await queue.waitForDependency(job.id,workerId,'OWNER_PAUSED_REFERENCE_BUILD',generation);
      return {claimed:true,completed:false,ownerPaused:true,jobId:job.id};
    }
    if (!storedProfile?.competencies?.length) throw new Error('ULTIMATE_PROFILE_REPAIR_REQUIRED');
    const payload = (job.payload ?? {}) as any;
    const currentCompetencyId = payload.competencyId ?? payload.repairCompetencyId ??
      storedProfile.competencies[Number.isInteger(payload.nextCompetencyIndex) ? payload.nextCompetencyIndex : 0]?.id;
    const profile = await materializeUltimateDraft(db, build.course_id,
      await hydrateUltimateProfileSources(db, build.course_id, storedProfile), [currentCompetencyId]);
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
    const originalHandlers = createProductionHandlers(runtime);
    const handlers = Object.fromEntries(Object.entries(originalHandlers).map(([step,handler])=>[step,async(ctx:any)=>{
      reportCourseProgress('stage:'+step);
      const result=await handler(ctx);
      reportCourseProgress('finished:'+step,1,1);
      return result;
    }]));
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
        beforeCheckpoint: liveCheckpointRepairReader(db, job, workerId, generation, payload, currentCompetencyId),
        repairRenderRevision: payload.checkpointRepair?.competencyId === currentCompetencyId && ULTIMATE_BUILD_STEPS.indexOf(payload.checkpointRepair.fromStep) <= ULTIMATE_BUILD_STEPS.indexOf('lesson_film_render') ? payload.checkpointRepair.requestedAt : undefined,
        repairFromStep: payload.checkpointRepair?.competencyId === currentCompetencyId ? payload.checkpointRepair.fromStep : undefined,
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
        if (result.completed) delete continuation.payload.checkpointRepair;
        await queue.yieldProgress(job.id, workerId, continuation.payload, generation);
        return { claimed: true, completed: false, continuing: true, jobId: job.id, result };
      }
      if (continuation.unresolved?.length) {
        // Only genuine external prerequisites need a dependency wake-up.
        // Internal lesson/producer failures must use the existing bounded
        // repair retry rather than being stranded as missing media.
        if (result.findings?.some(isDurableExternalBlocker)) {
          await queue.waitForDependency(job.id,workerId,`ULTIMATE_EXTERNAL_ASSET_REQUIRED:${continuation.unresolved.join(',')}`,generation,continuation.payload);
          return {claimed:true,completed:false,awaitingDependency:true,jobId:job.id,result};
        }
        await queue.fail(job.id,workerId,`ULTIMATE_INTERNAL_REPAIR_REQUIRED:${continuation.unresolved.join(',')}`,generation,true);
        return {claimed:true,completed:false,repairQueued:true,jobId:job.id,result};
      }
    }
    if (!result.completed) {
      if (result.findings.some(isDurableExternalBlocker)) {
        await queue.waitForDependency(job.id,workerId,JSON.stringify(result.findings.map(f=>({code:f.code,message:f.message}))).slice(0,4000),generation);
        return {claimed:true,completed:false,awaitingDependency:true,jobId:job.id,result};
      }
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
      if ((profile as any).publicationPolicy === 'owner-review-required') {
      await queue.waitForDependency(job.id,workerId,'OWNER_COURSE_REVIEW_REQUIRED',generation);
      return {claimed:true,completed:false,awaitingOwnerReview:true,jobId:job.id,result};
    }
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
    if (isDurableExternalBlocker({code:message.split(':')[0],step:'learning_objectives',severity:'error',message}))
      await queue.waitForDependency(job.id,workerId,message,generation);
    else await queue.fail(job.id, workerId, message, generation, true);
    return { claimed: true, completed: false, jobId: job.id, error: message };
  } finally {
    if (timer) clearInterval(timer);
    timer = null;
    deadline.dispose();
    progressWatch.dispose();
  }
  };
  try {
    return await progressWatch.race(deadline.race(progressWatch.run(work)));
  } catch (error) {
    if (progressWatch.signal.aborted) return {claimed:true,completed:false,jobId:job.id,stalled:true,error:'ULTIMATE_PROGRESS_STALLED'};
    if (leaseLost) return {claimed:true,completed:false,jobId:job.id,error:'ULTIMATE_JOB_LEASE_LOST:' + job.id};
    throw error;
  } finally {
    if (timer) clearInterval(timer);
    timer = null;
    deadline.dispose();
    progressWatch.dispose();
  }
}
