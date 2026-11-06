import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectCourseAutopilot} from '../../lib/ultimate-course-builder/worker/paris-monitor.mjs';
import {monitorCourseQueue,latestRoleJobs} from './paris-course-monitor.mjs';
const now=new Date('2026-10-14T18:00:00Z');
test('waiting role prerequisites do not dispatch or inherit another lesson’s storage failure',()=>{
 const observation=inspectCourseAutopilot({status:'queued',available_at:'infinity',monitor:{enabled:true},payload:{autopilot:{role:'quality'}}},
  {status:'running',findings:[{message:'COURSE_OBJECT_STORAGE_UPLOAD_FAILED'}]},now.getTime());
 assert.equal(observation.state,'prerequisite_wait');assert.equal(observation.action,'observe');
});
const job=(extra={})=>({id:'job',status:'queued',attempts:1,max_attempts:5,execution_generation:2,monitor:{enabled:true},...extra});
test('saved pause never attributes an actor and finished revisions have distinct states',()=>{
 const paused=inspectCourseAutopilot(job(),{profile:{ownerPaused:true}},+now);
 assert.equal(paused.state,'paused');
 assert.match(paused.reason,/origin is not established/);
 assert.equal(inspectCourseAutopilot(job(),{status:'published',profile:{ownerPaused:true}},+now).state,'published');
 assert.equal(inspectCourseAutopilot(job(),{status:'archived'},+now).state,'archived');
});
test('completed attempts retain their terminal state despite old storage failures and a later build pause',()=>{
 for(const last_error of ['storage cap exceeded','COURSE_OBJECT_STORAGE_UPLOAD_FAILED','timeout']) {
  const state=inspectCourseAutopilot(job({status:'completed',last_error}),{status:'running',profile:{ownerPaused:true}},+now);
  assert.equal(state.state,'checkpoint_complete_with_prior_error');
  assert.equal(state.action,'none');
 }
});
test('cancelled builds never request another worker or retry historical failure',()=>{
 for(const status of ['queued','running','failed','completed']) {
  const state=inspectCourseAutopilot(job({status,last_error:'timeout'}),{status:'cancelled'},+now);
  assert.equal(state.state,'cancelled');assert.equal(state.action,'none');
 }
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
 assert.equal(body.monitor.recoveries,0);
 assert.equal(body.monitor.recoveryRequest.executionGeneration,3);
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

test('PARIS records confirmed claims only from valid live worker evidence',async()=>{
 const calls=[];
 const row=job({status:'running',lease_owner:'worker-1',heartbeat_at:'2026-10-14T17:59:50Z',lease_expires_at:'2026-10-14T18:05:00Z',monitor:{enabled:true,recoveries:0}});
 const request=async(_url,options)=>{if(options.method)calls.push(JSON.parse(options.body));return {ok:true,json:async()=>options.method?[{id:'job'}]:[row]};};
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,request});
 assert.equal(calls[0].monitor.confirmedAssignments,1);
 assert.equal(calls[0].monitor.lastConfirmedLeaseOwner,'worker-1');
 assert.equal(calls[0].monitor.recoveries,0);
 row.monitor=calls[0].monitor;calls.length=0;
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,request});
 assert.equal(calls[0].monitor.confirmedAssignments,1);
});
test('queued jobs cannot claim confirmed recovery evidence',async()=>{
 const row=job();let body;
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
  request:async(_url,options)=>{if(options.method)body=JSON.parse(options.body);return {ok:true,json:async()=>options.method?[{id:'job'}]:[row]};}});
 assert.equal(body.monitor.confirmedAssignments,undefined);
});

test('PARIS requests lease owner so confirmed assignment reporting can work in production',async()=>{
 let selected='';
 const row=job({status:'running',lease_owner:'worker-confirmed',heartbeat_at:'2026-10-14T17:59:50Z',lease_expires_at:'2026-10-14T18:05:00Z'});
 let written;
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
  request:async(url,options)=>{
   if(!options.method)selected=new URL(url).searchParams.get('select');
   else written=JSON.parse(options.body);
   return {ok:true,json:async()=>options.method?[{id:'job'}]:[row]};
  }});
 assert.match(selected,/\blease_owner\b/);
 assert.equal(written.monitor.confirmedAssignments,1);
 assert.equal(written.monitor.action,'observe');
});

test('PARIS confirms recovery only after an observed fresh replacement lease',async()=>{
 const row=job({status:'queued',lease_owner:null,heartbeat_at:'2026-10-14T17:40:00Z',monitor:{enabled:true,recoveries:0,lastConfirmedLeaseOwner:'old-worker'}});
 let body;
 const request=async(_url,options)=>{
   if(options.method) {body=JSON.parse(options.body);return {ok:true,json:async()=>[{id:'job'}]};}
   return {ok:true,json:async()=>[row]};
 };
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,request});
 assert.equal(body.monitor.recoveries,0);
 row.monitor=body.monitor;
 row.status='running';row.lease_owner='new-worker';row.heartbeat_at='2026-10-14T18:00:10Z';
 row.lease_expires_at='2026-10-14T18:05:00Z';
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now:new Date('2026-10-14T18:00:15Z'),request});
 assert.equal(body.monitor.recoveries,1);
 assert.equal(body.monitor.lastConfirmedRecoveryOwner,'new-worker');
 assert.equal(body.monitor.recoveryRequest,null);
 row.monitor=body.monitor;
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now:new Date('2026-10-14T18:00:20Z'),request});
 assert.equal(body.monitor.recoveries,1);
});

test('same worker identifier confirms a new execution generation only once',async()=>{
 const row=job({status:'running',execution_generation:3,lease_owner:'worker',heartbeat_at:'2026-10-14T17:59:50Z',lease_expires_at:'2026-10-14T18:05:00Z',monitor:{enabled:true,confirmedAssignments:1,recoveries:0,lastConfirmedLeaseOwner:'worker',lastConfirmedExecutionGeneration:2,lastConfirmedWorkerHeartbeat:'2026-10-14T17:50:00Z',recoveryRequest:{executionGeneration:3,previousExecutionGeneration:2,previousLeaseOwner:'worker',requestedAt:'2026-10-14T17:59:00Z'}}});
 let body;
 const request=async(_url,options)=>{if(options.method)body=JSON.parse(options.body);return {ok:true,json:async()=>options.method?[{id:'job'}]:[row]};};
 const options={env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,request};
 await monitorCourseQueue(options);
 assert.equal(body.monitor.confirmedAssignments,2);
 assert.equal(body.monitor.recoveries,1);
 row.monitor=body.monitor;
 row.heartbeat_at='2026-10-14T17:59:55Z';
 await monitorCourseQueue(options);
 assert.equal(body.monitor.confirmedAssignments,2);
 assert.equal(body.monitor.recoveries,1);
});

test('conditional write conflict rereads current generation and respects an arriving pause',async()=>{
 const row=job({status:'failed',last_error:'fetch failed'});
 const writes=[];let reads=0;
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
 request:async(url,options)=>{
  if(options.method){writes.push(JSON.parse(options.body));return {ok:true,json:async()=>writes.length===1?[]:[{id:'job'}]};}
  reads++;
  if(reads>1){assert.equal(new URL(url).searchParams.get('id'),'in.(job)');return {ok:true,json:async()=>[{...row,execution_generation:3,ultimate_course_builds:{profile:{ownerPaused:true}}}]};}
  return {ok:true,json:async()=>[row]};
 }});
 assert.equal(writes.length,2);
 assert.equal(writes[0].status,'queued');
 assert.equal(writes[1].status,undefined);
 assert.equal(writes[1].monitor.state,'paused');
});

test('monitor pagination uses an immutable ID cursor rather than mutable updated time',async()=>{
 const ids=[];let reads=0;
 const result=await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
 request:async(url,options)=>{
  if(options.method)return {ok:true,json:async()=>[{id:'saved'}]};
  const params=new URL(url).searchParams;
  assert.equal(params.get('order'),'id.asc');assert.equal(params.has('offset'),false);
  if(reads++===0)return {ok:true,json:async()=>Array.from({length:100},(_,i)=>job({id:String(i).padStart(3,'0')}))};
  ids.push(params.get('id'));return {ok:true,json:async()=>[job({id:'100'})]};
 }});
 assert.deepEqual(ids,['gt.099']);assert.equal(result.length,101);
});

test('expired recovery intent cannot credit a later unrelated worker assignment',async()=>{
 const row=job({status:'running',lease_owner:'worker-new',heartbeat_at:'2026-10-14T17:59:50Z',lease_expires_at:'2026-10-14T18:05:00Z',monitor:{enabled:true,recoveries:0,recoveryRequest:{requestedAt:'2026-10-14T16:00:00Z',executionGeneration:1,previousLeaseOwner:'worker-old'}}});
 let body;
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
 request:async(_url,options)=>{if(options.method)body=JSON.parse(options.body);return {ok:true,json:async()=>options.method?[{id:'job'}]:[row]};}});
 assert.equal(body.monitor.recoveries,0);assert.equal(body.monitor.recoveryRequest,null);
});

test('owner pause closes an outstanding recovery intent without dispatching or requeueing',async()=>{
 const row=job({ultimate_course_builds:{ownerPaused:true},monitor:{enabled:true,recoveryRequest:{requestedAt:'2026-10-14T17:59:00Z',executionGeneration:2}}});let body;
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
 request:async(_url,options)=>{if(options.method)body=JSON.parse(options.body);return {ok:true,json:async()=>options.method?[{id:'job'}]:[row]};}});
 assert.equal(body.monitor.recoveryRequest,null);assert.equal(body.status,undefined);
});

test('an exhausted expired lease retains a real stop reason without resetting or replaying work',async()=>{
 for(const last_error of [null,'ULTIMATE_INTERNAL_REPAIR_REQUIRED:saved-scene']){
  const row=job({status:'running',attempts:5,last_error,lease_owner:'expired-worker',heartbeat_at:'2026-10-14T17:40:00Z',lease_expires_at:'2026-10-14T17:45:00Z'});
  let body,url;
  await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
   request:async(value,options)=>{if(options.method){body=JSON.parse(options.body);url=String(value);}return {ok:true,json:async()=>options.method?[{id:'job'}]:[row]};}});
  assert.equal(body.status,'failed');assert.equal(body.execution_generation,3);
  assert.equal(body.last_error,last_error??'ULTIMATE_WORKER_LEASE_EXPIRED:retry_limit_reached');
  assert.equal(body.attempts,undefined);assert.equal(body.payload,undefined);
  assert.match(url,/lease_expires_at=lt\./);assert.match(url,/execution_generation=eq.2/);
 }
});


test('PARIS wakes verified quality work and never bypasses a saved owner pause',async()=>{
 const base={build_id:'build-1',attempts:0,max_attempts:5,execution_generation:3,monitor:{enabled:true},ultimate_course_builds:{status:'running',ownerPaused:false}};
 const quality={...base,id:'quality',job_type:'lesson_autopilot:lesson-a:quality',status:'queued',available_at:'infinity'};
 const instruction={...base,id:'instruction',job_type:'lesson_autopilot:lesson-a:instruction',status:'completed',last_error:null};
 const media={...base,id:'media',job_type:'lesson_autopilot:lesson-a:media',status:'completed',last_error:null};
 for(const {rows,wakes} of [
  {rows:[quality,instruction,media],wakes:1},
  {rows:[quality,instruction,{...media,status:'failed'}],wakes:0},
  {rows:[{...quality,ultimate_course_builds:{status:'running',ownerPaused:true}},instruction,media],wakes:0},
 ]){
  const writes=[];let selected='';
  await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
   request:async(url,options={})=>{
    if(!options.method){selected=new URL(url).searchParams.get('select');return {ok:true,json:async()=>rows};}
    writes.push({url:String(url),body:JSON.parse(options.body)});
    return {ok:true,json:async()=>[{id:'quality'}]};
   }});
  assert.match(selected,/\bjob_type\b/);
  const actual=writes.filter(w=>w.url.includes('available_at=eq.infinity'));
  assert.equal(actual.length,wakes);
  if(wakes){
   assert.equal(actual[0].body.available_at,now.toISOString());
   assert.match(actual[0].url,/execution_generation=eq.3/);
   assert.equal(actual[0].body.status,undefined);
   assert.equal(actual[0].body.attempts,undefined);
  }
 }
});

test('unknown owner pause cannot wake a held quality job even with completed predecessors',async()=>{
 const base={build_id:'build-unknown',attempts:0,max_attempts:5,execution_generation:3,monitor:{enabled:true}};
 const quality={...base,id:'quality',job_type:'lesson_autopilot:lesson-x:quality',status:'queued',available_at:'infinity',ultimate_course_builds:{status:'running',ownerPaused:null}};
 const instruction={...base,id:'instruction',job_type:'lesson_autopilot:lesson-x:instruction',status:'completed',last_error:null};
 const media={...base,id:'media',job_type:'lesson_autopilot:lesson-x:media',status:'completed',last_error:null};
 const writes=[];
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
  request:async(url,options={})=>{
   if(!options.method)return {ok:true,json:async()=>[quality,instruction,media]};
   writes.push({url:String(url),body:JSON.parse(options.body)});
   return {ok:true,json:async()=>[{id:'saved'}]};
  }});
 assert.equal(writes.filter(w=>w.url.includes('available_at=eq.infinity')).length,0);
 assert.equal(writes.filter(w=>w.body.available_at!==undefined).length,0);
});

test('quality dependency lookup prefers newest producer by created_at, not UUID',()=>{
 const rows=[
  {id:'zzz',build_id:'build',job_type:'lesson_autopilot:a:media',status:'completed',created_at:'2026-11-01T00:00:00Z',execution_generation:1},
  {id:'aaa',build_id:'build',job_type:'lesson_autopilot:a:media',status:'failed',created_at:'2026-11-05T00:00:00Z',execution_generation:2},
 ];
 assert.equal(latestRoleJobs(rows).get('build|lesson_autopilot:a:media').status,'failed');
 assert.equal(latestRoleJobs([...rows].reverse()).get('build|lesson_autopilot:a:media').status,'failed');
});
test('unresolvable duplicate chronology never wakes quality stage',()=>{
 const rows=[
  {id:'one',build_id:'build',job_type:'lesson_autopilot:a:media',status:'completed'},
  {id:'two',build_id:'build',job_type:'lesson_autopilot:a:media',status:'completed'},
 ];
 assert.equal(latestRoleJobs(rows).get('build|lesson_autopilot:a:media'),undefined);
});
test('a newer completed producer is selectable only after the old failed generation',()=>{
 const rows=[
  {id:'old',build_id:'build',job_type:'lesson_autopilot:a:media',status:'failed',created_at:'2026-11-01T00:00:00Z',execution_generation:1},
  {id:'new',build_id:'build',job_type:'lesson_autopilot:a:media',status:'completed',created_at:'2026-11-02T00:00:00Z',execution_generation:2},
 ];
 assert.equal(latestRoleJobs(rows).get('build|lesson_autopilot:a:media').id,'new');
});
