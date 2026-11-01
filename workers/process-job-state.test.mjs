import {verifySavedCourseLessons} from '../lib/ultimate-course-builder/worker/verify-saved-course.mjs';
import {attachCompletedLessonMedia} from '../lib/ultimate-course-builder/worker/attach-lesson-media.mjs';
import test from 'node:test';
import {continuousCourseLease,checkpointContinuousLesson} from '../lib/ultimate-course-builder/worker/continuous-course-lease.mjs';
import {preservedCourseCursor} from '../lib/ultimate-course-builder/worker/preserve-completed.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import {createCourseProgressWatch,reportCourseProgress} from '../lib/ultimate-course-builder/worker/progress-watch.mjs';
import {createLeaseDeadline} from '../lib/ultimate-course-builder/worker/runtime-guards.mjs';
const repairSource = stripTypeScriptTypes(readFileSync(new URL('../lib/ultimate-course-builder/core/repair-router.ts', import.meta.url),'utf8'));
const {isDurableExternalBlocker} = await import('data:text/javascript;base64,'+Buffer.from(repairSource).toString('base64'));
const checkpointSource=stripTypeScriptTypes(readFileSync(new URL('../lib/ultimate-course-builder/worker/live-checkpoint-repair.ts',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const typeSource=stripTypeScriptTypes(readFileSync(new URL('../lib/ultimate-course-builder/core/types.ts',import.meta.url),'utf8'));
const {ULTIMATE_BUILD_STEPS}=await import('data:text/javascript;base64,'+Buffer.from(typeSource).toString('base64'));
const {liveCheckpointRepairReader}=new Function('ULTIMATE_BUILD_STEPS',checkpointSource.replace(/export /g,'')+';return {liveCheckpointRepairReader};')(ULTIMATE_BUILD_STEPS);

const productionPath = process.env.PROCESS_JOB_SOURCE || new URL('../lib/ultimate-course-builder/worker/process-job.ts', import.meta.url);
const source = stripTypeScriptTypes(readFileSync(productionPath, 'utf8'))
  .replace(/^import .*;\n/gm, '').replace(/^export (?=(?:async )?function )/gm, '');

function scenario(payload, completed = true, options = {}) {
  const events = [];
  const build = { id: 'build', course_id: 'course', status: 'blocked', profile: { competencies: [{ id: 'competency' }], ...options.profile } };
  const q = { select: () => q, eq: () => q, single: async () => ({ data: build, error: null }), then: resolve => resolve({data:[{competency_id:'competency',status:'built',artifacts:{}}],error:null}) };
  const profileWrites=[];
  const db = { from: () => q, rpc: async (_name,args) => {profileWrites.push(args.p_data.profile);return {error:null};} };
  class Queue {
    async claim() { return { id: 'job', build_id: 'build', execution_generation: 1, payload }; }
    async heartbeat() { return true; }
    async complete() { events.push('complete'); }
    async yieldProgress() { events.push('advance'); }
    async fail() { events.push('fail');await options.fail?.(); }
    async waitForDependency() { events.push('dependency'); }
  }
  const runtime = { persistence: { updateBuild: async value => events.push(value) }, artifacts: {} };
  const names = ['verifySavedCourseLessons','ULTIMATE_BUILD_STEPS','continuousCourseLease','checkpointContinuousLesson','attachCompletedLessonMedia','preservedCourseCursor','recordProductionAlert','createCourseProgressWatch','reportCourseProgress','createLeaseDeadline', 'UltimateJobQueue', 'createUltimateRuntime', 'createProductionHandlers', 'UltimateBuildRunner', 'runUltimateCourse', 'assertCompleteLesson', 'UltimateReleaseService', 'nextCourseWork', 'resolveReleaseActor', 'hydrateUltimateProfileSources', 'materializeUltimateDraft', 'isDurableExternalBlocker'];
  const values = [verifySavedCourseLessons,ULTIMATE_BUILD_STEPS,continuousCourseLease,checkpointContinuousLesson,options.attach || (async ({result})=>{if(result.completed)events.push('attach');}),preservedCourseCursor,async()=>{},options.progressFactory || createCourseProgressWatch,reportCourseProgress,options.leaseFactory || createLeaseDeadline, Queue, async () => runtime, () => ({}), class {}, options.runCourse || (async () => ({ completed, findings: [], lessons: [] })), () => {}, class { async publish() { events.push('publish'); } async publishReadyLessons() { events.push('publish-ready');await options.publishReady?.(); } }, options.nextWork || (() => ({ continue: false })), async () => 'actor', async (_db, _id, profile) => profile, async (_db, _id, profile) => profile, isDurableExternalBlocker];
  const worker = new Function(...names, 'liveCheckpointRepairReader', source + '\nreturn processUltimateJob;')(...values,liveCheckpointRepairReader);
  return { events, build, profileWrites, run: () => worker(db, 'owner') };
}

test('a successful targeted lesson clears course running state before releasing its job', async () => {
  for (const payload of [{ lessonBuildId: 'lesson' }, { competencyId: 'competency' }, { acceptance: true }]) {
    const s = scenario(payload);
    const result = await s.run();
    assert.equal(result.completed, true);
    assert.deepEqual(s.events, ['attach', { buildId: 'build', status: 'blocked', currentStep: 'selective_repair' }, 'complete']);
  }
});

test('a targeted lesson on a parallel course cannot seed or finish the whole-course pool', async () => {
  const s = scenario({ competencyId: 'competency' }, true, { profile: { parallelAutopilot: 'three-role-v1' } });
  const result = await s.run();
  assert.equal(result.completed, true);
  assert.deepEqual(s.events, ['attach', { buildId: 'build', status: 'blocked', currentStep: 'selective_repair' }, 'complete']);
});

test('an incomplete targeted lesson stays in the existing repair queue instead of being completed', async () => {
  const s = scenario({ lessonBuildId: 'lesson' }, false);
  const result = await s.run();
  assert.equal(result.completed, false);
  assert.equal(result.repairQueued, true);
  assert.deepEqual(s.events, ['fail']);
});
test('missing Google permission waits for a dependency without consuming repair retries',async()=>{
 const s=scenario({acceptance:true},false,{runCourse:async()=>({completed:false,findings:[{code:'ULTIMATE_GOOGLE_AUTHORING_HTTP_403',message:'Permission missing'}],lessons:[]})});
 const result=await s.run();assert.equal(result.awaitingDependency,true);assert.deepEqual(s.events,['dependency']);
});

test('a media task that never returns loses its lease without completing or changing the job',async()=>{
 const s=scenario({acceptance:true},false,{leaseFactory:(id,options)=>createLeaseDeadline(id,{...options,leaseMs:10}),runCourse:()=>new Promise(()=>{})});
 const result=await s.run();assert.equal(result.completed,false);assert.match(result.error,/LEASE_LOST/);assert.deepEqual(s.events,[]);
});

test('an explicit pause stops before the next checkpoint without completing or failing saved work',async()=>{
 let s;
 s=scenario({acceptance:true},false,{runCourse:async plan=>{
  s.build.profile.ownerPaused=true;
  await plan.beforeCheckpoint('storyboard');
  throw new Error('Paused checkpoint must not execute');
 }});
 const result=await s.run();assert.equal(result.ownerPaused,true);assert.deepEqual(s.events,['dependency']);
});

test('a completed legacy owner-review course publishes without waiting for a manual decision',async()=>{
 const s=scenario({});s.build.profile.publicationPolicy='owner-review-required';
 const result=await s.run();assert.equal(result.completed,true);
 assert.equal(s.profileWrites[0]?.publicationPolicy,'automatic-quality-verified');
 assert.deepEqual(s.events,['attach',{buildId:'build',status:'built',currentStep:'credential_release'},'publish','complete']);
});


test('failed media attachment cannot advance or complete the job',async()=>{
 const s=scenario({},true,{attach:async()=>{throw Error('ULTIMATE_ATTACHMENT_READBACK_FAILED');},nextWork:()=>({continue:true,payload:{nextCompetencyIndex:3}})});
 const result=await s.run();
 assert.equal(result.completed,false);assert.deepEqual(s.events,['fail']);
});
test('attachment completes before the course cursor advances',async()=>{
 const s=scenario({},true,{nextWork:()=>({continue:true,payload:{nextCompetencyIndex:3}})});
 const result=await s.run();assert.equal(result.continuing,true);
 assert.deepEqual(s.events,['attach','advance']);
});

test('stall cancellation has one failure-state writer while provider unwinds',async()=>{
 let watch,clock=0,finishFailure;
 const pendingFailure=new Promise(resolve=>{finishFailure=resolve;});
 const s=scenario({acceptance:true},false,{
  progressFactory:options=>(watch=createCourseProgressWatch({...options,idleMs:100,now:()=>clock,schedule:()=>0,cancel:()=>{}})),
  fail:()=>pendingFailure,
  runCourse:async()=>{
   clock=101;void watch.check();
   await Promise.resolve();
   throw watch.signal.reason;
  },
 });
 const result=await s.run();
 await new Promise(setImmediate);
 assert.equal(result.stalled,true);assert.deepEqual(s.events,['fail']);
 finishFailure();
});
test('a failed recovery write preserves its database error instead of reporting a progress stall',async()=>{
 const failure=new Error('database failure-state write timed out');
 const s=scenario({acceptance:true},false,{runCourse:async()=>{throw Error('ULTIMATE_FENCED_WRITE_FAILED:update_build:AbortError');},fail:async()=>{throw failure;}});
 await assert.rejects(s.run(),error=>error===failure);assert.deepEqual(s.events,['fail']);
});

test('authorized publish-as-you-go completes publication before advancing the cursor',async()=>{
 const s=scenario({},true,{nextWork:()=>({continue:true,payload:{nextCompetencyIndex:19}})});s.build.profile.publishCompletedLessons=true;
 const result=await s.run();assert.equal(result.continuing,true);
 assert.deepEqual(s.events,['publish-ready','attach','publish-ready','advance']);
});
test('targeted acceptance never publishes other ready lessons even when the course opts in',async()=>{
 const s=scenario({acceptance:true});s.build.profile.publishCompletedLessons=true;
 await s.run();assert.equal(s.events.includes('publish-ready'),false);
});
test('publication failure prevents advancing beyond a completed lesson',async()=>{
 let calls=0;const s=scenario({},true,{publishReady:async()=>{if(++calls===2)throw Error('PUBLICATION_READBACK_FAILED');},nextWork:()=>({continue:true,payload:{nextCompetencyIndex:19}})});
 s.build.profile.publishCompletedLessons=true;
 const result=await s.run();assert.equal(result.completed,false);assert.equal(s.events.includes('advance'),false);assert.equal(s.events.at(-1),'fail');
});

test('finished course cursor without a checkpoint repair reaches final release', async () => {
  let plan;
  const s = scenario({nextCompetencyIndex:40}, true, {
    attach: attachCompletedLessonMedia,
    nextWork: () => { throw Error('Final release must not plan a missing lesson retry'); },
    runCourse: async value => { plan=value; return {completed:true,findings:[],lessons:[]}; },
  });
  const result=await s.run();
  assert.equal(result.completed,true);
  assert.equal(plan.startIndex,40);
  assert.equal(plan.repairRenderRevision,undefined);
  assert.equal(plan.repairFromStep,undefined);
  assert.ok(s.events.includes('publish'));
  assert.ok(s.events.includes('complete'));
  assert.ok(!s.events.includes('fail'));
});
test('matching checkpoint repair retains its exact stage and render revision', async () => {
  let plan;
  const checkpointRepair={competencyId:'competency',fromStep:'storyboard',requestedAt:'2026-10-28T09:00:00Z'};
  const s=scenario({competencyId:'competency',checkpointRepair},true,{
    runCourse:async value=>{plan=value;return {completed:true,findings:[],lessons:[]};},
  });
  assert.equal((await s.run()).completed,true);
  assert.equal(plan.repairFromStep,'storyboard');
  assert.equal(plan.repairRenderRevision,checkpointRepair.requestedAt);
});
