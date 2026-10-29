import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';
import {describeWorkerError} from '../../lib/ultimate-course-builder/core/worker-error.mjs';
import {repairDirective} from '../../lib/ultimate-course-builder/core/repair-policy.mjs';
import {lessonAutopilotIdentity,lessonAutopilotType} from '../../lib/ultimate-course-builder/worker/lesson-autopilot-policy.mjs';
const strip=path=>stripTypeScriptTypes(readFileSync(new URL(path,import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replaceAll('export ','');
test('coordinator reserves canonical rows and creates the pool before instruction authoring',async()=>{
 const profile={parallelAutopilot:'three-role-v1',competencies:[{id:'first'},{id:'later'}]},events=[];
 const db={from(table){const q={select(){return q},eq(){return q},async maybeSingle(){return {data:null,error:null}},then(resolve){resolve({data:[],error:null})}};return q},async rpc(name,args){events.push(name);assert.equal(args.p_profile,profile);return {data:{poolId:'pool',taskCount:6},error:null}}};
 const coordinate=new Function('hydrateUltimateProfileSources','materializeUltimateDraft','contractHash','LESSON_AUTOPILOT_VERSION','notifyCourseDispatcher',strip('../../lib/ultimate-course-builder/worker/lesson-autopilot.ts')+';return coordinateLessonAutopilots;')(
  async()=>profile,async(_db,_course,p,ids,options)=>{assert.deepEqual(ids,['first','later']);assert.deepEqual(options,{deferInstruction:true});events.push('reserve-drafts');return p},JSON.stringify,'three-role-v1',async()=>{events.push('dispatch')});
 const result=await coordinate({db,job:{id:'job'},workerId:'worker',generation:1,build:{id:'build',course_id:'course',profile},assertActive(){}});
 assert.deepEqual(events,['reserve-drafts','seed_ultimate_lesson_autopilots','dispatch']);
 assert.equal(result.taskCount,6);assert.equal(result.completed,false);
});
const steps=new Function(strip('../../lib/ultimate-course-builder/core/types.ts')+';return ULTIMATE_BUILD_STEPS;')();
const payload=value=>Object.fromEntries(Object.entries(value).filter(([key])=>key!=='contractEvidence'));
const Runner=new Function('describeWorkerError','repairDirective','artifactPayload','contractHash','currentEvidence','stepInputHash','stepInputHashes','validateStepOutput','practicalVisualFailures','ULTIMATE_LESSON_CONTRACT_VERSION','MAX_TARGETED_REPAIRS','isDurableExternalBlocker','routeSelectiveRepairs','ULTIMATE_BUILD_STEPS','nonblockingManualReview','optionalManualReviewStage',
 strip('../../lib/ultimate-course-builder/core/build-runner.ts')+';return UltimateBuildRunner;')(
 describeWorkerError,repairDirective,payload,JSON.stringify,a=>a?.contractEvidence?.passed===true,()=>'',()=>[''],()=>[],()=>[],'fixture',2,()=>false,
 failures=>failures[0]?.code==='MEDIA_TEXT_UNREADABLE'?[{step:'scene_construction'}]:[],steps,()=>false,()=>false);
let completeChecks=0;
const runCourse=new Function('assertCompleteLesson','ULTIMATE_BUILD_STEPS',strip('../../lib/ultimate-course-builder/core/full-course-runner.ts')+';return runUltimateCourse;')(()=>{completeChecks++;},steps);
async function execute(role,{prefix=0,qualityFailure=false}={}){
 completeChecks=0;const calls=[],finishes=[];
 const artifacts=Object.fromEntries(steps.slice(0,prefix).map(step=>[step,{proof:step,contractEvidence:{passed:true}}]));
 const handlers=Object.fromEntries(steps.map(step=>[step,async()=>{calls.push(step);return qualityFailure&&step==='finished_media_qa'
  ? {passed:false,findings:[{step,severity:'error',code:'MEDIA_TEXT_UNREADABLE',message:'MEDIA_TEXT_UNREADABLE:3:390'}]}
  : {artifacts:{proof:step}};} ]));
 const identity=lessonAutopilotIdentity({job_type:lessonAutopilotType('c',role),payload:{autopilot:{version:'three-role-v1',poolId:'pool',competencyId:'c',role}}});
 const result=await runCourse({buildId:'build',courseId:'course',profile:{competencies:[{id:'c'}]},targetCompetencyId:'c',maxLessons:1,
  startAtStep:identity.startAtStep,stopAfterStep:identity.stopAfterStep},()=>new Runner(handlers),{
   createLesson:async()=>({id:'lesson'}),loadLessonCheckpoint:async()=>({artifacts,passedSteps:steps.slice(0,prefix),findings:[]}),
   updateBuild:async()=>{},recordStep:async()=>{},recordFinding:async()=>{},saveArtifact:async()=>{},finishLesson:async value=>finishes.push(value),
  },{createVersion:async()=>{}});
 return {result,calls,finishes,completeChecks};
}
test('instruction stops at its actual checkpoint without rendering or certifying a full lesson',async()=>{
 const x=await execute('instruction');assert.deepEqual(x.calls,steps.slice(0,6));
 assert.equal(x.result.stageReady,true);assert.equal(x.result.completed,false);assert.equal(x.completeChecks,0);assert.equal(x.finishes[0].status,'running');
});
test('media resumes instruction and stops before independent quality and publication',async()=>{
 const x=await execute('media',{prefix:6});assert.deepEqual(x.calls,steps.slice(6,14));
 assert.equal(x.result.stageReady,true);assert.equal(x.result.completed,false);assert.equal(x.completeChecks,0);assert.equal(x.finishes[0].status,'running');
});
test('quality delegates an upstream defect without re-rendering in its smaller worker',async()=>{
 const x=await execute('quality',{prefix:14,qualityFailure:true});assert.deepEqual(x.calls,['finished_media_qa']);
 assert.equal(x.result.completed,false);assert.equal(x.finishes[0].status,'built_with_findings');
 assert.equal(x.result.lessons[0].result.artifacts.__repairState.directive.target,'scene_construction');
});
test('quality cannot silently author a missing upstream checkpoint',async()=>{
 const x=await execute('quality',{prefix:5});assert.deepEqual(x.calls,[]);
 assert.equal(x.result.completed,false);assert.equal(x.result.findings[0].code,'AUTOPILOT_UPSTREAM_CHECKPOINT_REQUIRED');
});
test('forged lesson or role identity is rejected before work starts',()=>{
 assert.throws(()=>lessonAutopilotIdentity({job_type:lessonAutopilotType('another','media'),payload:{autopilot:{version:'three-role-v1',poolId:'pool',competencyId:'c',role:'media'}}}),/IDENTITY_MISMATCH/);
});
test('a later learner failure cannot redelegate an obsolete picture-cue repair',()=>{
 const currentRepairDirective=new Function(strip('../../lib/ultimate-course-builder/worker/lesson-autopilot.ts')+';return currentRepairDirective;')();
 const stale={failedStep:'lesson_film_render',requirements:[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'PICTURE_CUE_NOT_ALIGNED_TO_SPEECH'}]};
 const result={findings:[{step:'learner_runthrough',severity:'error',code:'LEARNER_RUNTHROUGH_CHECK_FAILED',message:'Authenticated learner check failed: captions'}],lessons:[{result:{artifacts:{__repairState:{directive:stale}}}}]};
 assert.equal(currentRepairDirective(result),undefined);
 const active={failedStep:'learner_runthrough',requirements:[{code:'LEARNER_RUNTHROUGH_CHECK_FAILED',message:'Authenticated learner check failed: captions'}]};
 result.lessons[0].result.artifacts.__repairState.directive=active;
 assert.equal(currentRepairDirective(result),active);
});
