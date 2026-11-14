import test from 'node:test';
import assert from 'node:assert/strict';
import {reapUnclaimedLessonExecutions} from './reap-unclaimed-lesson-executions.mjs';
const now=new Date('2026-11-02T11:00:00Z');
const execution={metadata:{name:'elevate-course-quality-old'},status:{startTime:'2026-11-02T09:00:00Z'},spec:{template:{spec:{containers:[{env:[{name:'ULTIMATE_WORKER_ID',value:'autopilot-quality-11111111-1111-1111-1111-111111111111'}]}]}}}};
function fixture(owners=[]) {const cancelled=[],reads=[];return {cancelled,reads,options:{executions:[execution],role:'quality',now,root:'https://database.example/rest/v1/ultimate_build_jobs',headers:{},request:async url=>{reads.push(url);return {ok:true,json:async()=>owners};},cancel:async name=>cancelled.push(name)}};}
test('old execution without a live owned lesson is reclaimed using its exact worker prefix',async()=>{
 const f=fixture();await reapUnclaimedLessonExecutions(f.options);assert.deepEqual(f.cancelled,['elevate-course-quality-old']);
 assert.equal(f.reads[0].searchParams.get('lease_owner'),'like.autopilot-quality-11111111-1111-1111-1111-111111111111-*');
});
test('a live lease protects rendering even if the cloud execution is old',async()=>{const f=fixture([{id:'live-lesson'}]);await reapUnclaimedLessonExecutions(f.options);assert.equal(f.cancelled.length,0);});
test('startup grace, unknown identity, and other roles are never cancelled',async()=>{
 for(const mutate of [e=>e.status.startTime='2026-11-02T10:59:00Z',e=>e.spec.template.spec.containers[0].env=[],e=>e.spec.template.spec.containers[0].env[0].value='autopilot-media-11111111-1111-1111-1111-111111111111']){
  const f=fixture(),e=structuredClone(execution);mutate(e);f.options.executions=[e];await reapUnclaimedLessonExecutions(f.options);assert.equal(f.cancelled.length,0);assert.equal(f.reads.length,0);
 }
});
test('unavailable or malformed ownership inventory cannot authorize cancellation',async()=>{
 for(const response of [{ok:false,status:503},{ok:true,json:async()=>null}]){const f=fixture();f.options.request=async()=>response;await assert.rejects(reapUnclaimedLessonExecutions(f.options),/ULTIMATE_ORPHAN_LEASE/);assert.equal(f.cancelled.length,0);}
});

test('Cloud Run cancellation failure does not fabricate freed capacity or kill scheduling',async()=>{
 const f=fixture();const failures=[];
 f.options.cancel=async()=>{const error=new Error('opaque provider error');error.code='command_failed';throw error;};
 f.options.onCancelFailure=failure=>failures.push(failure);
 const cancelled=await reapUnclaimedLessonExecutions(f.options);
 assert.deepEqual(cancelled,[]);
 assert.deepEqual(failures,[{name:'elevate-course-quality-old',code:'command_failed'}]);
});
