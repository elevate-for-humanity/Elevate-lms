import type {SupabaseClient} from '@supabase/supabase-js';
import {lessonAutopilotIdentity, LESSON_AUTOPILOT_VERSION} from './lesson-autopilot-policy.mjs';
import {createUltimateRuntime} from '../core/runtime-factory';
import {createProductionHandlers} from '../core/production-handlers';
import {UltimateBuildRunner} from '../core/build-runner';
import {runUltimateCourse} from '../core/full-course-runner';
import {assertCompleteLesson, contractHash} from '../core/lesson-contract';
import {hydrateUltimateProfileSources} from '../core/course-profile';
import {materializeUltimateDraft} from './materialize-draft';
import {attachCompletedLessonMedia} from './attach-lesson-media.mjs';
import {UltimateReleaseService} from '../release/release-service';
import {resolveReleaseActor} from './release-actor';
import {isDurableExternalBlocker} from '../core/repair-router';
import {reportCourseProgress} from './progress-watch.mjs';
import {notifyCourseDispatcher} from './dispatch-on-enqueue.mjs';

/** A role may delegate only the directive produced for its current blocking
 * finding. Saved producer feedback from an earlier stage is recovery history,
 * not permission to restart instruction after a later learner/browser fault. */
export function currentRepairDirective(result:any) {
  const repairState = result.lessons?.[0]?.result?.artifacts?.__repairState;
  const directive = repairState?.directive;
  const findings = (result.findings ?? []).filter((finding:any) => finding?.severity === 'error');
  const requirements = directive?.requirements;
  if (!directive || !Array.isArray(requirements) || !requirements.length || !findings.length)
    return undefined;
  // A resumed quality role stops at an upstream producer that its saved QA
  // directive already invalidated. Keep the measured requirements rather than
  // rejecting the handoff because this attempt reports the role boundary.
  // A validated repair or an unrelated later failure cannot use this path.
  const upstream = findings.every((finding:any) =>
    finding.code === 'AUTOPILOT_UPSTREAM_CHECKPOINT_REQUIRED' &&
    finding.step === directive.target &&
    finding.message === 'AUTOPILOT_UPSTREAM_CHECKPOINT_REQUIRED:' + directive.target);
  if (repairState.status === 'diagnosed' && upstream &&
      requirements.every((requirement:any) =>
        typeof requirement.code === 'string' && Boolean(requirement.code.trim()) &&
        typeof requirement.message === 'string' && Boolean(requirement.message.trim())))
    return directive;
  const matching = findings.filter((finding:any) => finding.step === directive.failedStep);
  if (!matching.length || !requirements.every((requirement:any) => matching.some((finding:any) =>
    finding.code === requirement.code && finding.message === requirement.message))) return undefined;
  return directive;
}

/** Called only by the course coordinator after its prior lesson was published
 * and its old lease yielded. One immutable profile feeds every role. */
export async function coordinateLessonAutopilots({db,job,workerId,generation,build,assertActive}:any) {
  if (build.profile?.ownerPaused === true) throw Error('OWNER_PAUSED_REFERENCE_BUILD');
  const existing = await db.from('ultimate_autopilot_pools').select('id,state').eq('build_id',build.id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.state === 'finalizing') return null;
  if (existing.data) throw Error('ULTIMATE_AUTOPILOT_COORDINATOR_NOT_READY');
  const hydrated = await hydrateUltimateProfileSources(db,build.course_id,build.profile);
  const profile:any = await materializeUltimateDraft(db,build.course_id,hydrated,hydrated.competencies.map((c:any)=>c.id),{deferInstruction:true});
  const canonical = await db.from('course_lessons').select('id,status,is_published,video_status,video_url').eq('course_id',build.course_id);
  if (canonical.error) throw canonical.error;
  const ids = new Set(Object.values(profile.canonicalLessonIds ?? {}));
  const published = (canonical.data ?? []).filter((lesson:any)=>ids.has(lesson.id) && lesson.status === 'published' &&
    lesson.is_published === true && lesson.video_status === 'complete' && lesson.video_url).map((lesson:any)=>lesson.id);
  profile.preservedPublishedLessonIds = [...new Set([...(profile.preservedPublishedLessonIds ?? []),...published])];
  profile.publishCompletedLessons = true;
  profile.parallelAutopilot = LESSON_AUTOPILOT_VERSION;
  assertActive();
  const {data,error} = await db.rpc('seed_ultimate_lesson_autopilots',{
    p_job:job.id,p_worker:workerId,p_generation:generation,p_profile:profile,p_profile_hash:contractHash(profile),
  });
  if (error) throw error;
  if (!data?.poolId || !Number.isInteger(data.taskCount) || data.taskCount % 3 !== 0)
    throw Error('ULTIMATE_AUTOPILOT_PLAN_NOT_PERSISTED');
  await notifyCourseDispatcher({});
  return {claimed:true,completed:false,continuing:true,jobId:job.id,poolId:data.poolId,taskCount:data.taskCount};
}

/** Exactly one fenced job owns this lesson while a role executes. Other
 * lessons have separate jobs and artifacts; they do not share a mutable cursor. */
export async function processLessonAutopilot({db,job,workerId,generation,build,queue,assertActive}:any) {
  const task = lessonAutopilotIdentity(job);
  if (!task) throw Error('ULTIMATE_AUTOPILOT_IDENTITY_REQUIRED');
  const pool = await db.from('ultimate_autopilot_pools').select('id,profile,state').eq('build_id',build.id).single();
  if (pool.error) throw pool.error;
  if (pool.data?.id !== task.poolId || pool.data.state !== 'active') throw Error('ULTIMATE_AUTOPILOT_POOL_NOT_ACTIVE');
  const profile = pool.data.profile;
  if (!profile.competencies?.some((c:any)=>c.id === task.competencyId)) throw Error('ULTIMATE_TARGET_COMPETENCY_NOT_FOUND');
  const ensureActive = async () => {
    assertActive();
    const current = await db.from('ultimate_course_builds').select('profile').eq('id',build.id).single();
    if (current.error) throw current.error;
    if (current.data?.profile?.ownerPaused === true) throw Error('OWNER_PAUSED_REFERENCE_BUILD');
    // Parallel workers cannot silently mix an edited source with saved media.
    const stripOperational = (p:any) => {
      const {ownerPaused,pauseResumeAudit,publishCompletedLessons,preservedPublishedLessonIds,parallelAutopilot,...source} = p;
      return source;
    };
    if (contractHash(stripOperational(current.data.profile)) !== contractHash(stripOperational(profile)))
      throw Error('ULTIMATE_AUTOPILOT_SOURCE_REVISION_REQUIRED');
  };
  await ensureActive();
  const fence = {jobId:job.id,workerId,generation};
  const runtime = await createUltimateRuntime(db,fence);
  const handlers = Object.fromEntries(Object.entries(createProductionHandlers(runtime)).map(([step,handler])=>[step,async(ctx:any)=>{
    reportCourseProgress('autopilot:'+task.role+':'+step);
    const output = await handler(ctx);
    reportCourseProgress('finished:'+step,1,1);
    return output;
  }]));
  const result = await runUltimateCourse({
    buildId:build.id,courseId:build.course_id,profile,targetCompetencyId:task.competencyId,maxLessons:1,
    startAtStep:task.startAtStep,stopAfterStep:task.stopAfterStep,beforeCheckpoint:async()=>{await ensureActive();return null;},
  },()=>new UltimateBuildRunner(handlers as any),runtime.persistence,runtime.artifacts,assertActive);
  await ensureActive();
  if (!(task.role === 'quality' ? result.completed : result.stageReady)) {
    const directive = currentRepairDirective(result);
    if (directive && !result.findings.some(isDurableExternalBlocker)) {
      const delegated = await db.rpc('delegate_ultimate_autopilot_repair',{
        p_job:job.id,p_worker:workerId,p_generation:generation,p_directive:directive,
      });
      if (delegated.error) throw delegated.error;
      if (delegated.data?.delegated === true) {
        await notifyCourseDispatcher({});
        return {claimed:true,completed:false,continuing:true,jobId:job.id,result};
      }
    }
    const message = 'ULTIMATE_INTERNAL_REPAIR_REQUIRED:'+task.competencyId+':FINDINGS='+JSON.stringify(result.findings).slice(0,2800);
    if (result.findings.some(isDurableExternalBlocker)) {
      await queue.waitForDependency(job.id,workerId,message,generation);
      return {claimed:true,completed:false,awaitingDependency:true,jobId:job.id,result};
    }
    // An unchanged producer or unresolved role handoff needs a new repair or
    // deployed code, not another identical claim that consumes the retry budget.
    const retry = !result.findings.some((finding:any) =>
      ['AUTOPILOT_UPSTREAM_CHECKPOINT_REQUIRED','REPAIR_PRODUCER_UNCHANGED'].includes(finding.code));
    await queue.fail(job.id,workerId,message,generation,retry);
    return {claimed:true,completed:false,repairQueued:retry,jobId:job.id,result};
  }
  if (task.role === 'quality') {
    await attachCompletedLessonMedia({db,job,workerId,generation,profile,result,validate:assertCompleteLesson,assertActive});
    const release = new UltimateReleaseService(db);
    const actor = await resolveReleaseActor(db,build.course_id,profile.mediaAcquisitionOwnerId);
    const lessonId = result.lessons[0]?.lessonBuildId;
    if (!lessonId) throw Error('ULTIMATE_AUTOPILOT_LESSON_REQUIRED');
    await release.applyPackage(await release.derive(build.id,lessonId),actor,fence);
  }
  await ensureActive();
  const finished = await db.rpc('complete_ultimate_lesson_autopilot',{
    p_job:job.id,p_worker:workerId,p_generation:generation,
  });
  if (finished.error) throw finished.error;
  if (finished.data?.jobId !== job.id || finished.data?.role !== task.role)
    throw Error('ULTIMATE_AUTOPILOT_HANDOFF_NOT_PERSISTED');
  await notifyCourseDispatcher({});
  return {claimed:true,completed:task.role === 'quality',continuing:task.role !== 'quality',jobId:job.id,result};
}
