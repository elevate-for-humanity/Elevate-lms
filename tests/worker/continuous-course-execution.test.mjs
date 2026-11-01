import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {continuousCourseLease,checkpointContinuousLesson} from '../../lib/ultimate-course-builder/worker/continuous-course-lease.mjs';
import {createCourseProgressWatch,reportCourseProgress} from '../../lib/ultimate-course-builder/worker/progress-watch.mjs';

// Exercise the production control flow with providers and database transport
// substituted. No Google execution or generated media is needed for this test.
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/worker/process-job.ts',import.meta.url),'utf8'))
  .split('\n').filter(line=>!line.startsWith('import ')).join('\n').replace(/^export (?=(?:async )?function )/gm,'');
async function run({pauseAfterAttachment=false,checkpointAccepted=true}={}){
 const calls=[],fences=[],writes=[];let paused=false,claims=0,yields=0,waits=0;
 const job={id:'job',build_id:'build',execution_generation:7,payload:{nextCompetencyIndex:0}};
 const profile={competencies:[{id:'first'},{id:'second'}]};
 const build={id:'build',course_id:'a6b0b712-1cf0-475a-ba79-ee2023dea8ec',profile};
 const db={from(table){let values,filters=[];
  const q={select:()=>q,eq:(...v)=>{filters.push(v);return q;},gt:()=>q,is:()=>q,
   update:v=>{values=v;return q;},single:async()=>({data:table==='ultimate_course_builds'?{...build,profile:{...profile,ownerPaused:paused}}:{},error:null}),
   then:resolve=>{if(values)writes.push(values);return Promise.resolve({data:values?.payload?.nextCompetencyIndex===1&&!checkpointAccepted?[]:values?[{id:'job'}]:[],error:null}).then(resolve);}};
  return q;
 },rpc:async()=>({error:null})};
 const dependencies={continuousCourseLease,checkpointContinuousLesson,createCourseProgressWatch,reportCourseProgress,
  attachCompletedLessonMedia:async()=>{if(pauseAfterAttachment)paused=true;},preservedCourseCursor:(_p,p)=>p,
  recordProductionAlert:async()=>{},ULTIMATE_BUILD_STEPS:[],
  UltimateJobQueue:class{async claim(){claims++;return job;}async heartbeat(){return true;}
   async yieldProgress(){yields++;}async waitForDependency(){waits++;}async fail(){throw Error('unexpected failure');}},
  createLeaseDeadline:()=>({assertActive(){},renew:()=>true,lose(){},dispose(){},race:p=>p}),
  createUltimateRuntime:async(_db,fence)=>{fences.push(fence);return {persistence:{},artifacts:{}};},
  createProductionHandlers:()=>({}),UltimateBuildRunner:class{},
  runUltimateCourse:async input=>{calls.push(input);return calls.length===1?
   {completed:true,hasRemaining:true,nextIndex:1,lessons:[{competencyId:'first'}],findings:[]}:
   {completed:false,lessons:[{competencyId:'second'}],findings:[{code:'external'}]};},
  assertCompleteLesson(){},UltimateReleaseService:class{},
  nextCourseWork:new Function('isDurableExternalBlocker',stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/worker/course-cursor.ts',import.meta.url),'utf8')).split('\n').filter(line=>!line.startsWith('import ')).join('\n').replace('export function','function')+';return nextCourseWork;')(f=>f.code==='external'),
  resolveReleaseActor:async()=>'',hydrateUltimateProfileSources:async(_db,_id,p)=>p,
  materializeUltimateDraft:async(_db,_id,p)=>p,isDurableExternalBlocker:f=>f.code==='external',
  liveCheckpointRepairReader:()=>async()=>null,verifyNewCourseAssessmentContract(){},
 };
 const processJob=new Function(...Object.keys(dependencies),source+';return processUltimateJob;')(...Object.values(dependencies));
 const result=await processJob(db,'same-worker');
 return {result,calls,fences,writes,claims,yields,waits};
}
test('two lessons execute under one claim and generation with the new cursor',async()=>{
 const x=await run();assert.equal(x.claims,1);assert.equal(x.yields,0);
 assert.deepEqual(x.calls.map(c=>c.startIndex),[0,1]);
 assert.deepEqual(x.fences,[{jobId:'job',workerId:'same-worker',generation:7},{jobId:'job',workerId:'same-worker',generation:7}]);
 assert.equal(x.result.awaitingDependency,true);assert.equal(x.waits,1);
 assert.ok(x.writes.some(w=>w.payload?.nextCompetencyIndex===1));
});
test('owner pause at a lesson boundary prevents the next lesson',async()=>{
 const x=await run({pauseAfterAttachment:true});assert.equal(x.calls.length,1);
 assert.equal(x.result.ownerPaused,true);assert.equal(x.waits,1);
});
test('an unacknowledged continuation checkpoint never starts the next lesson',async()=>{
 const x=await run({checkpointAccepted:false});assert.equal(x.calls.length,1);assert.equal(x.yields,1);
});
