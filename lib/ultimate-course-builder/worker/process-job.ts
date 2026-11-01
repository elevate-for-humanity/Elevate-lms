import {verifySavedCourseLessons} from './verify-saved-course.mjs';
import { checkpointContinuousLesson, continuousCourseLease } from './continuous-course-lease.mjs';
import { attachCompletedLessonMedia } from './attach-lesson-media.mjs';
import { preservedCourseCursor } from './preserve-completed.mjs';
import { recordProductionAlert } from './production-alert';
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
import { verifyNewCourseAssessmentContract } from '../instructional/new-course-contract.mjs';
import {coordinateLessonAutopilots, processLessonAutopilot} from './lesson-autopilot';
export function isTargetedCourseJob(payload: Record<string, unknown> = {}) {
  return Boolean(payload.competencyId || payload.lessonBuildId || payload.acceptance || payload.ownerPreview);
}
export async function processUltimateJob(db: SupabaseClient, workerId: string) {
  const queue = new UltimateJobQueue(db);
  const job = await queue.claim(workerId, 300);
  if (!job) return { claimed: false };
  const executionStarted = Date.now();
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
      // Cancellation can reject the active provider immediately. Only this
      // callback owns the fenced failure transition, even if its write hangs.
      leaseLost=true;
      console.error('[UltimateWorker] progress stalled', {jobId:job.id,...progress});
      await queue.fail(job.id,workerId,'ULTIMATE_PROGRESS_STALLED:'+JSON.stringify(progress),generation,true);
      deadline.lose();
    },
  });
  const work = async () => {
  try {
    while (true) {
    const { data: build, error } = await db
      .from('ultimate_course_builds')
      .select('id,course_id,profile,status')
      .eq('id', job.build_id)
      .single();
    if (error || !build) throw error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
    if (job.payload?.autopilot) return await processLessonAutopilot({db,job,workerId,generation,build,queue,assertActive});
    if (!isTargetedCourseJob(job.payload) && (job.payload?.parallelAutopilotStart === true || build.profile?.parallelAutopilot === 'three-role-v1')) {
      const coordinated = await coordinateLessonAutopilots({db,job,workerId,generation,build,assertActive});
      if (coordinated) return coordinated;
    }
    // Upgrade saved owner-review profiles under this worker's fenced write.
    // The checkpoint hash treats this policy migration as operational metadata.
    const storedProfile = {
      ...build.profile,
      ...(build.profile?.publicationPolicy === 'owner-review-required'
        ? { publicationPolicy: 'automatic-quality-verified' } : {}),
    } as UltimateCredentialProfile;
    const ensureNotPaused = async () => {
      const state = await db.from('ultimate_course_builds').select('profile').eq('id',build.id).single();
      if (state.error) throw state.error;
      if (state.data?.profile?.ownerPaused === true) throw new Error('OWNER_PAUSED_REFERENCE_BUILD');
    };
    if ((storedProfile as any).ownerPaused === true && job.payload?.ownerPreview !== true) {
      await queue.waitForDependency(job.id,workerId,'OWNER_PAUSED_REFERENCE_BUILD',generation);
      return {claimed:true,completed:false,ownerPaused:true,jobId:job.id};
    }
    if (!storedProfile?.competencies?.length) throw new Error('ULTIMATE_PROFILE_REPAIR_REQUIRED');
    let payload = (job.payload ?? {}) as any;
      if (
        !payload.competencyId &&
        !payload.lessonBuildId &&
        !payload.acceptance &&
        !payload.ownerPreview &&
        !payload.checkpointRepair
      ) {
        const [canonical, completed] = await Promise.all([
          db
            .from("course_lessons")
            .select(
              "id,status,is_published,approved,video_status,media_quality_status,video_url,video_job_id,media_attachment:content_json->mediaAttachment,film:content_json->film",
            )
            .eq("course_id", build.course_id),
          db
            .from("ultimate_lesson_builds")
            .select("id,competency_id,status,render_source:artifacts->lesson_film_render->render->>videoUrl,captions_source:artifacts->lesson_film_render->render->>captionsUrl,transcript_source:artifacts->lesson_film_render->render->>transcriptUrl")
            .eq("build_id", build.id),
        ]);
        if (canonical.error) throw canonical.error;
        if (completed.error) throw completed.error;
        payload = preservedCourseCursor(
          storedProfile,
          payload,
          canonical.data ?? [],
          completed.data ?? [],
        );
      }
      const currentCompetencyId = payload.competencyId ?? payload.repairCompetencyId ??
      storedProfile.competencies[Number.isInteger(payload.nextCompetencyIndex) ? payload.nextCompetencyIndex : 0]?.id;
    const hydrated = storedProfile.parallelAutopilot === 'three-role-v1' ? storedProfile : await materializeUltimateDraft(db, build.course_id,
      await hydrateUltimateProfileSources(db, build.course_id, storedProfile), [currentCompetencyId]);
    // Inherit the owner's approved production identity between lessons. Draft
    // hydration can refresh competency content, but must not reset the saved
    // reference presentation or lesson progression policy.
    const inheritedKeys = [
      'lessonPresentation', 'presentationContract', 'lessonCompletionPolicy',
      'sourcePolicy', 'publicationPolicy',
    ] as const;
    const profile = { ...hydrated } as typeof hydrated & Record<string, any>;
    for (const key of inheritedKeys) {
      if ((storedProfile as any)?.[key] !== undefined)
        profile[key] = (storedProfile as any)[key];
    }
    if (
      JSON.stringify(profile) !== JSON.stringify(build.profile)
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
    const targeted = isTargetedCourseJob(payload);
    const publishAsYouGo = profile.publishCompletedLessons === true && !targeted;
    const lessonReleases = publishAsYouGo ? new UltimateReleaseService(db) : null;
    const lessonReleaseActor = publishAsYouGo
      ? await resolveReleaseActor(db, build.course_id, profile.mediaAcquisitionOwnerId) : null;
    if (lessonReleases && lessonReleaseActor) {
      assertActive();
      await ensureNotPaused();
      await lessonReleases.publishReadyLessons(build.id, lessonReleaseActor, {jobId: job.id, workerId, generation});
    }
    const originalHandlers = createProductionHandlers(runtime);
    const handlers = Object.fromEntries(Object.entries(originalHandlers).map(([step,handler])=>[step,async(ctx:any)=>{
      reportCourseProgress('stage:'+step);
      const result=await handler(ctx);
      reportCourseProgress('finished:'+step,1,1);
      return result;
    }]));
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
        renderPreviewOnly: payload.ownerPreview === true,
        beforeCheckpoint: async (step) => {
          await ensureNotPaused();
          return liveCheckpointRepairReader(db, job, workerId, generation, payload, currentCompetencyId)(step);
        },
        repairRenderRevision: payload.checkpointRepair && payload.checkpointRepair.competencyId === currentCompetencyId && ULTIMATE_BUILD_STEPS.indexOf(payload.checkpointRepair.fromStep) <= ULTIMATE_BUILD_STEPS.indexOf('lesson_film_render') ? payload.checkpointRepair.requestedAt : undefined,
        repairFromStep: payload.checkpointRepair && payload.checkpointRepair.competencyId === currentCompetencyId ? payload.checkpointRepair.fromStep : undefined,
      },
      () => new UltimateBuildRunner(handlers as any),
      runtime.persistence,
      runtime.artifacts,
      assertActive,
    );
    assertActive();
    await ensureNotPaused();
    console.info('[UltimateWorker] lesson processing returned', { jobId: job.id, completed: result.completed, findings: result.findings.length });
    if (result.completed || result.previewReady) await recordProductionAlert(db, {
      actorId:job.payload?.requestedBy ?? profile.mediaAcquisitionOwnerId,buildId:build.id,courseId:build.course_id,
      eventKey:`lesson:${currentCompetencyId}:${generation}`,title:result.previewReady ? 'Lesson preview saved' : 'Lesson processing completed',
      message:`${profile.title}: ${currentCompetencyId}. Open production to review saved media and quality evidence.`,
    });
    if (payload.ownerPreview === true && result.previewReady) {
      await runtime.persistence.updateBuild({buildId:build.id,status:'blocked',currentStep:'lesson_film_render'});
      await queue.complete(job.id,workerId,generation);
      return {claimed:true,completed:false,previewReady:true,jobId:job.id,result};
    }
    // A final coordinator pass has no new lesson to attach. The complete
    // competency audit and fenced release below still verify the saved course.
    const finalCoursePass = !targeted && result.completed && result.lessons.length === 0 &&
      Number.isInteger(payload.nextCompetencyIndex) && payload.nextCompetencyIndex >= profile.competencies.length;
    if (!finalCoursePass) await attachCompletedLessonMedia({db,job,workerId,generation,profile,result,
      validate:assertCompleteLesson,assertActive});
    if (lessonReleases && lessonReleaseActor && result.completed && !result.previewReady) {
      assertActive();
      await ensureNotPaused();
      await lessonReleases.publishReadyLessons(build.id, lessonReleaseActor, {jobId: job.id, workerId, generation});
      assertActive();
    }
    if (!targeted && !finalCoursePass) {
      const continuation = nextCourseWork(payload, result);
      if (continuation.continue) {
        if (result.completed) delete continuation.payload.checkpointRepair;
        if (continuousCourseLease(build.course_id, payload, Date.now() - executionStarted, profile)) {
          // Drain writes from the previous lesson before committing its cursor.
          // Subsequent progress must use the new payload under the same fence.
          await progressWatch.flush();
          assertActive();
          await ensureNotPaused();
          if (await checkpointContinuousLesson({db, jobId:job.id, workerId, generation,
            payload:continuation.payload})) {
            job.payload = continuation.payload;
            reportCourseProgress('continuing:lesson:' + continuation.payload.nextCompetencyIndex);
            console.info('[UltimateWorker] continuing under same lease', {
              jobId:job.id,workerId,generation,nextIndex:continuation.payload.nextCompetencyIndex,
            });
            continue;
          }
        }
        // Pending media/repair requests and the bounded execution budget use
        // the existing atomic wakeup transition rather than losing requests.
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
        await queue.fail(job.id,workerId,`ULTIMATE_INTERNAL_REPAIR_REQUIRED:${continuation.unresolved.join(',')}:FINDINGS=${JSON.stringify((result.findings || []).map(f => ({step:f.step,code:f.code,message:f.message}))).slice(0,2800)}`,generation,true);
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
      const verifiedProfile = await verifySavedCourseLessons({db,build,profile,
        validate:assertCompleteLesson,assertActive});
      if (JSON.stringify(verifiedProfile) !== JSON.stringify(profile)) {
        assertActive();
        const savedProfile = await db.rpc('ultimate_fenced_write', {
          p_job:job.id,p_worker:workerId,p_generation:generation,
          p_action:'update_profile',p_target:build.id,p_data:{profile:verifiedProfile},
        });
        if (savedProfile.error) throw savedProfile.error;
        Object.assign(profile,verifiedProfile);
      }
      if ((profile as any).newCourseContract === 'owner-approved-lesson-v1') {
        // Check the actual published-course lesson records, not a fabricated exam.
        // The final must be a separate last assessment after all chapter recaps.
        const { data: courseLessons, error: courseLessonsError } = await db
          .from('course_lessons')
          .select('id,title,lesson_type,order_index,quiz_questions,content_json')
          .eq('course_id', build.course_id)
          .order('order_index');
        if (courseLessonsError) throw courseLessonsError;
        const chapters = (courseLessons ?? []).filter(l => l.lesson_type === 'lesson')
          .map(l => ({ id: l.id, recapQuestions: Array.isArray(l.quiz_questions) ?
            l.quiz_questions : (l.content_json as any)?.assessment?.questions ?? [] }));
        const finals = (courseLessons ?? []).filter(l =>
          ['exam','final_exam'].includes(String(l.lesson_type)));
        const finalLesson = finals[finals.length - 1];
        if (!finalLesson || !courseLessons?.length ||
            finalLesson.order_index !== courseLessons[courseLessons.length - 1].order_index)
          throw new Error('COURSE_FINAL_EXAM_MISSING_OR_NOT_LAST');
        const finalQuestions = Array.isArray(finalLesson.quiz_questions) ?
          finalLesson.quiz_questions : (finalLesson.content_json as any)?.assessment?.questions ?? [];
        verifyNewCourseAssessmentContract({
          chapters,
          finalExam: { position: 'after-last-chapter', cumulative: true,
            questions: finalQuestions },
        });
      }
      const releaseActor = await resolveReleaseActor(db, build.course_id, profile.mediaAcquisitionOwnerId);
      await runtime.persistence.updateBuild({buildId:build.id,status:'built',currentStep:'credential_release'});
      assertActive();
      await new UltimateReleaseService(db).publish(build.id, releaseActor, {jobId: job.id, workerId, generation});
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
    if (!targeted && profile.parallelAutopilot === 'three-role-v1') {
      const closed = await db.rpc('finish_ultimate_autopilot_pool',{p_build:build.id});
      if (closed.error) throw closed.error;
      if (closed.data !== true) throw Error('ULTIMATE_AUTOPILOT_COURSE_RELEASE_READBACK_REQUIRED');
    }
    return { claimed: true, completed: true, jobId: job.id, result };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message :
      error && typeof error === 'object' && 'message' in error
        ? String(error.message) : String(error);
    if (leaseLost || message.startsWith('ULTIMATE_JOB_LEASE_LOST')) {
      console.error('[UltimateWorker] lease lost; not changing job state', {jobId: job.id, message});
      return {claimed:true,completed:false,jobId:job.id,error:message};
    }
    if (message === 'OWNER_PAUSED_REFERENCE_BUILD') {
      await queue.waitForDependency(job.id,workerId,message,generation);
      return {claimed:true,completed:false,ownerPaused:true,jobId:job.id};
    }
    if (isDurableExternalBlocker({code:message.split(':')[0],step:'learning_objectives',severity:'error',message}))
      await queue.waitForDependency(job.id,workerId,message,generation);
    else await queue.fail(job.id, workerId, message, generation, true);
    const failedBuild = await db.from('ultimate_course_builds').select('course_id').eq('id',job.build_id).single();
    if (failedBuild.data) await recordProductionAlert(db,{actorId:job.payload?.requestedBy,buildId:job.build_id,
      courseId:failedBuild.data.course_id,eventKey:`attention:${job.id}:${generation}`,title:'Course production needs attention',
      message:'A worker attempt stopped. Review the saved checkpoint, recovery state and worker logs.',attention:true});
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
    // Disposal also aborts this signal. Only the watchdog's own reason is a stall.
    if (String(progressWatch.signal.reason?.message ?? '').startsWith('ULTIMATE_PROGRESS_STALLED:'))
      return {claimed:true,completed:false,jobId:job.id,stalled:true,error:'ULTIMATE_PROGRESS_STALLED'};
    if (leaseLost) return {claimed:true,completed:false,jobId:job.id,error:'ULTIMATE_JOB_LEASE_LOST:' + job.id};
    throw error;
  } finally {
    if (timer) clearInterval(timer);
    timer = null;
    deadline.dispose();
    progressWatch.dispose();
  }
}

