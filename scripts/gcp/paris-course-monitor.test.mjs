import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectCourseAutopilot} from '../../lib/ultimate-course-builder/worker/paris-monitor.mjs';
import {monitorCourseQueue} from './paris-course-monitor.mjs';
const now=new Date('2026-10-14T18:00:00Z');
const job=(extra={})=>({id:'job',status:'queued',attempts:1,max_attempts:5,execution_generation:2,monitor:{enabled:true},...extra});
test('saved pause never attributes an actor and finished revisions have distinct states',()=>{
 const paused=inspectCourseAutopilot(job(),{profile:{ownerPaused:true}},+now);
 assert.equal(paused.state,'paused');
 assert.match(paused.reason,/origin is not established/);
 assert.equal(inspectCourseAutopilot(job(),{status:'published',profile:{ownerPaused:true}},+now).state,'published');
 assert.equal(inspectCourseAutopilot(job(),{status:'archived'},+now).state,'archived');
});
test('a future heartbeat cannot certify a live worker',()=>{
 const state=inspectCourseAutopilot(job({status:'running',heartbeat_at:'2027-10-14T18:00:00Z',lease_expires_at:'2027-10-14T18:05:00Z'}),{},+now);
 assert.equal(state.state,'heartbeat_stale');
 assert.equal(state.action,'wait_for_lease');
});
test('never overrides an unexpired lease or owner pause',()=>{
 assert.equal(inspectCourseAutopilot(job({status:'running',heartbeat_at:'2026-10-14T17:55:00Z',lease_expires_at:'2026-10-14T18:05:00Z'}),{},+now).action,'wait_for_lease');
 assert.equal(inspectCourseAutopilot(job(),{profile:{ownerPaused:true}},+now).action,'none');
});
test('recovers expired leases through the existing claim and preserves retry limits',()=>{
 assert.equal(inspectCourseAutopilot(job({status:'running',lease_expires_at:'2026-10-14T17:59:00Z'}),{},+now).action,'dispatch');
 assert.equal(inspectCourseAutopilot(job({attempts:5}),{},+now).state,'attention_required');
});
test('only bounded transient failures requeue; no fabricated sources or endless quality retries',()=>{
 assert.equal(inspectCourseAutopilot(job({status:'failed',last_error:'fetch failed'}),{},+now).action,'requeue');
 for(const last_error of ['OWNER_PAUSED','LICENSE_APPROVAL_REQUIRED','ULTIMATE_DEPENDENCIES_UNRESOLVED:a','ULTIMATE_GOOGLE_AUTHORING_HTTP_403','QUALITY_FAILED'])
  assert.equal(inspectCourseAutopilot(job({status:'failed',last_error}),{},+now).action,'none');
 assert.equal(inspectCourseAutopilot(job({status:'failed',last_error:'timeout',monitor:{enabled:true,recoveries:3}}),{},+now).action,'none');
});
test('monitor uses fenced changes and never resets attempts or changes worker payload',async()=>{
 const calls=[];const row=job({status:'failed',last_error:'fetch failed'});
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
  request:async(url,options)=>{calls.push({url:String(url),options});return {ok:true,json:async()=>options.method?[{id:'job'}]:[row]};}});
 assert.match(calls[1].url,/execution_generation=eq.2/);
 const body=JSON.parse(calls[1].options.body);
 assert.equal(body.status,'queued');assert.equal(body.execution_generation,3);assert.equal(body.attempts,undefined);assert.equal(body.payload,undefined);
 assert.equal(body.monitor.recoveries,1);
});
test('read or write failures cannot be reported as monitoring success',async()=>{
 await assert.rejects(monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},request:async()=>({ok:false,status:503})}),/HTTP_503/);
});
test('fresh running observation clears an obsolete waiting reason',async()=>{
 const row=job({status:'running',heartbeat_at:'2026-10-14T17:59:50Z',lease_expires_at:'2026-10-14T18:05:00Z',monitor:{enabled:true,reason:'Waiting for a fresh worker heartbeat'}});
 let body;
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
  request:async(_url,options)=>{if(options.method)body=JSON.parse(options.body);return {ok:true,json:async()=>options.method?[{id:'job'}]:[row]};}});
 assert.equal(body.monitor.state,'running');assert.equal(body.monitor.reason,null);
});
