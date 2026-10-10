import { google } from './runtime-config.mjs';
import { inspectRegionalCapacity } from './regional-capacity.mjs';
import { pathToFileURL } from 'node:url';
import { assertNoActiveExecutions } from './execute-course-job.mjs';

export async function dispatchQueuedCourseJob({run = (_command, args) => google(args), capacityCheck = inspectRegionalCapacity, request = fetch, env = process.env, now = new Date(), delay = ms => new Promise(resolve => setTimeout(resolve, ms)), assignmentAttempts = 60} = {}) {
  const scope = ['--project=elegant-racer-299721', '--region=us-central1'];
  const executions = JSON.parse(run('gcloud', ['run','jobs','executions','list','--job=elevate-course-builder',...scope,'--format=json'], {encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  try { assertNoActiveExecutions(executions); }
  catch (error) {
    if (error.message === 'COURSE_JOB_ALREADY_ACTIVE') return {status:'busy'};
    throw error;
  }
  const token = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token) throw new Error('SUPABASE_SERVICE_ROLE_KEY_REQUIRED');
  const url = new URL('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs');
  url.searchParams.set('select','id,heartbeat_at,attempts,max_attempts');
  url.searchParams.set('order','priority.asc,available_at.asc,created_at.asc');
  // A stopped execution leaves an expired running lease. Claim RPC performs
  // recovery, but it cannot run unless the dispatcher launches a worker.
  url.searchParams.set('or', '(and(status.eq.queued,available_at.lte.' + now.toISOString() + '),and(status.eq.running,lease_expires_at.lt.' + now.toISOString() + '))');
  url.searchParams.set('limit','50');
  const response = await request(url, {headers:{apikey:token,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error('COURSE_QUEUE_READ_HTTP_' + response.status);
  const candidates = await response.json();
  if (!Array.isArray(candidates)) throw new Error('COURSE_QUEUE_RESPONSE_INVALID');
  const queued = candidates.filter(job => job.max_attempts === undefined || job.attempts < job.max_attempts);
  if (queued.length === 0) return {status:'empty'};
  const job = JSON.parse(run('gcloud', ['run','jobs','describe','elevate-course-builder',...scope,'--format=json'], {encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  const task = job.spec?.template?.spec?.template?.spec;
  if (!task?.containers?.length) throw new Error('COURSE_JOB_CONFIGURATION_UNAVAILABLE');
  const capacity = await capacityCheck({region:'us-central1', task, run: args => run('gcloud', args, {encoding:'utf8',stdio:['ignore','pipe','pipe']})});
  if (!capacity.fits) return {status:'capacity_wait', ...capacity};
  run('gcloud',['run','jobs','execute','elevate-course-builder',...scope,'--tasks=1','--async','--quiet'],{stdio:'inherit'});
  // Launch is not assignment. Require a fresh durable heartbeat from the selected job.
  const jobId = queued[0].id;
  const previousHeartbeat = queued[0].heartbeat_at || '';
  const assignmentUrl = new URL('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs');
  assignmentUrl.searchParams.set('select', 'id,status,lease_owner,heartbeat_at,last_error');
  assignmentUrl.searchParams.set('id', 'eq.' + jobId);
  for (let attempt = 0; attempt < assignmentAttempts; attempt++) {
    const check = await request(assignmentUrl, {headers:{apikey:token,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
    if (!check.ok) throw new Error('COURSE_ASSIGNMENT_READ_HTTP_' + check.status);
    const rows = await check.json();
    const job = rows?.[0];
    if (job?.heartbeat_at && job.heartbeat_at > previousHeartbeat && job.heartbeat_at >= now.toISOString()) {
      if (job.status === 'failed') throw new Error('COURSE_WORKER_FAILED_AFTER_ASSIGNMENT');
      return {status:'assigned',jobId,workerId:job.lease_owner || null,heartbeatAt:job.heartbeat_at};
    }
    if (attempt + 1 < assignmentAttempts) await delay(5000);
  }
  throw new Error('COURSE_WORKER_ASSIGNMENT_TIMEOUT:' + jobId);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await dispatchQueuedCourseJob()));
}
