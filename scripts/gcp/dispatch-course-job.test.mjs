import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchQueuedCourseJob } from './dispatch-course-job.mjs';

function setup(executions, queued, httpStatus=200) {
  const calls=[];
  const run=(_command,args)=>{calls.push(args); return JSON.stringify(executions);};
  const request=async()=>({ok:httpStatus===200,status:httpStatus,json:async()=>queued});
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
  assert.equal((await dispatchQueuedCourseJob(s.options)).status,'dispatched');
  assert.equal(s.calls.length,2);
  assert.ok(s.calls[1].includes('--tasks=1'));
  assert.ok(s.calls[1].includes('--async'));
});
test('queue outage fails closed rather than launching blind work',async()=>{
  const s=setup([],[],503);
  await assert.rejects(dispatchQueuedCourseJob(s.options),/COURSE_QUEUE_READ_HTTP_503/);
  assert.equal(s.calls.length,1);
});
