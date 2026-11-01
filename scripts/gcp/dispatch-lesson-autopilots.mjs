import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity,isTerminalExecution,allocation} from './regional-capacity.mjs';
import {LESSON_ROLE_JOBS,LESSON_ROLE_REGION} from './deploy-lesson-autopilots.mjs';
import {randomUUID} from 'node:crypto';

// One execution is required for every runnable lesson stage. A configured
// ceiling may raise that bound, but it cannot turn the active-worker contract
// back into queued placeholders.
function concurrency(role,env,demand){
 const value=env['COURSE_AUTOPILOT_'+role.toUpperCase()+'_CONCURRENCY'];
 if(value===undefined || value==='')return demand;
 const count=Number(value);
 if(!Number.isSafeInteger(count)||count<1)throw Error('ULTIMATE_AUTOPILOT_CONCURRENCY_INVALID:'+role);
 // A smaller configured ceiling is backpressure, not a fatal dispatcher error.
 // Admit available slots and report uncovered work for the next coordinated pass.
 return Math.min(count,demand);
}

// Cloud inventory can lag a just-acknowledged asynchronous launch. Retain its
// allocation locally until the next coordinated pass, even if a later inventory
// read has not included that execution yet. Never spend the same capacity twice.
function reserveCapacity(capacity,task,reserved){
 if(!capacity.fits)return null;
 const size=task.containers.reduce((sum,c)=>{
  const value=allocation(c.resources?.limits);return {cpu:sum.cpu+value.cpu,memory:sum.memory+value.memory};
 },{cpu:0,memory:0});
 const next={};
 for(const key of ['cpu','memory']){
  const required=capacity.required?.[key],granted=capacity.granted?.[key];
  if(!Number.isFinite(required)||required<0||!Number.isFinite(granted)||(granted<0&&granted!==-1))
   throw Error('ULTIMATE_AUTOPILOT_CAPACITY_READBACK_REQUIRED');
  next[key]=Math.max(required,reserved?reserved[key]+size[key]:required);
  if(granted!==-1&&next[key]>granted)return null;
 }
 return next;
}

/** All callers share the runtime-operation lane. Claims and prerequisites are
 * rechecked by Postgres; launch/readback is not counted as a completed lesson. */
export async function dispatchLessonAutopilots({run=google,request=fetch,env=process.env,now=new Date(),
 delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),assignmentAttempts=3,capacityCheck=inspectRegionalCapacity,clock=Date.now}={}){
 const token=env.SUPABASE_SERVICE_ROLE_KEY;if(!token)throw Error('SUPABASE_SERVICE_ROLE_KEY_REQUIRED');
 const headers={apikey:token,Authorization:'Bearer '+token};
 const root='https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs';
 const query=new URL(root);
 query.searchParams.set('select','id,status,available_at,heartbeat_at,lease_expires_at,execution_generation,attempts,max_attempts,last_error,payload,build:ultimate_course_builds!inner(owner_paused:profile->>ownerPaused)');
 query.searchParams.set('job_type','like.lesson_autopilot:*');
 query.searchParams.set('or','(and(status.eq.queued,available_at.lte.'+new Date(now.getTime()+300000).toISOString()+'),status.eq.running)');
 query.searchParams.set('build.or','(profile->>ownerPaused.is.null,profile->>ownerPaused.neq.true)');
 query.searchParams.set('order','priority.asc,available_at.asc,created_at.asc,id.asc');query.searchParams.set('limit','1000');
 const response=await request(query,{headers,signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('ULTIMATE_AUTOPILOT_QUEUE_HTTP_'+response.status);
 const rows=await response.json();if(!Array.isArray(rows))throw Error('ULTIMATE_AUTOPILOT_QUEUE_INVALID');
 const eligible=rows.filter(j=>j.attempts<j.max_attempts && j.build?.owner_paused!==true && j.build?.owner_paused!=='true' &&
  !/storage cap exceeded|COURSE_OBJECT_STORAGE_UPLOAD_FAILED|COURSE_OBJECT_STORAGE_DELIVERY_NOT_CONFIGURED/i.test(j.last_error??''));
 // An empty queue needs no Google inventory calls. Infinite prerequisite waits
 // are excluded by available_at and cannot trigger a paid execution.
 if(!eligible.length && !rows.some(j=>j.status==='running' && Date.parse(j.lease_expires_at)>now.getTime()))return {status:'empty',activeExecutions:0};
 const scope=['--project='+PROJECT,'--region='+LESSON_ROLE_REGION];
 const read=args=>JSON.parse(run([...args,...scope,'--format=json']));
 const source=read(['run','jobs','describe','elevate-course-builder-parallel']);
 const expectedImage=source.spec?.template?.spec?.template?.spec?.containers?.[0]?.image;
 if(!/@sha256:[a-f0-9]{64}$/.test(expectedImage??''))throw Error('IMMUTABLE_APPROVED_WORKER_IMAGE_REQUIRED');
 // Ask the same database predicate used by claims before reserving paid capacity.
 // Waiting media/QA stages must not occupy slots intended for runnable lessons.
 const ready=[];
 for(const job of eligible){
  if(Date.parse(job.available_at)>now.getTime() ||
    (job.status==='running' && Date.parse(job.lease_expires_at)>now.getTime()))continue;
  const response=await request(new URL('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/rpc/ultimate_autopilot_job_ready'),{
   method:'POST',headers:{...headers,'Content-Type':'application/json'},
   body:JSON.stringify({p_job:job.id}),signal:AbortSignal.timeout(15000),
  });
  if(!response.ok)throw Error('ULTIMATE_AUTOPILOT_READINESS_HTTP_'+response.status);
  const result=await response.json();
  if(typeof result!=='boolean')throw Error('ULTIMATE_AUTOPILOT_READINESS_INVALID');
  if(result)ready.push(job);
 }
 let activeCount=0,capacityWait=false,reserved=null;const launches=[],assigned=[];
 for(const role of ['quality','media','instruction']){
  const candidates=ready.filter(j=>j.payload?.autopilot?.role===role && Date.parse(j.available_at)<=now.getTime() &&
   (j.status==='queued' || Date.parse(j.lease_expires_at)<=now.getTime()));
  const config=LESSON_ROLE_JOBS[role];
  const active=read(['run','jobs','executions','list','--job='+config.name]).filter(e=>!isTerminalExecution(e));
  activeCount+=active.length;
  // Executions still booting also reserve a queue row. Otherwise backfilling
  // beside them could launch more tasks than there is unfinished work.
  const leased=rows.filter(j=>j.payload?.autopilot?.role===role&&j.status==='running'&&Date.parse(j.lease_expires_at)>now.getTime()).length;
  const unclaimed=Math.max(0,active.length-leased);
  const slots=Math.min(Math.max(0,concurrency(role,env,candidates.length+leased)-active.length),Math.max(0,candidates.length-unclaimed));
  if(!slots)continue;
  const job=read(['run','jobs','describe',config.name]),envelope=job.spec?.template?.spec,task=envelope?.template?.spec;
  if(envelope?.parallelism!==1 || envelope?.taskCount!==1 || task?.containers?.[0]?.image!==expectedImage ||
    task.containers[0].env?.find(e=>e.name==='ULTIMATE_AUTOPILOT_ROLE')?.value!==role)
   throw Error('ULTIMATE_AUTOPILOT_APPROVED_TEMPLATE_REQUIRED:'+role);
  for(let slot=0;slot<slots;slot++){
   const capacity=await capacityCheck({region:LESSON_ROLE_REGION,task,taskCount:1,run,request});
   const next=reserveCapacity(capacity,task,reserved);
   if(!next){
    console.info(JSON.stringify({event:'lesson_pool_capacity_wait',role,required:capacity.required,granted:capacity.granted,reserved}));
    capacityWait=true;break;
   }
   const prefix='autopilot-'+role+'-'+randomUUID();
   run(['run','jobs','execute',config.name,...scope,'--tasks=1','--update-env-vars=ULTIMATE_WORKER_ID='+prefix,'--async','--quiet']);
   reserved=next;launches.push({role,prefix,candidates:new Map(candidates.map(j=>[j.id,j]))});activeCount++;
  }
 }
 // Launch the admitted workers first, then verify their claims together. Each
 // execution gets a unique worker prefix; its immutable claim history proves
 // ownership even if another worker takes an earlier queue row or a cached
 // stage completes between polls. A shared role heartbeat is not sufficient.
 const pending=new Map(launches.map(launch=>[launch.prefix,launch]));
 for(let attempt=0;pending.size&&attempt<assignmentAttempts;attempt++){
  const historyUrl=new URL('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_job_attempt_history');
  historyUrl.searchParams.set('select','job_id,execution_generation,worker_id,event_time');
  historyUrl.searchParams.set('event_type','eq.claimed');historyUrl.searchParams.set('event_time','gte.'+now.toISOString());
  historyUrl.searchParams.set('or','('+[...pending.keys()].map(prefix=>'worker_id.like.'+prefix+'-*').join(',')+')');
  historyUrl.searchParams.set('limit',String(pending.size+1));
  const historyResponse=await request(historyUrl,{headers,signal:AbortSignal.timeout(15000)});
  if(!historyResponse.ok)throw Error('ULTIMATE_AUTOPILOT_CLAIM_HISTORY_HTTP_'+historyResponse.status);
  const history=await historyResponse.json();if(!Array.isArray(history))throw Error('ULTIMATE_AUTOPILOT_CLAIM_HISTORY_INVALID');
  if(history.length){
   const verify=new URL(root);verify.searchParams.set('select','id,status,heartbeat_at,lease_owner,lease_expires_at,execution_generation');
   verify.searchParams.set('id','in.('+[...new Set(history.map(h=>h.job_id))].join(',')+')');
   const response=await request(verify,{headers,signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('ULTIMATE_AUTOPILOT_ASSIGNMENT_HTTP_'+response.status);
   const observed=await response.json();if(!Array.isArray(observed))throw Error('ULTIMATE_AUTOPILOT_ASSIGNMENT_INVALID');
   for(const [prefix,launch] of pending){
    const claims=history.filter(h=>h.worker_id?.startsWith(prefix+'-'));
    if(claims.length>1)throw Error('ULTIMATE_AUTOPILOT_MULTIPLE_CLAIMS:'+prefix);
    const claim=claims[0],before=launch.candidates.get(claim?.job_id);
    const job=observed.find(j=>j.id===claim?.job_id);
    if(!before||!job)continue;
    const generation=Number(job.execution_generation);
    const fresh=Number.isSafeInteger(generation)&&generation>Number(before.execution_generation)&&generation===Number(claim.execution_generation)&&
     job.heartbeat_at>=now.toISOString()&&job.heartbeat_at>(before.heartbeat_at??'')&&claim.event_time>=now.toISOString();
    const owned=job.status==='running'&&job.lease_owner===claim.worker_id&&Date.parse(job.lease_expires_at)>clock();
    // A finished attempt can legitimately complete, park for its producer, or
    // queue a repair. This certifies the real claim only, never lesson quality.
    if(fresh&&(owned||['completed','queued','failed'].includes(job.status))){
     assigned.push({role:launch.role,jobId:job.id,state:job.status});pending.delete(prefix);
    }
   }
  }
  if(pending.size&&attempt+1<assignmentAttempts)await delay(5000);
 }
 // A slow claim is pending work, not a failed lesson or dispatcher crash.
 // The coordinator rechecks cloud inventory before admitting another execution.
 const leasedRows=rows.filter(j=>j.status==='running'&&Date.parse(j.lease_expires_at)>now.getTime());
 const freshLeases=leasedRows.filter(j=>{
  const heartbeat=Date.parse(j.heartbeat_at??'');
  return Number.isFinite(heartbeat)&&now.getTime()-heartbeat>=0&&now.getTime()-heartbeat<90000;
 }).length;
 const runnableJobs=leasedRows.length+ready.length;
 const coveredJobs=freshLeases+assigned.length;
 const uncoveredJobs=Math.max(0,runnableJobs-coveredJobs);
 const coverage={contract:'runnable-stage-required-v1',runnableJobs,coveredJobs,uncoveredJobs};
 if(pending.size)return {status:'busy',reason:'awaiting_worker_assignment',
  activeExecutions:activeCount,unconfirmedExecutions:pending.size,assignments:assigned,...coverage};
 // Partial admission is not success. Keep the trusted coordinator alive while
 // admitted workers finish and free quota, then immediately cover the rest.
 if(uncoveredJobs)return capacityWait&&activeCount===0
  ? {status:'capacity_wait',reason:'approved_regional_capacity_unavailable',activeExecutions:0,assignments:assigned,...coverage}
  : {status:'busy',reason:'active_worker_coverage_pending',activeExecutions:activeCount,assignments:assigned,...coverage};
 if(assigned.length)return {status:'assigned',activeExecutions:activeCount,assignments:assigned,...coverage};
 if(activeCount)return {status:'busy',activeExecutions:activeCount};
 if(eligible.some(j=>Date.parse(j.available_at)>now.getTime()))return {status:'retry_wait',activeExecutions:0};
 return capacityWait?{status:'capacity_wait',reason:'approved_regional_capacity_unavailable',activeExecutions:0}:{status:'empty',activeExecutions:0};
}
