import test from 'node:test';import assert from 'node:assert/strict';
import {resumeRepairedCourseJobs} from './resume-repaired-course-jobs.mjs';
const imageSha='a'.repeat(40),imageDigest='sha256:'+'b'.repeat(64),env={SUPABASE_SERVICE_ROLE_KEY:'test'};
const base={id:'job',build_id:'build',payload:{nextCompetencyIndex:18},status:'failed',execution_generation:8,lease_expires_at:null,last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson:SELECTED_COURSE_SOURCE_DURATION_REQUIRED',
 monitor:{enabled:true},build:{course_id:'a6b0b712-1cf0-475a-ba79-ee2023dea8ec',status:'blocked',profile:{ownerPaused:false}}};
async function run(job,conflict=false){const writes=[];const result=await resumeRepairedCourseJobs({imageSha,imageDigest,env,request:async(url,options)=>{
 if(options.method==='PATCH'){writes.push({url:String(url),body:JSON.parse(options.body)});return {ok:true,json:async()=>conflict?[]:[{id:'job',status:'queued',execution_generation:9}]};}
 return {ok:true,json:async()=>String(url).includes('status=in.')?[]:[job]};
 }});return {writes,result};}
test('new verified repair queues an exhausted internal failure, retaining checkpoints and previous error',async()=>{
 const {writes,result}=await run(base);assert.deepEqual(result.jobIds,['job']);
 const b=writes[0].body;assert.equal(b.attempts,0);assert.equal(b.execution_generation,9);assert.equal(b.payload,undefined);assert.equal(b.artifacts,undefined);
 assert.equal(b.monitor.lastRepairDeployment.previousError,base.last_error);
 assert.match(writes[0].url,/execution_generation=eq.8/);
});
test('same image cannot continuously retry the same unresolved defect',async()=>{
 const {writes}=await run({...base,monitor:{...base.monitor,lastRepairDeployment:{imageSha}}});assert.equal(writes.length,0);
});
test('pause, live lease, publication, unrelated course and external blockers never restart',async()=>{
 for(const job of [{...base,status:'running'},{...base,lease_expires_at:'2999-01-01'},
 {...base,build:{...base.build,profile:{ownerPaused:true}}},{...base,build:{...base.build,status:'published'}},
 {...base,build:{...base.build,course_id:'other'}},{...base,last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:MEDIA_LICENSE_REQUIRED'},
 {...base,last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:COURSE_OBJECT_STORAGE_UPLOAD_FAILED'},
 {...base,monitor:{enabled:false}}])assert.equal((await run(job)).writes.length,0);
});
test('concurrent claim or monitor change produces no false restart proof',async()=>{
 assert.deepEqual((await run(base,true)).result.jobIds,[]);
});

test('approved-source contract deployment resumes old per-scene metadata and saved-render findings',async()=>{
 for(const last_error of [
  'ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson:FINDINGS=[{"code":"ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED"}]',
  'ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson:FINDINGS=[{"code":"ULTIMATE_RENDER_SAVED_ASSIGNMENT_REQUIRED"}]',
  'ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson:FINDINGS=[{"message":"licensed third-party scenes are missing entitlement/license evidence"}]',
 ]) assert.equal((await run({...base,last_error})).writes.length,1);
});


test('an active continuation prevents a historical failed attempt being reopened',async()=>{
 let writes=0;
 const result=await resumeRepairedCourseJobs({imageSha,imageDigest,env,request:async(url,options)=>{
  if(options.method==='PATCH'){writes++;throw Error('must not duplicate active work');}
  return {ok:true,json:async()=>String(url).includes('status=in.')?[{build_id:'build'}]:[base]};
 }});
 assert.equal(writes,0);assert.deepEqual(result.jobIds,[]);
});
test('only the furthest historical cursor is recovered and an admission race is harmless',async()=>{
 const writes=[];
 const result=await resumeRepairedCourseJobs({imageSha,imageDigest,env,request:async(url,options)=>{
  if(options.method==='PATCH'){writes.push(String(url));return {ok:false,status:409};}
  return {ok:true,json:async()=>String(url).includes('status=in.')?[]:[{...base,id:'older',payload:{nextCompetencyIndex:2}},base]};
 }});
 assert.equal(writes.length,1);assert.match(writes[0],/id=eq.job/);assert.deepEqual(result.jobIds,[]);
});
