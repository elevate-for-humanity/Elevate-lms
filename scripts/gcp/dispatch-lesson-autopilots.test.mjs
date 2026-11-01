import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchLessonAutopilots} from './dispatch-lesson-autopilots.mjs';
import {lessonRoleDefinition,LESSON_ROLE_JOBS} from './deploy-lesson-autopilots.mjs';
const now=new Date('2026-10-27T18:00:00Z'),Gi=2**30;
const source={spec:{template:{spec:{taskCount:1,parallelism:1,template:{spec:{serviceAccountName:'elevate-worker-runtime@elegant-racer-299721.iam.gserviceaccount.com',maxRetries:0,
 containers:[{image:'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:'+'a'.repeat(64),resources:{limits:{cpu:'4',memory:'8Gi'}},env:[]}]}}}}}};
const waiting=(role,id='job-'+role)=>({id,status:'queued',available_at:'2026-10-27T17:59:00Z',attempts:0,max_attempts:5,execution_generation:0,payload:{autopilot:{role}},build:{status:'running',owner_paused:false}});
function fixture(rows){
 const calls=[],trace=[],active=new Map(),history=[],controls={};
 const records=new Map(rows.map(row=>[row.id,structuredClone(row)]));
 const templates=new Map(Object.entries(LESSON_ROLE_JOBS).map(([role,c])=>[c.name,lessonRoleDefinition(source,role)]));
 const options={now,clock:()=>now.getTime()+2000,assignmentAttempts:1,delay:async()=>{},env:{SUPABASE_SERVICE_ROLE_KEY:'fixture'},
  run:args=>{
   calls.push(args);
   if(args[2]==='execute'){
    const role=Object.keys(LESSON_ROLE_JOBS).find(role=>LESSON_ROLE_JOBS[role].name===args[3]);
    const prefix=args.find(arg=>arg.startsWith('--update-env-vars=ULTIMATE_WORKER_ID=')).slice('--update-env-vars=ULTIMATE_WORKER_ID='.length);
    trace.push('launch:'+role);active.set(args[3],[...(active.get(args[3])??[]),{status:{}}]);
    if(controls.noClaim)return '';
    let available=[...records.values()].filter(row=>row.status==='queued'&&row.payload.autopilot.role===role);
    if(controls.reverse)available=available.reverse();
    const row=available[0];assert.ok(row,'paid task must have a distinct queued job');
    const generation=row.execution_generation+(controls.generationAdvance??1),worker=prefix+'-worker';
    Object.assign(row,{execution_generation:generation,status:controls.statusFor?.(row)??controls.quickStatus??'running',
     heartbeat_at:'2026-10-27T18:00:01Z',lease_owner:controls.alienOwner?'another-worker':worker,lease_expires_at:'2026-10-27T18:05:00Z'});
    if(row.status!=='running')Object.assign(row,{lease_owner:null,lease_expires_at:null});
    history.push({job_id:row.id,execution_generation:generation,worker_id:worker,event_time:'2026-10-27T18:00:01Z'});
    return '';
   }
   if(args[2]==='describe')return JSON.stringify(args[3]==='elevate-course-builder-parallel'?source:templates.get(args[3]));
   if(args[2]==='executions')return JSON.stringify(active.get(args.find(a=>a.startsWith('--job=')).slice(6))??[]);
   throw Error('unexpected command');
  },
  request:async (url,init)=>{
   if(url.pathname.endsWith('/rpc/ultimate_autopilot_job_ready')){
    const id=JSON.parse(init.body).p_job;
    return {ok:true,json:async()=>!controls.notReady?.includes(id)};
   }
   if(url.pathname.endsWith('/ultimate_job_attempt_history')){
    trace.push('history');
    if(controls.historyUnavailable)return {ok:false,status:503};
    return {ok:true,json:async()=>controls.unrelatedHistory?history.map(h=>({...h,worker_id:'not-this-launch-worker'})):history};
   }
   if(url.searchParams.has('id')){
    const ids=url.searchParams.get('id').slice(4,-1).split(',');
    return {ok:true,json:async()=>ids.map(id=>records.get(id)).filter(Boolean)};
   }
   return {ok:true,json:async()=>structuredClone(rows)};
  },
  capacityCheck:async({task})=>{
   let cpu=0,memory=0;
   for(const [name,executions] of active){
    const limits=templates.get(name).spec.template.spec.template.spec.containers[0].resources.limits;
    cpu+=Number(limits.cpu)*1000*executions.length;memory+=Number(limits.memory.replace('Gi',''))*Gi*executions.length;
   }
   const limits=task.containers[0].resources.limits;
   return {fits:true,required:{cpu:cpu+Number(limits.cpu)*1000,memory:memory+Number(limits.memory.replace('Gi',''))*Gi},granted:{cpu:256000,memory:512*Gi}};
  },
 };
 return {options,calls,trace,active,templates,records,history,controls};
}
const launches=s=>s.calls.filter(args=>args[2]==='execute');

test('multiple lessons receive a worker each before waiting for any assignment',async()=>{
 const rows=Object.entries({instruction:8,media:6,quality:3}).flatMap(([role,count])=>Array.from({length:count},(_,i)=>waiting(role,role+'-'+i)));
 const s=fixture(rows),result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.status,'assigned');assert.equal(result.assignments.length,17);
 assert.equal(new Set(result.assignments.map(a=>a.jobId)).size,17);
 for(const [role,count] of Object.entries({instruction:8,media:6,quality:3}))assert.equal(result.assignments.filter(a=>a.role===role).length,count);
 assert.equal(s.trace.indexOf('history'),17,'all admitted workers start before polling their independent claims');
 assert.equal(new Set(launches(s).map(args=>args.find(a=>a.startsWith('--update-env-vars=')))).size,17);
});

test('an existing same-role worker does not prevent other lessons receiving workers',async()=>{
 const live={...waiting('media','live'),status:'running',heartbeat_at:'2026-10-27T17:59:00Z',lease_expires_at:'2026-10-27T18:05:00Z',lease_owner:'existing-worker'};
 const s=fixture([live,...Array.from({length:4},(_,i)=>waiting('media','next-'+i))]);
 s.active.set(LESSON_ROLE_JOBS.media.name,[{status:{}}]);
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.assignments.length,4);assert.ok(result.assignments.every(a=>a.role==='media'));
 assert.equal(s.records.get('live').lease_owner,'existing-worker');
});

test('a booting existing execution reserves the last queued job',async()=>{
 const s=fixture([waiting('media')]);s.active.set(LESSON_ROLE_JOBS.media.name,[{status:{}}]);
 assert.equal((await dispatchLessonAutopilots(s.options)).status,'busy');assert.equal(launches(s).length,0);
});

test('stale cloud inventory cannot spend acknowledged launch capacity twice',async()=>{
 const s=fixture(Array.from({length:5},(_,i)=>waiting('media','media-'+i)));
 s.options.capacityCheck=async()=>({fits:true,required:{cpu:4000,memory:8*Gi},granted:{cpu:8000,memory:16*Gi}});
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.status,'busy');assert.equal(result.reason,'active_worker_coverage_pending');
 assert.equal(result.assignments.length,2);assert.equal(result.runnableJobs,5);assert.equal(result.coveredJobs,2);assert.equal(result.uncoveredJobs,3);
 assert.equal(launches(s).length,2);
});

test('the capacity reservation includes launches from different role pools',async()=>{
 const s=fixture(['quality','media','instruction'].flatMap(role=>Array.from({length:4},(_,i)=>waiting(role,role+'-'+i))));
 s.options.capacityCheck=async({task})=>({fits:true,required:{cpu:Number(task.containers[0].resources.limits.cpu)*1000,memory:Number(task.containers[0].resources.limits.memory.replace('Gi',''))*Gi},granted:{cpu:10000,memory:16*Gi}});
 const result=await dispatchLessonAutopilots(s.options);
 // Two 6-Gi quality workers leave room for two 2-Gi instruction workers;
 // no 8-Gi renderer can reuse the same remaining four GiB.
 assert.deepEqual(result.assignments.map(a=>a.role),['quality','quality','instruction','instruction']);
});

test('a worker can claim a different queue position without borrowing another execution heartbeat',async()=>{
 const s=fixture([waiting('media','earlier'),waiting('media','later')]);s.controls.reverse=true;
 const result=await dispatchLessonAutopilots(s.options);
 assert.deepEqual(new Set(result.assignments.map(a=>a.jobId)),new Set(['earlier','later']));
 assert.equal(new Set(s.history.map(h=>h.worker_id)).size,2);
});

test('an empty queue and future prerequisite never launch work',async()=>{
 const s=fixture([]);assert.equal((await dispatchLessonAutopilots(s.options)).status,'empty');assert.equal(s.calls.length,0);
 const future=fixture([{...waiting('media'),available_at:'2026-10-27T18:03:00Z'}]);
 assert.equal((await dispatchLessonAutopilots(future.options)).status,'retry_wait');assert.equal(launches(future).length,0);
});

test('a leased worker with no eligible successor keeps coordination alive',async()=>{
 const s=fixture([{...waiting('media'),status:'running',lease_expires_at:'2026-10-27T18:05:00Z'}]);
 s.active.set(LESSON_ROLE_JOBS.media.name,[{status:{}}]);
 assert.equal((await dispatchLessonAutopilots(s.options)).status,'busy');assert.equal(launches(s).length,0);
});

for(const control of ['noClaim','unrelatedHistory','alienOwner'])test('launch needs its own live durable claim: '+control,async()=>{
 const s=fixture([waiting('instruction')]);s.controls[control]=true;
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.status,'busy');assert.equal(result.reason,'awaiting_worker_assignment');
 assert.equal(result.unconfirmedExecutions,1);assert.equal(result.assignments.length,0);
});

test('quick cached completion is proved by this execution claim history and new generation',async()=>{
 const s=fixture([waiting('instruction')]);s.controls.quickStatus='completed';
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.status,'assigned');assert.equal(result.assignments[0].state,'completed');
});

test('stale generation and unavailable claim history cannot prove assignment',async()=>{
 const s=fixture([waiting('instruction')]);s.controls.generationAdvance=0;
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.status,'busy');assert.equal(result.reason,'awaiting_worker_assignment');
 assert.equal(result.unconfirmedExecutions,1);assert.equal(result.assignments.length,0);
 const unavailable=fixture([waiting('instruction')]);unavailable.controls.historyUnavailable=true;
 await assert.rejects(dispatchLessonAutopilots(unavailable.options),/CLAIM_HISTORY_HTTP_503/);
});

test('a failed claimed lesson does not prevent launching and verifying other lessons',async()=>{
 const s=fixture([waiting('media','broken'),waiting('media','good'),waiting('instruction')]);
 s.controls.statusFor=row=>row.id==='broken'?'failed':'running';
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.assignments.length,3);assert.equal(result.assignments.filter(a=>a.state==='running').length,2);
});

test('configured concurrency admits bounded work and reports the remaining coverage',async()=>{
 const s=fixture(Array.from({length:7},(_,i)=>waiting('instruction','lesson-'+i)));
 s.options.env.COURSE_AUTOPILOT_INSTRUCTION_CONCURRENCY='6';
 const partial=await dispatchLessonAutopilots(s.options);
 assert.equal(partial.status,'busy');assert.equal(partial.reason,'active_worker_coverage_pending');
 assert.equal(partial.assignments.length,6);assert.equal(launches(s).length,6);
 assert.equal(partial.runnableJobs,7);assert.equal(partial.coveredJobs,6);assert.equal(partial.uncoveredJobs,1);
 const full=fixture(Array.from({length:7},(_,i)=>waiting('instruction','lesson-'+i)));
 full.options.env.COURSE_AUTOPILOT_INSTRUCTION_CONCURRENCY='8';
 assert.equal((await dispatchLessonAutopilots(full.options)).assignments.length,7);
 const invalid=fixture([waiting('media')]);invalid.options.env.COURSE_AUTOPILOT_MEDIA_CONCURRENCY='-1';
 await assert.rejects(dispatchLessonAutopilots(invalid.options),/CONCURRENCY_INVALID/);
});

test('capacity and immutable-image checks remain mandatory for every worker',async()=>{
 const s=fixture([waiting('media')]);s.options.capacityCheck=async()=>({fits:false});
 assert.equal((await dispatchLessonAutopilots(s.options)).status,'capacity_wait');assert.equal(launches(s).length,0);
 s.templates.get(LESSON_ROLE_JOBS.media.name).spec.template.spec.template.spec.containers[0].image='old-image';
 await assert.rejects(dispatchLessonAutopilots(s.options),/APPROVED_TEMPLATE_REQUIRED/);
 const missing=fixture([waiting('instruction')]);missing.options.capacityCheck=async()=>({fits:true});
 await assert.rejects(dispatchLessonAutopilots(missing.options),/CAPACITY_READBACK_REQUIRED/);assert.equal(launches(missing).length,0);
});

 test('forty ready lessons each receive a worker without the former media ceiling',async()=>{
 const s=fixture(Array.from({length:40},(_,i)=>waiting('media','lesson-'+i)));
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.assignments.length,40);assert.equal(new Set(result.assignments.map(a=>a.jobId)).size,40);
 });
 test('prerequisite waits do not launch paid executions',async()=>{
 const s=fixture([waiting('media','waiting'),waiting('instruction','ready')]);s.controls.notReady=['waiting'];
 const result=await dispatchLessonAutopilots(s.options);
 assert.deepEqual(result.assignments.map(a=>a.jobId),['ready']);
 });

test('slow startup uses bounded claim polling and rechecks never launch duplicate workers',async()=>{
 const s=fixture([waiting('media')]);s.controls.noClaim=true;
 delete s.options.assignmentAttempts;
 const waits=[];
 s.options.delay=async(ms)=>{waits.push(ms);};
 const first=await dispatchLessonAutopilots(s.options);
 assert.equal(first.reason,'awaiting_worker_assignment');assert.equal(first.assignments.length,0);
 assert.deepEqual(waits,[5000,5000]);
 const next=await dispatchLessonAutopilots(s.options);
 assert.equal(next.status,'busy');assert.equal(launches(s).length,1);
});


test('archived and published builds cannot consume a worker execution',async()=>{
 const rows=[{...waiting('media','archived'),build:{status:'archived',owner_paused:false}},
  {...waiting('media','published'),build:{status:'published',owner_paused:false}}];
 const s=fixture(rows);
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.status,'empty');
 assert.equal(launches(s).length,0);
});


test('Cloud Run numeric string readback is accepted without relaxing image or role checks',async()=>{
 const s=fixture([waiting('instruction')]);
 const template=s.templates.get(LESSON_ROLE_JOBS.instruction.name).spec.template.spec;
 template.parallelism='1';template.taskCount='1';
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.status,'assigned');
 assert.equal(result.assignments.length,1);
});
