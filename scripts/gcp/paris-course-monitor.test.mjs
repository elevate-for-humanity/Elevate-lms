import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectCourseAutopilot,inspectOrphanedPool} from '../../lib/ultimate-course-builder/worker/paris-monitor.mjs';
import {monitorCourseQueue,latestRoleJobs,requestParisRepairReceipt} from './paris-course-monitor.mjs';
const now=new Date('2026-10-14T18:00:00Z');
test('source revision failures require reconciliation even when a PARIS repair receipt exists',()=>{
 const blocked=inspectCourseAutopilot({status:'failed',last_error:'ULTIMATE_AUTOPILOT_SOURCE_REVISION_REQUIRED',
  monitor:{enabled:true,repairId:'saved-repair'}},{status:'running',profile:{ownerPaused:false}},now.getTime());
 assert.equal(blocked.state,'source_revision_blocked');
 assert.equal(blocked.action,'needs_source_reconciliation');
 assert.match(blocked.reason,/provenance and approval/);
 assert.notEqual(blocked.state,'repairing');
});
test('queue timestamps never assert stage readiness without canonical RPC',()=>{
 const observation=inspectCourseAutopilot({
  status:'queued',available_at:'2026-10-14T17:00:00Z',
  monitor:{enabled:true},attempts:0,max_attempts:5,
  payload:{autopilot:{role:'quality'}}
 },{status:'running',findings:[{message:'COURSE_OBJECT_STORAGE_UPLOAD_FAILED'}]},now.getTime());
 assert.equal(observation.state,'awaiting_assignment');
 // PARIS only labels this runnable after the separate canonical readiness RPC.
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
test('an incomplete predecessor stage requeues the role within its retry budget',()=>{
 // A media/quality role that stopped on ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE
 // deadlocked the pool: it can never become claimable until the stage passes.
 const observation=inspectCourseAutopilot(job({status:'failed',
   last_error:'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization'}),{},+now);
 assert.equal(observation.state,'recovering');
 assert.equal(observation.action,'requeue');
 // The retry budget and recovery cap still bound it; it is never unbounded.
 assert.equal(inspectCourseAutopilot(job({status:'failed',attempts:5,
   last_error:'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization'}),{},+now).action,'none');
 assert.equal(inspectCourseAutopilot(job({status:'failed',monitor:{enabled:true,recoveries:3},
   last_error:'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization'}),{},+now).action,'none');
});
test('a stale repair receipt cannot park work that a plain re-run can recover',()=>{
 // Production deadlock: jobs carried BOTH a saved repairId and a resumable
 // failure. The repair receipt was checked first, so PARIS reported
 // repair_requested/observe forever and the queue never drained.
 for(const last_error of [
   'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization',
   'fetch failed',
 ]) {
  const observation=inspectCourseAutopilot(job({status:'failed',last_error,
    monitor:{enabled:true,repairId:'stale-repair'}}),{},+now);
  assert.equal(observation.state,'recovering');
  assert.equal(observation.action,'requeue');
 }
 // A producer that re-ran unchanged is resumable: the checkpoint loader now
 // reconstructs the saved caption/visibility diagnosis from the failing-step
 // findings, so a receipt must not park it either.
 const resumable=inspectCourseAutopilot(job({status:'failed',
   last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:REPAIR_PRODUCER_UNCHANGED',
   monitor:{enabled:true,repairId:'verified-repair'}}),{},+now);
 assert.equal(resumable.state,'recovering');
 assert.equal(resumable.action,'requeue');
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
const monitorEnv={GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'};
test('transient queue read retries the same cursor without duplicate observations or writes',async()=>{
 const reads=[],signals=[],written=[],waits=[];
 const rows=Array.from({length:100},(_,i)=>job({id:String(i).padStart(3,'0')}));
 let failed=false;
 const result=await monitorCourseQueue({env:monitorEnv,now,wait:async ms=>waits.push(ms),
  request:async(url,options)=>{
   if(options.method==='PATCH'){
    written.push(new URL(url).searchParams.get('id'));
    return {ok:true,json:async()=>[{id:'saved'}]};
   }
   const cursor=new URL(url).searchParams.get('id');reads.push(cursor);signals.push(options.signal);
   if(cursor && !failed){failed=true;throw new DOMException('timed out','TimeoutError');}
   return {ok:true,json:async()=>cursor?[job({id:'100'})]:rows};
  }});
 assert.deepEqual(reads,[null,'gt.099','gt.099']);
 assert.notEqual(signals[1],signals[2]);assert.equal(signals[2].aborted,false);
 assert.deepEqual(waits,[2000]);assert.equal(result.length,101);
 assert.equal(new Set(result.map(row=>row.jobId)).size,101);
 assert.equal(written.length,101);assert.equal(new Set(written).size,101);
});
test('readiness transport and body-read failures retry only the same pure verdict',async()=>{
 const row=job({payload:{autopilot:{role:'media'}},available_at:now.toISOString()});
 const bodies=[],signals=[],waits=[];let writes=0;
 const result=await monitorCourseQueue({env:monitorEnv,now,wait:async ms=>waits.push(ms),
  request:async(url,options)=>{
   if(String(url).includes('/rpc/ultimate_autopilot_ready_jobs')){
    bodies.push(options.body);signals.push(options.signal);
    if(bodies.length===1)throw new TypeError('fetch failed',{cause:{code:'ECONNRESET'}});
    if(bodies.length===2)return {ok:true,json:async()=>{throw new DOMException('body timed out','TimeoutError');}};
    return {ok:true,json:async()=>['job']};
   }
   if(options.method==='PATCH'){writes++;return {ok:true,json:async()=>[{id:'job'}]};}
   return {ok:true,json:async()=>[row]};
  }});
 assert.equal(bodies.length,3);assert.equal(new Set(bodies).size,1);
 assert.deepEqual(JSON.parse(bodies[0]),{p_jobs:['job']});
 assert.equal(new Set(signals).size,3);assert.deepEqual(waits,[2000,4000]);
 assert.equal(writes,1);assert.equal(result[0].state,'awaiting_assignment');
});
test('exhausted transient queue reads preserve the terminal error and never write',async()=>{
 const errors=Array.from({length:3},()=>new DOMException('timed out','TimeoutError'));
 let reads=0;const waits=[];
 await assert.rejects(monitorCourseQueue({env:monitorEnv,now,wait:async ms=>waits.push(ms),
  request:async(_url,options)=>{
   assert.equal(options.method,undefined);
   throw errors[reads++];
  }}),error=>error===errors[2]);
 assert.equal(reads,3);assert.deepEqual(waits,[2000,4000]);
});
test('authorization and answered server failures do not replay monitor reads',async()=>{
 for(const status of [401,403,503])for(const readiness of [false,true]){
  let failedReads=0,writes=0;
  await assert.rejects(monitorCourseQueue({env:monitorEnv,now,
   wait:async()=>assert.fail('an HTTP answer must not retry'),
   request:async(url,options)=>{
    if(options.method==='PATCH'){writes++;assert.fail('a failed read cannot write');}
    if(!readiness||String(url).includes('/rpc/')){failedReads++;return {ok:false,status};}
    return {ok:true,json:async()=>[job({payload:{autopilot:{role:'media'}},available_at:now.toISOString()})]};
   }}),new RegExp((readiness?'PARIS_ROLE_READINESS_HTTP_':'PARIS_MONITOR_READ_HTTP_')+status));
  assert.equal(failedReads,1);assert.equal(writes,0);
 }
});
test('malformed monitor read bodies and explicit aborts are not retried',async()=>{
 for(const error of [new SyntaxError('invalid JSON'),new DOMException('cancelled','AbortError')]){
  let reads=0;
  await assert.rejects(monitorCourseQueue({env:monitorEnv,now,
   wait:async()=>assert.fail('permanent failures must not retry'),
   request:async()=>{reads++;return {ok:true,json:async()=>{throw error;}};}
  }),observed=>observed===error);
  assert.equal(reads,1);
 }
});
test('ambiguous monitor writes and write-body failures are never replayed',async()=>{
 for(const bodyFailure of [false,true]){
  let writes=0;
  const error=new DOMException('ambiguous write','TimeoutError');
  await assert.rejects(monitorCourseQueue({env:monitorEnv,now,
   wait:async()=>assert.fail('writes must not enter the read retry path'),
   request:async(_url,options)=>{
    if(options.method==='PATCH'){
     writes++;
     if(bodyFailure)return {ok:true,json:async()=>{throw error;}};
     throw error;
    }
    return {ok:true,json:async()=>[job()]};
   }}),observed=>observed===error);
  assert.equal(writes,1);
 }
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


test('PARIS never uses timestamp patches to wake an unready quality stage',async()=>{
 const quality={
  id:'quality',build_id:'build-1',job_type:'lesson_autopilot:lesson-a:quality',
  payload:{autopilot:{role:'quality',prerequisiteJobId:'media'}},
  attempts:0,max_attempts:5,execution_generation:3,
  monitor:{enabled:true},status:'queued',available_at:'2026-10-14T17:00:00Z',
  ultimate_course_builds:{status:'running',ownerPaused:false}
 };
 const writes=[];
 await monitorCourseQueue({env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},now,
  request:async(url,options={})=>{
   if(String(url).includes('/rpc/ultimate_autopilot_ready_jobs'))
    return {ok:true,json:async()=>[]};
   if(options.method==='PATCH'){
    writes.push(JSON.parse(options.body));return {ok:true,json:async()=>[{id:'quality'}]};
   }
   return {ok:true,json:async()=>[quality]};
  }});
 assert.equal(writes.length,1);
 assert.equal(writes[0].status,undefined);
 assert.equal(writes[0].available_at,undefined);
 assert.equal(writes[0].monitor.state,'prerequisite_wait');
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


test('finite-availability media remains prerequisite_wait until canonical readiness passes',async()=>{
 const base={id:'media-1',build_id:'build',job_type:'lesson_autopilot:a:media',
  payload:{autopilot:{role:'media',prerequisiteJobId:'instruction-1'}},
  status:'queued',available_at:'2026-10-14T17:00:00Z',execution_generation:0,
  attempts:0,max_attempts:5,monitor:{enabled:true},ultimate_course_builds:{status:'running',ownerPaused:false}};
 const check=async(allowed)=>{
  let written,readiness=0;
  const result=await monitorCourseQueue({
   env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'test'},
   now,request:async(url,options={})=>{
    if(String(url).includes('/rpc/ultimate_autopilot_ready_jobs')){
     readiness++;assert.deepEqual(JSON.parse(options.body),{p_jobs:['media-1']});
     return {ok:true,json:async()=>allowed?['media-1']:[]};
    }
    if(options.method==='PATCH'){written=JSON.parse(options.body);return {ok:true,json:async()=>[{id:'media-1'}]};}
    return {ok:true,json:async()=>[base]};
   }});
  assert.equal(readiness,1);assert.equal(result.length,1);return written.monitor;
 };
 const blocked=await check(false);
 assert.equal(blocked.state,'prerequisite_wait');
 assert.equal(blocked.action,'observe');
 assert.equal(blocked.recoveryRequest,null);
 const ready=await check(true);
 assert.equal(ready.state,'awaiting_assignment');
 assert.equal(ready.action,'dispatch');
});

test('cleared saved owner pause requeues only a canonically ready failed role',async()=>{
 const base={id:'saved-media',build_id:'build',job_type:'lesson_autopilot:a:media',
  payload:{autopilot:{role:'media',prerequisiteJobId:'producer'}},
  status:'failed',available_at:'2026-10-14T16:00:00Z',execution_generation:3,
  last_error:'OWNER_PAUSED_REFERENCE_BUILD',attempts:1,max_attempts:5,
  lease_owner:null,lease_expires_at:null,external_execution_id:null,
  monitor:{enabled:true},ultimate_course_builds:{status:'running',ownerPaused:false}};
 const run=async(ready,override={})=>{
  let written;
  await monitorCourseQueue({now,env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',
   SUPABASE_SERVICE_ROLE_KEY:'test'},request:async(url,options={})=>{
    if(String(url).includes('/rpc/ultimate_autopilot_ready_jobs'))
      return {ok:true,json:async()=>ready?['saved-media']:[]};
    if(options.method==='PATCH'){
      written=JSON.parse(options.body);
      return {ok:true,json:async()=>[{id:'saved-media'}]};
    }
    return {ok:true,json:async()=>[{...base,...override}]};
   }});
  return written;
 };
 const blocked=await run(false);
 assert.equal(blocked.status,undefined);
 assert.equal(blocked.monitor.action,'none');
 const recovered=await run(true);
 assert.equal(recovered.status,'queued');
 assert.equal(recovered.execution_generation,4);
 assert.equal(recovered.attempts,undefined);
 assert.equal(recovered.payload,undefined);
 const ownerPaused=await run(true,{ultimate_course_builds:{status:'running',ownerPaused:true}});
 assert.equal(ownerPaused.status,undefined);
});

test('publication approval stays blocked despite retry capacity and historical repair receipt',()=>{
 for(const monitor of [{enabled:true,repairId:'historical-paris-repair'},{enabled:true}]) {
  const recovered=inspectCourseAutopilot({
   status:'failed',last_error:'ULTIMATE_SOURCE_PUBLICATION_APPROVAL_REQUIRED',
   monitor,attempts:1,max_attempts:5
  },{status:'running',profile:{ownerPaused:false}},now.getTime());
  assert.equal(recovered.state,'attention_required');
  assert.equal(recovered.action,'none');
  assert.equal(recovered.reason,'ULTIMATE_SOURCE_PUBLICATION_APPROVAL_REQUIRED');
 }
 // A job that already exhausted its retry budget is still reported, not requeued.
 const exhausted=inspectCourseAutopilot({
  status:'failed',last_error:'ULTIMATE_SOURCE_PUBLICATION_APPROVAL_REQUIRED',
  monitor:{enabled:true},attempts:5,max_attempts:5
 },{status:'running',profile:{ownerPaused:false}},now.getTime());
 assert.equal(exhausted.state,'attention_required');
 assert.equal(exhausted.action,'none');
 // A producer that re-ran unchanged is resumable through the recovered
 // diagnosis, so PARIS requeues it instead of parking on the receipt.
 const codeRepair=inspectCourseAutopilot({
  status:'failed',last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:REPAIR_PRODUCER_UNCHANGED',
  monitor:{enabled:true,repairId:'verified-repair'},attempts:1,max_attempts:5
 },{status:'running',profile:{ownerPaused:false}},now.getTime());
 assert.equal(codeRepair.state,'recovering');
 assert.equal(codeRepair.action,'requeue');
});


test('failed autopilot stage waits for canonical predecessor without consuming retry budget',async()=>{
 const row=job({status:'failed',last_error:'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization',
  payload:{autopilot:{role:'quality'}},monitor:{enabled:true,recoveries:0}});
 let readyCalls=0;const changes=[];
 const result=await monitorCourseQueue({env:monitorEnv,now,request:async(url,options)=>{
  if(String(url).includes('/rpc/ultimate_autopilot_ready_jobs')){
   readyCalls++;assert.deepEqual(JSON.parse(options.body),{p_jobs:['job']});
   return {ok:true,json:async()=>[]};
  }
  if(options.method==='PATCH'){changes.push(JSON.parse(options.body));return {ok:true,json:async()=>[{id:'job'}]};}
  return {ok:true,json:async()=>[row]};
 }});
 assert.equal(readyCalls,1);
 assert.equal(changes.length,1);
 assert.equal(changes[0].status,undefined,'never requeue a missing prerequisite');
 assert.equal(changes[0].attempts,undefined);
 assert.equal(changes[0].execution_generation,undefined);
 assert.equal(changes[0].monitor.state,'prerequisite_wait');
 assert.equal(changes[0].monitor.action,'observe');
 assert.equal(result[0].saved,true);
});
test('failed autopilot stage requeues once canonical readiness is positively verified',async()=>{
 const row=job({status:'failed',last_error:'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization',
  payload:{autopilot:{role:'quality'}},monitor:{enabled:true,recoveries:0}});
 let changes;
 const result=await monitorCourseQueue({env:monitorEnv,now,request:async(url,options)=>{
  if(String(url).includes('/rpc/ultimate_autopilot_ready_jobs'))
   return {ok:true,json:async()=>['job']};
  if(options.method==='PATCH'){changes=JSON.parse(options.body);return {ok:true,json:async()=>[{id:'job'}]};}
  return {ok:true,json:async()=>[row]};
 }});
 assert.equal(changes.status,'queued');
 assert.equal(changes.attempts,undefined,'preserve attempt history');
 assert.equal(changes.execution_generation,3);
 assert.equal(result[0].action,'requeue');
});

test('a failed internal repair with no recorded receipt requests one instead of parking',()=>{
 const observation=inspectCourseAutopilot(job({status:'failed',attempts:2,
  last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson-a:FINDINGS=[{"step":"visual_assignment"}]'}),{},+now);
 assert.equal(observation.state,'repair_unrequested');
 assert.equal(observation.action,'request_repair');
 // Durable external blockers keep their own remedy and never auto-request.
 for(const last_error of [
  'ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson-a:FINDINGS=[{"code":"MEDIA_LICENSE_REQUIRED"}]',
  'ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson-a:FINDINGS=[{"code":"COURSE_OBJECT_STORAGE_UPLOAD_FAILED"}]',
  'ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson-a:OWNER_SOURCE_GAP',
 ]) {
  const blocked=inspectCourseAutopilot(job({status:'failed',attempts:2,last_error}),{},+now);
  assert.equal(blocked.action,'none',last_error);
 }
});

test('a deleted repair receipt is re-requested; a live one still parks as repair_requested',()=>{
 const base=job({status:'failed',attempts:2,monitor:{enabled:true,repairId:'gone',recoveries:3},
  last_error:'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization'});
 const missing=inspectCourseAutopilot({...base,repairReceiptMissing:true},{},+now);
 assert.equal(missing.state,'repair_receipt_missing');
 assert.equal(missing.action,'request_repair');
 const live=inspectCourseAutopilot(base,{},+now);
 assert.equal(live.state,'repair_requested');
 assert.equal(live.action,'observe');
 // A resumable failure still wins over a missing receipt.
 const resumable=inspectCourseAutopilot(job({status:'failed',attempts:1,
  monitor:{enabled:true,repairId:'gone',recoveries:0},repairReceiptMissing:true,
  last_error:'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization'}),{},+now);
 assert.equal(resumable.action,'requeue');
});

test('orphaned pools are detected only when active, failed and long without a worker',()=>{
 const pool={id:'pool',build_id:'build',state:'active',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'};
 const failed={id:'lesson-job',status:'failed',payload:{autopilot:{role:'media'}},heartbeat_at:'2026-10-02T00:00:00Z',updated_at:'2026-10-02T00:00:00Z'};
 const orphan=inspectOrphanedPool(pool,[failed],+now);
 assert.equal(orphan.state,'pool_orphaned');
 assert.deepEqual(orphan.failedJobIds,['lesson-job']);
 assert.match(orphan.reason,/cannot claim while this pool says active/);
 // Fresh activity, a live lease, no failures, or a finished pool are not orphans.
 assert.equal(inspectOrphanedPool(pool,[{...failed,heartbeat_at:'2026-10-14T17:59:00Z'}],+now),null);
 assert.equal(inspectOrphanedPool(pool,[{...failed,status:'running',lease_expires_at:'2026-10-14T19:00:00Z'}],+now),null);
 assert.equal(inspectOrphanedPool(pool,[{...failed,status:'completed'}],+now),null);
 assert.equal(inspectOrphanedPool({...pool,state:'completed'},[failed],+now),null);
});

test('monitor re-requests a repair whose receipt was deleted and records the new receipt',async()=>{
 const row=job({status:'failed',attempts:2,build_id:'build-1',
  payload:{autopilot:{role:'media'}},monitor:{enabled:true,repairId:'deleted-repair',recoveries:3},
  last_error:'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization',
  ultimate_course_builds:{status:'running',ownerPaused:false}});
 const patches=[],posts=[];
 const result=await monitorCourseQueue({env:monitorEnv,now,request:async(url,options={})=>{
  const value=String(url);
  if(options.method==='PATCH'){patches.push(JSON.parse(options.body));return {ok:true,json:async()=>[{id:'job'}]};}
  if(options.method==='POST'&&value.includes('paris_code_repairs')){posts.push(JSON.parse(options.body));return {ok:true,json:async()=>[]};}
  if(value.includes('paris_code_repairs')&&value.includes('fingerprint=eq.'))return {ok:true,json:async()=>[{id:'new-repair',status:'queued'}]};
  if(value.includes('paris_code_repairs'))return {ok:true,json:async()=>[]};
  if(value.includes('paris_autopilot_policy'))return {ok:true,json:async()=>[{enabled:true,actor_id:'paris-actor'}]};
  if(value.includes('ultimate_autopilot_pools'))return {ok:true,json:async()=>[]};
  if(value.includes('/rpc/'))return {ok:true,json:async()=>[]};
  return {ok:true,json:async()=>[row]};
 }});
 assert.equal(posts.length,1);
 assert.equal(posts[0].fingerprint,'course:job:quality');
 assert.equal(posts[0].source_job_id,'job');
 const monitorWrite=patches.find(body=>body.monitor?.repairId==='new-repair');
 assert.ok(monitorWrite,'the new receipt must be persisted on the job monitor');
 assert.equal(monitorWrite.monitor.state,'repair_receipt_missing');
 assert.equal(result.find(o=>o.jobId==='job')?.state,'repair_receipt_missing');
});

test('monitor names an orphaned pool on the coordinator job instead of awaiting assignment',async()=>{
 const coordinator={id:'coord',build_id:'build-1',job_type:'course_build',status:'queued',attempts:0,max_attempts:5,
  execution_generation:1,monitor:{enabled:true},heartbeat_at:null,updated_at:'2026-10-02T00:00:00Z',
  ultimate_course_builds:{status:'running',ownerPaused:false}};
 const lesson={id:'lesson-job',build_id:'build-1',job_type:'lesson_autopilot:lesson-a:media',status:'failed',attempts:2,max_attempts:5,
  execution_generation:40,monitor:{enabled:true,repairId:'live-repair'},heartbeat_at:'2026-10-02T00:00:00Z',updated_at:'2026-10-02T00:00:00Z',
  payload:{autopilot:{role:'media'}},last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson-a:FINDINGS=[]',
  ultimate_course_builds:{status:'running',ownerPaused:false}};
 const pool={id:'pool-1',build_id:'build-1',state:'active',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'};
 const patches=new Map();
 const result=await monitorCourseQueue({env:monitorEnv,now,request:async(url,options={})=>{
  const value=String(url);
  if(options.method==='PATCH'){
   const id=new URL(value).searchParams.get('id').slice(3);
   patches.set(id,JSON.parse(options.body));return {ok:true,json:async()=>[{id}]};
  }
  if(value.includes('paris_code_repairs'))return {ok:true,json:async()=>[{id:'live-repair'}]};
  if(value.includes('ultimate_autopilot_pools'))return {ok:true,json:async()=>[pool]};
  if(value.includes('/rpc/'))return {ok:true,json:async()=>[]};
  return {ok:true,json:async()=>[coordinator,lesson]};
 }});
 const coordObservation=result.find(o=>o.jobId==='coord');
 assert.equal(coordObservation.state,'pool_orphaned');
 assert.equal(patches.get('coord').monitor.state,'pool_orphaned');
 assert.deepEqual(patches.get('coord').monitor.failedJobIds,['lesson-job']);
});


test('repair receipt recovery ignores fingerprint conflicts and reads existing receipt without changing it',async()=>{
 const existing={id:'existing-repair',status:'blocked'};
 const calls=[];
 const request=async(url,options={})=>{
  const u=new URL(url);calls.push({url:u,method:options.method});
  if(u.pathname.endsWith('/paris_autopilot_policy'))return {ok:true,json:async()=>[{enabled:true,actor_id:'paris-actor'}]};
  if(options.method==='POST'){
   assert.equal(JSON.parse(options.body).fingerprint,'course:job:quality');
   assert.equal(options.headers.Prefer,'resolution=ignore-duplicates');
   // PostgREST defaults to the primary key unless on_conflict names the unique fingerprint.
   return u.searchParams.get('on_conflict')==='fingerprint'?{ok:true,status:201}:{ok:false,status:409};
  }
  assert.equal(u.searchParams.get('fingerprint'),'eq.course:job:quality');
  return {ok:true,json:async()=>[existing]};
 };
 assert.deepEqual(await requestParisRepairReceipt({request,headers:{},job:{id:'job',build_id:'build'}}),existing);
 assert.deepEqual(calls.map(c=>c.method),[undefined,'POST',undefined]);
});
