import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { assertNoActiveExecutions } from './execute-course-job.mjs';

export async function dispatchQueuedCourseJob({run = execFileSync, request = fetch, env = process.env, now = new Date()} = {}) {
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
  url.searchParams.set('select','id');
  url.searchParams.set('status','eq.queued');
  url.searchParams.set('available_at','lte.' + now.toISOString());
  url.searchParams.set('limit','1');
  const response = await request(url, {headers:{apikey:token,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error('COURSE_QUEUE_READ_HTTP_' + response.status);
  const queued = await response.json();
  if (!Array.isArray(queued)) throw new Error('COURSE_QUEUE_RESPONSE_INVALID');
  if (queued.length === 0) return {status:'empty'};
  run('gcloud',['run','jobs','execute','elevate-course-builder',...scope,'--tasks=1','--async','--quiet'],{stdio:'inherit'});
  return {status:'dispatched'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await dispatchQueuedCourseJob()));
}
