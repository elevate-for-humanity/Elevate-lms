import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchQueuedCourseJob } from './dispatch-course-job.mjs';

function setup(executions, queued, httpStatus=200) {
  const calls=[];
  const run=(_command,args)=>{calls.push(args); return JSON.stringify(args[2] === 'describe' ? {spec:{template:{spec:{template:{spec:{containers:[{resources:{limits:{cpu:'8',memory:'32Gi'}}}]}}}}}} : executions);};
  const request=async url=>({ok:httpStatus===200,status:httpStatus,json:async()=>url.searchParams.has('id') ? [{id:'queued',status:'running',lease_owner:'worker-test',heartbeat_at:'2026-10-06T10:00:01Z'}] : queued});
  return {calls,options:{run,request,capacityCheck:async()=>({fits:true}),env:{SUPABASE_SERVICE_ROLE_KEY:'test-fixture'},now:new Date('2026-10-06T10:00:00Z')}};
}
test('busy worker does not claim or launch overlapping work',async()=>{
  const s=setup([{status:{}}],[{id:'queued'}]);
  assert.equal((await dispatchQueuedCourseJob(s.options)).status,'busy');
  assert.equal(s.calls.length,1);
});
test('empty queue does not start a paid execution',async()=>{
  const s=setup([],[]);
  assert.equal((await dispatchQueuedCourseJob(s.options)).status,'empty');
  assert.equal(s.calls.length,1);
});
test('eligible queued work launches exactly one finite asynchronous task',async()=>{
  const s=setup([{status:{completionTime:'done'}}],[{id:'queued'}]);
  assert.equal((await dispatchQueuedCourseJob(s.options)).status,'assigned');
  assert.equal(s.calls.length,3);
  assert.ok(s.calls[2].includes('--tasks=1'));
  assert.ok(s.calls[2].includes('--async'));
});
test('queue outage fails closed rather than launching blind work',async()=>{
  const s=setup([],[],503);
  await assert.rejects(dispatchQueuedCourseJob(s.options),/COURSE_QUEUE_READ_HTTP_503/);
  assert.equal(s.calls.length,1);
});

test('container launch without a durable claim fails instead of reporting started',async()=>{
  const s=setup([], [{id:'queued'}]);
  s.options.request=async()=>({ok:true,status:200,json:async()=>[{id:'queued',status:'queued',heartbeat_at:null}]});
  s.options.assignmentAttempts=2;
  s.options.delay=async()=>{};
  await assert.rejects(dispatchQueuedCourseJob(s.options),/COURSE_WORKER_ASSIGNMENT_TIMEOUT/);
  assert.equal(s.calls.length,3);
});

test('expired running lease starts a recovery worker and requires its fresh heartbeat',async()=>{
 const s=setup([],[{id:'queued',attempts:1,max_attempts:5,heartbeat_at:'2026-10-06T09:00:00Z'}]);
 const base=s.options.request;
 s.options.request=async url=>{
  if(!url.searchParams.has('id')){
   assert.equal(url.searchParams.has('status'),false);
   assert.match(url.searchParams.get('or'),/status.eq.running,lease_expires_at.lt/);
  }
  return base(url);
 };
 assert.equal((await dispatchQueuedCourseJob(s.options)).status,'assigned');
 assert.equal(s.calls.length,3);
});
test('exhausted candidates do not launch a recovery worker',async()=>{
 const s=setup([],[{id:'queued',attempts:5,max_attempts:5}]);
 assert.equal((await dispatchQueuedCourseJob(s.options)).status,'empty');
 assert.equal(s.calls.length,1);
});

test('insufficient approved regional capacity leaves queued work untouched and does not launch', async()=>{
  const s=setup([],[{id:'queued'}]);
  s.options.capacityCheck=async({task})=>{assert.equal(task.containers[0].resources.limits.memory,'32Gi');return {fits:false,required:{cpu:24000,memory:64*2**30},granted:{cpu:20000,memory:40*2**30}};};
  const result=await dispatchQueuedCourseJob(s.options);
  assert.equal(result.status,'capacity_wait');
  assert.equal(s.calls.some(c=>c.includes('execute')),false);
});
