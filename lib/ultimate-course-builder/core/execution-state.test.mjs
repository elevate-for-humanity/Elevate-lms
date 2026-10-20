import test from 'node:test';
import assert from 'node:assert/strict';
import { courseExecutionState } from './execution-state.mjs';
const now = Date.parse('2026-10-18T12:00:00Z');
const job = {status:'running',lease_owner:'worker',heartbeat_at:new Date(now-1000).toISOString(),lease_expires_at:new Date(now+60000).toISOString()};
test('queue and a launch request do not prove execution',()=>{
 assert.equal(courseExecutionState({status:'queued',payload:{dispatched:true}},{now}).phase,'queued');
 assert.equal(courseExecutionState({...job,lease_owner:null},{now}).active,false);
});
test('fresh heartbeat plus live owned lease proves execution',()=>{
 assert.equal(courseExecutionState(job,{now}).phase,'heartbeat_verified');
 assert.equal(courseExecutionState({...job,payload:{progress:{phase:'render'}}},{now}).phase,'processing');
});
test('future and stale heartbeats never prove execution',()=>{
 for(const delta of [-90000,1000]) assert.equal(courseExecutionState({...job,heartbeat_at:new Date(now+delta).toISOString()},{now}).active,false);
});
test('pause is independent of course lifecycle and preserves the job',()=>{
 assert.equal(courseExecutionState(job,{now,paused:true}).phase,'paused');
 assert.equal(job.status,'running');
});
