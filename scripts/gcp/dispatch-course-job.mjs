import { google } from './runtime-config.mjs';
import { inspectRegionalCapacity, executionAllocationCount } from './regional-capacity.mjs';
import { pathToFileURL } from 'node:url';

export async function dispatchQueuedCourseJob({run = (_command, args) => google(args), capacityCheck = inspectRegionalCapacity, request = fetch, env = process.env, now = new Date(), delay = ms => new Promise(resolve => setTimeout(resolve, ms)), assignmentAttempts = 1, clock = () => Date.now()} = {}) {
  const scope = ['--project=elegant-racer-299721', '--region=us-central1'];
  // An active Cloud Run execution must not block unrelated queued builds.
  // Atomic database leases prevent two tasks from claiming the same job.
  const executions = JSON.parse(run('gcloud', ['run','jobs','executions','list','--job=elevate-course-builder',...scope,'--format=json'], {encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  if (!Array.isArray(executions)) throw new Error('EXECUTION_LIST_INVALID');
  const active = executions.filter(execution => {
    const condition = execution.status?.conditions?.find(item => item.type === 'Completed');
    return !execution.status?.completionTime && !['True','False'].includes(condition?.status);
  });
  const token = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token) throw new Error('SUPABASE_SERVICE_ROLE_KEY_REQUIRED');
  const url = new URL('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs');
  // Role jobs use separate resource profiles and role-filtered claims.
  url.searchParams.set('job_type','not.like.lesson_autopilot:*');
  url.searchParams.set('select','id,status,available_at,heartbeat_at,execution_generation,attempts,max_attempts,last_error,build:ultimate_course_builds!inner(owner_paused:profile->>ownerPaused)');
  url.searchParams.set('order','priority.asc,available_at.asc,created_at.asc');
  // A stopped execution leaves an expired running lease. Claim RPC performs
  // recovery, but it cannot run unless the dispatcher launches a worker.
  // Observe imminent retry backoff without launching it before available_at.
  // Otherwise the last execution can finish seconds before a queued retry is
  // due, and the coordinator exits until a delayed scheduled event arrives.
  const retryHorizon = new Date(now.getTime() + 5 * 60_000);
  url.searchParams.set('or', '(and(status.eq.queued,available_at.lte.' + retryHorizon.toISOString() + '),and(status.eq.running,lease_expires_at.lt.' + now.toISOString() + '))');
  // Filter the joined build before the queue limit so paused rows cannot
  // hide eligible work. Missing pause flags retain their existing eligibility.
  url.searchParams.set('build.or','(profile->>ownerPaused.is.null,profile->>ownerPaused.neq.true)');
  url.searchParams.set('limit','50');
  const candidates = [];
  // Exhausted and storage-blocked rows may fill an entire page. Continue the
  // scan so those rows cannot starve runnable work later in queue order.
  for(let offset=0;;offset+=50){
    const pageUrl=new URL(url);
    pageUrl.searchParams.set('offset',String(offset));
    const response = await request(pageUrl, {headers:{apikey:token,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error('COURSE_QUEUE_READ_HTTP_' + response.status);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('COURSE_QUEUE_RESPONSE_INVALID');
    candidates.push(...page);
    if(page.length<50)break;
  }
  // Storage capacity failures require a successful capacity/upload preflight.
  // Never dispatch another expensive render merely because its lease expired.
  const blockedByStorage = job => /storage cap exceeded|COURSE_OBJECT_STORAGE_UPLOAD_FAILED|COURSE_OBJECT_STORAGE_DELIVERY_NOT_CONFIGURED/i.test(job.last_error ?? '');
  // Respect explicit owner pauses before launching paid Cloud Run work.
  // The worker independently enforces this pause if it changes after dispatch.
  const ownerPaused = job => job.build?.owner_paused === true || job.build?.owner_paused === 'true';
  const eligible = candidates.filter(job => (job.max_attempts === undefined || job.attempts < job.max_attempts) && !blockedByStorage(job) && !ownerPaused(job));
  const availableTime = job => {
    if (job.available_at == null) return 0;
    const timestamp = Date.parse(job.available_at);
    if (!Number.isFinite(timestamp)) throw new Error('COURSE_QUEUE_AVAILABLE_AT_INVALID');
    return timestamp;
  };
  const queued = eligible.filter(job => availableTime(job) <= now.getTime());
  // Never claim an empty queue merely because an earlier failed job exists.
  // Emit durable, actionable diagnostics without exposing Supabase credentials.
  console.info(JSON.stringify({event:'course_dispatch_queue_scan',candidateCount:candidates.length,
    runnableCount:queued.length,activeExecutions:active.length,
    candidateIds:queued.map(job=>job.id)}));
  // A leased task can enqueue its next lesson only after finishing the current
  // one. Keep the coordinator alive across that handoff without launching more tasks.
  // An already-running Cloud Run execution owns its task independently.
  // With no claimable queue entries there is nothing to dispatch; keeping
  // the GitHub coordinator awake wastes runtime and cannot advance a lesson.
  if (queued.length === 0) {
    const next = eligible.map(availableTime).filter(time => time > now.getTime()).sort((a,b) => a-b)[0];
    if (next !== undefined) return {status:'retry_wait',availableAt:new Date(next).toISOString(),activeExecutions:active.length};
    return {status:'empty',activeExecutions:active.length};
  }
  const job = JSON.parse(run('gcloud', ['run','jobs','describe','elevate-course-builder',...scope,'--format=json'], {encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  const task = job.spec?.template?.spec?.template?.spec;
  if (!task?.containers?.length) throw new Error('COURSE_JOB_CONFIGURATION_UNAVAILABLE');
  // One Cloud Run task claims one job via the existing atomic Supabase RPC.
  // Start independent tasks for waiting builds instead of serializing every
  // course behind the first running lesson. Keep a bounded default for quota.
  const configured = Number(env.COURSE_WORKER_PARALLELISM ?? 2);
  const limit = Number.isSafeInteger(configured) ? Math.min(4, Math.max(1, configured)) : 2;
  // Bound new tasks to configured concurrency, including existing executions.
  const slots = Math.max(0, limit - active.reduce((sum, execution) => sum + executionAllocationCount(execution), 0));
  if (!slots) { console.warn(JSON.stringify({event:'course_dispatch_no_slots',activeExecutions:active.length,limit})); return {status:'busy',activeExecutions:active.length}; }
  const parallelism = Number(job.spec?.template?.spec?.parallelism);
  if (!Number.isSafeInteger(parallelism) || parallelism < 1) throw new Error('COURSE_JOB_PARALLELISM_UNAVAILABLE');
  let tasks = Math.min(slots, queued.length, parallelism);
  let capacity;
  // Budget the entire batch. Keep every requested task eligible for an immediate
  // claim; do not launch a batch larger than the existing job parallelism.
  do {
    capacity = await capacityCheck({region:'us-central1', task, taskCount:tasks,
      run: args => run('gcloud', args, {encoding:'utf8',stdio:['ignore','pipe','pipe']})});
    if (capacity.fits) break;
    tasks--;
  } while (tasks > 0);
  if (!tasks) { console.warn(JSON.stringify({event:'course_dispatch_capacity_wait',capacity})); return {status:'capacity_wait', ...capacity}; }
  run('gcloud',['run','jobs','execute','elevate-course-builder',...scope,`--tasks=${tasks}`,'--async','--quiet'],{stdio:'inherit'});
  // Launch is not assignment. Require fresh durable claims for every task.
  const pending = new Map(queued.slice(0,tasks).map(item => [item.id, {heartbeat:item.heartbeat_at || '',generation:item.execution_generation}]));
  const assignmentUrl = new URL('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs');
  assignmentUrl.searchParams.set('select', 'id,status,lease_owner,lease_expires_at,heartbeat_at,execution_generation,available_at,last_error');
  assignmentUrl.searchParams.set('id', 'in.(' + [...pending.keys()].join(',') + ')');
  for (let attempt = 0; attempt < assignmentAttempts; attempt++) {
    const check = await request(assignmentUrl, {headers:{apikey:token,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
    if (!check.ok) throw new Error('COURSE_ASSIGNMENT_READ_HTTP_' + check.status);
    const rows = await check.json();
    for (const job of rows ?? []) {
      if (!pending.has(job.id)) continue;
      if (job.status === 'failed') throw new Error('COURSE_WORKER_FAILED_AFTER_ASSIGNMENT:' + job.id);
      const before=pending.get(job.id);
      const fresh=job.heartbeat_at && job.heartbeat_at > before.heartbeat && job.heartbeat_at >= now.toISOString();
      if (!fresh) continue;
      if (job.status === 'running' && job.lease_owner && Date.parse(job.lease_expires_at ?? '') > clock()) {
        pending.delete(job.id);continue;
      }
      // A cached job or pool coordinator can finish between five-second polls.
      // Prove its new claim generation; a parked coordinator also requires the
      // real task graph, not a launch response or a mutable monitor label.
      if (!Number.isSafeInteger(before.generation) || !Number.isSafeInteger(Number(job.execution_generation)) ||
          Number(job.execution_generation)<=before.generation) continue;
      if (job.status==='completed') {pending.delete(job.id);continue;}
      if (job.status==='queued' && job.available_at==='infinity') {
        const graphUrl=new URL('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_autopilot_pools');
        graphUrl.searchParams.set('select','id,state');graphUrl.searchParams.set('coordinator_job_id','eq.'+job.id);
        const graph=await request(graphUrl,{headers:{apikey:token,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
        if(!graph.ok)throw Error('COURSE_POOL_ASSIGNMENT_READ_HTTP_'+graph.status);
        const pools=await graph.json();
        if(Array.isArray(pools) && pools.length===1 && pools[0]?.id && ['active','finalizing'].includes(pools[0].state))pending.delete(job.id);
      }
    }
    if (!pending.size) return {status:'assigned',tasks,jobIds:queued.slice(0,tasks).map(item=>item.id)};
    if (attempt + 1 < assignmentAttempts) await delay(5000);
  }
  // Let the coordinator observe slow startup without failing or calling it assigned.
  // Active Cloud Run inventory prevents a duplicate launch on the next pass.
  return {status:'busy',reason:'awaiting_worker_assignment',
    activeExecutions:active.length+1,unconfirmedTasks:pending.size,jobIds:[...pending.keys()]};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await dispatchQueuedCourseJob()));
}

