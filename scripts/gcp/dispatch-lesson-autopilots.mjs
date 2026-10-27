import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity,isTerminalExecution} from './regional-capacity.mjs';
import {LESSON_ROLE_JOBS,LESSON_ROLE_REGION} from './deploy-lesson-autopilots.mjs';

/** All callers share the runtime-operation lane. Claims and prerequisites are
 * rechecked by Postgres; launch/readback is not counted as a completed lesson. */
export async function dispatchLessonAutopilots({run=google,request=fetch,env=process.env,now=new Date(),
 delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),assignmentAttempts=60,capacityCheck=inspectRegionalCapacity,clock=Date.now}={}){
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
 let activeCount=0,capacityWait=false;const assigned=[];
 for(const role of ['quality','media','instruction']){
  const candidates=eligible.filter(j=>j.payload?.autopilot?.role===role && Date.parse(j.available_at)<=now.getTime() &&
   (j.status==='queued' || Date.parse(j.lease_expires_at)<=now.getTime()));
  const config=LESSON_ROLE_JOBS[role];
  const active=read(['run','jobs','executions','list','--job='+config.name]).filter(e=>!isTerminalExecution(e));
  activeCount+=active.length;
  if(active.length || !candidates.length)continue;
  const job=read(['run','jobs','describe',config.name]),envelope=job.spec?.template?.spec,task=envelope?.template?.spec;
  if(envelope?.parallelism!==1 || envelope?.taskCount!==1 || task?.containers?.[0]?.image!==expectedImage ||
    task.containers[0].env?.find(e=>e.name==='ULTIMATE_AUTOPILOT_ROLE')?.value!==role)
   throw Error('ULTIMATE_AUTOPILOT_APPROVED_TEMPLATE_REQUIRED:'+role);
  const capacity=await capacityCheck({region:LESSON_ROLE_REGION,task,taskCount:1,run,request});
  if(!capacity.fits){capacityWait=true;continue;}
  run(['run','jobs','execute',config.name,...scope,'--tasks=1','--async','--quiet']);
  const expected=candidates[0];
  const verify=new URL(root);verify.searchParams.set('select','id,status,heartbeat_at,lease_owner,lease_expires_at,execution_generation');verify.searchParams.set('id','eq.'+expected.id);
  let confirmed=false;
  for(let attempt=0;attempt<assignmentAttempts;attempt++){
   const check=await request(verify,{headers,signal:AbortSignal.timeout(15000)});
   if(!check.ok)throw Error('ULTIMATE_AUTOPILOT_ASSIGNMENT_HTTP_'+check.status);
   const [observed]=await check.json();
   if(observed?.status==='failed')throw Error('ULTIMATE_AUTOPILOT_FAILED_AFTER_CLAIM:'+expected.id);
   const fresh=observed?.heartbeat_at>=now.toISOString() && observed.heartbeat_at>(expected.heartbeat_at??'') &&
    Number(observed.execution_generation)>Number(expected.execution_generation);
   if(fresh && (observed.status==='completed' || observed.status==='running' && observed.lease_owner && Date.parse(observed.lease_expires_at)>clock())){
    confirmed=true;break;
   }
   if(attempt+1<assignmentAttempts)await delay(5000);
  }
  if(!confirmed)throw Error('ULTIMATE_AUTOPILOT_ASSIGNMENT_TIMEOUT:'+expected.id);
  assigned.push({role,jobId:expected.id});activeCount++;
 }
 if(assigned.length)return {status:'assigned',activeExecutions:activeCount,assignments:assigned};
 if(activeCount)return {status:'busy',activeExecutions:activeCount};
 if(eligible.some(j=>Date.parse(j.available_at)>now.getTime()))return {status:'retry_wait',activeExecutions:0};
 return capacityWait?{status:'capacity_wait',reason:'approved_regional_capacity_unavailable',activeExecutions:0}:{status:'empty',activeExecutions:0};
}
