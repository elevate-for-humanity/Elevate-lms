import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchQueuedCourseJob } from './dispatch-course-job.mjs';

function setup(executions, queued, httpStatus=200) {
  const calls=[];
  const run=(_command,args)=>{calls.push(args); return JSON.stringify(args[2] === 'describe' ? {spec:{template:{spec:{parallelism:2,template:{spec:{containers:[{resources:{limits:{cpu:'8',memory:'32Gi'}}}]}}}}}} : executions);};
  const request=async url=>({ok:httpStatus===200,status:httpStatus,json:async()=>url.searchParams.has('id') ? [{id:'queued',status:'running',lease_owner:'worker-test',lease_expires_at:'2026-10-06T10:05:00Z',heartbeat_at:'2026-10-06T10:00:01Z'}] : queued});
  return {calls,options:{run,request,capacityCheck:async()=>({fits:true}),env:{SUPABASE_SERVICE_ROLE_KEY:'test-fixture'},now:new Date('2026-10-06T10:00:00Z'),clock:()=>Date.parse('2026-10-06T10:00:02Z')}};
}
test('active worker allows another execution when a worker slot remains',async()=>{
  const s=setup([{status:{}}],[{id:'queued'}]);
  assert.equal((await dispatchQueuedCourseJob(s.options)).status,'assigned');
  assert.ok(s.calls.some(c=>c.includes('execute')));
});
test('empty queue does not start a paid execution',async()=>{
  const s=setup([],[]);
  assert.equal((await dispatchQueuedCourseJob(s.options)).status,'empty');
  assert.equal(s.calls.length,1);
});

test('imminent queued retry keeps coordination alive without an early paid execution',async()=>{
 const s=setup([],[{id:'retry',status:'queued',available_at:'2026-10-06T10:01:30Z',attempts:4,max_attempts:7}]);
 const base=s.options.request;
 s.options.request=async url=>{
  assert.match(url.searchParams.get('or'),/available_at.lte.2026-10-06T10:05:00.000Z/);
  return base(url);
 };
 const result=await dispatchQueuedCourseJob(s.options);
 assert.equal(result.status,'retry_wait');
 assert.equal(result.availableAt,'2026-10-06T10:01:30.000Z');
 assert.equal(s.calls.some(args=>args.includes('execute')),false);
});

test('due work dispatches while future retries cannot join the paid batch',async()=>{
 const s=setup([],[{id:'future',available_at:'2026-10-06T10:01:30Z'},{id:'queued',available_at:'2026-10-06T09:59:59Z'}]);
 const result=await dispatchQueuedCourseJob(s.options);
 assert.deepEqual(result.jobIds,['queued']);
 assert.ok(s.calls.some(args=>args.includes('--tasks=1')));
});

test('exhausted or storage-blocked future retries cannot keep coordination alive',async()=>{
 const s=setup([],[{id:'exhausted',available_at:'2026-10-06T10:01:30Z',attempts:7,max_attempts:7},{id:'storage',available_at:'2026-10-06T10:01:30Z',last_error:'COURSE_OBJECT_STORAGE_UPLOAD_FAILED'}]);
 assert.equal((await dispatchQueuedCourseJob(s.options)).status,'empty');
 assert.equal(s.calls.some(args=>args.includes('execute')),false);
});
test('a leased execution does not keep an empty-queue coordinator running',async()=>{
  const s=setup([{status:{}}],[]);
  const result=await dispatchQueuedCourseJob(s.options);
  assert.equal(result.status,'empty');
  assert.equal(result.activeExecutions,1);
  assert.equal(s.calls.some(c=>c.includes('execute')),false);
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

test('two eligible builds request two parallel Google Cloud Run worker tasks',async()=>{
 const s=setup([],[{id:'queued',attempts:0,max_attempts:5},{id:'queued-2',attempts:0,max_attempts:5}]);
 s.options.request=async url=>({ok:true,status:200,json:async()=>url.searchParams.has('id') ? [{id:'queued',status:'running',lease_owner:'worker-a',lease_expires_at:'2026-10-06T10:05:00Z',heartbeat_at:'2026-10-06T10:00:01Z'},{id:'queued-2',status:'running',lease_owner:'worker-b',lease_expires_at:'2026-10-06T10:05:00Z',heartbeat_at:'2026-10-06T10:00:01Z'}] : [{id:'queued',attempts:0,max_attempts:5},{id:'queued-2',attempts:0,max_attempts:5}]});
 const result=await dispatchQueuedCourseJob(s.options);
 assert.equal(result.tasks,2);
 assert.ok(s.calls[2].includes('--tasks=2'));
 assert.equal(s.calls[2].some(arg=>arg.startsWith('--parallelism=')),false);
});

test('a multi-worker batch checks all requested RAM and reduces to the capacity that fits', async()=>{
 const s=setup([],[{id:'queued'},{id:'queued-2'}]);
 const checked=[];
 s.options.capacityCheck=async({taskCount})=>{checked.push(taskCount);return {fits:taskCount===1};};
 const result=await dispatchQueuedCourseJob(s.options);
 assert.deepEqual(checked,[2,1]);
 assert.equal(result.tasks,1);
 assert.ok(s.calls[2].includes('--tasks=1'));
});

test('missing existing job parallelism cannot launch an unbounded batch', async()=>{
 const s=setup([],[{id:'queued'}]);
 const previous=s.options.run;
 s.options.run=(command,args)=>{
  const raw=previous(command,args);
  if(args[2]!=='describe')return raw;
  const job=JSON.parse(raw);delete job.spec.template.spec.parallelism;return JSON.stringify(job);
 };
 await assert.rejects(dispatchQueuedCourseJob(s.options),/PARALLELISM_UNAVAILABLE/);
 assert.equal(s.calls.some(args=>args.includes('execute')),false);
});

// An execution with completed tasks should consume only the slots still able to run.
test('completed tasks release dispatcher slots without exceeding configured parallelism',async()=>{
 const s=setup([{spec:{taskCount:2,parallelism:2},status:{succeededCount:1}}],[{id:'queued'}]);
 s.options.env.COURSE_WORKER_PARALLELISM='2';
 assert.equal((await dispatchQueuedCourseJob(s.options)).status,'assigned');
 assert.ok(s.calls.some(args=>args.includes('--tasks=1')));
});

test('unavailable execution allocation fails closed before launching a worker',async()=>{
 const s=setup([{spec:{taskCount:2,parallelism:2},status:{succeededCount:3}}],[{id:'queued'}]);
 await assert.rejects(dispatchQueuedCourseJob(s.options),/allocation is unavailable/);
 assert.equal(s.calls.some(args=>args.includes('execute')),false);
});

test('a fresh heartbeat with an expired lease is not a confirmed assignment',async()=>{
 const s=setup([],[{id:'queued'}]);
 s.options.assignmentAttempts=1;
 s.options.request=async url=>({ok:true,json:async()=>url.searchParams.has('id')
  ? [{id:'queued',status:'running',lease_owner:'old-worker',heartbeat_at:'2026-10-06T10:00:01Z',lease_expires_at:'2026-10-06T09:59:00Z'}]
  : [{id:'queued'}]});
 await assert.rejects(dispatchQueuedCourseJob(s.options),/COURSE_WORKER_ASSIGNMENT_TIMEOUT/);
});


test('owner-paused course builds never launch a paid worker execution',async()=>{
 const s=setup([],[{id:'paused',attempts:1,max_attempts:7,build:{owner_paused:'true'}}]);
 const base=s.options.request;
 s.options.request=async url=>{
  assert.match(url.searchParams.get('select'),/build:ultimate_course_builds!inner/);
  return base(url);
 };
 const result=await dispatchQueuedCourseJob(s.options);
 assert.equal(result.status,'empty');
 assert.equal(s.calls.length,1);
 assert.equal(s.calls.some(args=>args.includes('execute')),false);
});

test('unpaused builds still dispatch while owner-paused builds are excluded',async()=>{
 const s=setup([],[{id:'paused',attempts:0,max_attempts:7,build:{owner_paused:true}},{id:'queued',attempts:0,max_attempts:7,build:{owner_paused:'false'}}]);
 const result=await dispatchQueuedCourseJob(s.options);
 assert.equal(result.status,'assigned');
 assert.deepEqual(result.jobIds,['queued']);
 assert.ok(s.calls.some(args=>args.includes('--tasks=1')));
});


test('paused builds are excluded by the database before the 50-row queue limit', async()=>{
 const paused=Array.from({length:50},(_,i)=>({id:'paused-'+i,build:{owner_paused:'true'}}));
 const s=setup([],[...paused,{id:'queued',build:{owner_paused:null}}]);
 const base=s.options.request;
 s.options.request=async url=>{
  if(url.searchParams.has('id')) return base(url);
  assert.equal(url.searchParams.get('build.or'),'(profile->>ownerPaused.is.null,profile->>ownerPaused.neq.true)');
  // Model PostgREST applying the embedded filter before the top-level limit.
  return {ok:true,json:async()=>[...paused,{id:'queued',build:{owner_paused:null}}]
   .filter(job=>job.build.owner_paused!=='true').slice(0,Number(url.searchParams.get('limit')))};
 };
 const result=await dispatchQueuedCourseJob(s.options);
 assert.deepEqual(result.jobIds,['queued']);
 assert.ok(s.calls.some(args=>args.includes('--tasks=1')));
});

test('a full page of storage-blocked jobs cannot hide runnable work',async()=>{
 const s=setup([],[]);const offsets=[];
 s.options.request=async url=>{
  if(url.searchParams.has('id'))return {ok:true,json:async()=>[{id:'queued',status:'running',lease_owner:'worker',lease_expires_at:'2026-10-06T10:05:00Z',heartbeat_at:'2026-10-06T10:00:01Z'}]};
  const offset=Number(url.searchParams.get('offset'));offsets.push(offset);
  return {ok:true,json:async()=>offset===0?Array.from({length:50},(_,i)=>({id:'blocked-'+i,last_error:'COURSE_OBJECT_STORAGE_UPLOAD_FAILED'})):[{id:'queued'}]};
 };
 const result=await dispatchQueuedCourseJob(s.options);
 assert.deepEqual(offsets,[0,50]);assert.equal(result.status,'assigned');assert.deepEqual(result.jobIds,['queued']);
});

test('a cached completion between polls proves its new claim generation',async()=>{
 const s=setup([],[{id:'queued',execution_generation:4}]);const base=s.options.request;
 s.options.assignmentAttempts=1;
 s.options.request=async url=>url.searchParams.has('id')?{ok:true,json:async()=>[{id:'queued',status:'completed',heartbeat_at:'2026-10-06T10:00:01Z',execution_generation:5}]}:base(url);
 assert.equal((await dispatchQueuedCourseJob(s.options)).status,'assigned');
});
for(const graphExists of [true,false])test('a fast parked pool coordinator requires a real graph: '+graphExists,async()=>{
 const s=setup([],[{id:'queued',execution_generation:4}]);const base=s.options.request;s.options.assignmentAttempts=1;
 s.options.request=async url=>{
  if(url.pathname.endsWith('/ultimate_autopilot_pools')){
   assert.equal(url.searchParams.get('coordinator_job_id'),'eq.queued');
   return {ok:true,json:async()=>graphExists?[{id:'real-pool',state:'active'}]:[]};
  }
  if(url.searchParams.has('id'))return {ok:true,json:async()=>[{id:'queued',status:'queued',available_at:'infinity',heartbeat_at:'2026-10-06T10:00:01Z',execution_generation:5}]};
  return base(url);
 };
 if(graphExists)assert.equal((await dispatchQueuedCourseJob(s.options)).status,'assigned');
 else await assert.rejects(dispatchQueuedCourseJob(s.options),/COURSE_WORKER_ASSIGNMENT_TIMEOUT/);
});
for(const generation of [4,undefined])test('a stale or missing generation cannot impersonate a fast completed claim: '+generation,async()=>{
 const s=setup([],[{id:'queued',execution_generation:4}]);const base=s.options.request;s.options.assignmentAttempts=1;
 s.options.request=async url=>url.searchParams.has('id')?{ok:true,json:async()=>[{id:'queued',status:'completed',heartbeat_at:'2026-10-06T10:00:01Z',execution_generation:generation}]}:base(url);
 await assert.rejects(dispatchQueuedCourseJob(s.options),/COURSE_WORKER_ASSIGNMENT_TIMEOUT/);
});
