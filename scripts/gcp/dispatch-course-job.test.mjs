import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchQueuedCourseJob } from './dispatch-course-job.mjs';

function setup(executions, queued, httpStatus=200) {
  const calls=[];
  const run=(_command,args)=>{calls.push(args); return JSON.stringify(executions);};
  const request=async url=>({ok:httpStatus===200,status:httpStatus,json:async()=>url.searchParams.has('id') ? [{id:'queued',status:'running',lease_owner:'worker-test',heartbeat_at:'2026-10-06T10:00:01Z'}] : queued});
  return {calls,options:{run,request,env:{SUPABASE_SERVICE_ROLE_KEY:'test-fixture'},now:new Date('2026-10-06T10:00:00Z')}};
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
  assert.equal(s.calls.length,2);
  assert.ok(s.calls[1].includes('--tasks=1'));
  assert.ok(s.calls[1].includes('--async'));
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
  assert.equal(s.calls.length,2);
});
