import { pathToFileURL } from 'node:url';
import { google } from './runtime-config.mjs';
import { inspectRegionalCapacity } from './regional-capacity.mjs';

export function assertNoActiveExecutions(executions) {
  if (!Array.isArray(executions)) throw new Error('EXECUTION_LIST_INVALID');
  for (const execution of executions) {
    const condition = execution.status?.conditions?.find(item => item.type === 'Completed');
    const terminal = execution.status?.completionTime || ['True', 'False'].includes(condition?.status);
    if (!terminal) throw new Error('COURSE_JOB_ALREADY_ACTIVE');
  }
}

export async function executeCourseJob({run=google,capacityCheck=inspectRegionalCapacity}={}) {
  const scope = ['--project=elegant-racer-299721', '--region=us-central1'];
  const executions = () => JSON.parse(run([
    'run', 'jobs', 'executions', 'list', '--job=elevate-course-builder',
    ...scope, '--format=json',
  ]));
  assertNoActiveExecutions(executions());
  const job=JSON.parse(run(['run','jobs','describe','elevate-course-builder',...scope,'--format=json']));
  const task=job.spec?.template?.spec?.template?.spec;
  if(!Array.isArray(task?.containers)||!task.containers.length)throw Error('COURSE_JOB_CONFIGURATION_UNAVAILABLE');
  const capacity=await capacityCheck({region:'us-central1',task,taskCount:1,run});
  if(capacity?.fits!==true)throw Error('COURSE_JOB_REGIONAL_CAPACITY_UNAVAILABLE');
  // Catch an execution launched while the read-only quota inventory was running.
  // Workflow serialization is still required: this is not a distributed lease.
  assertNoActiveExecutions(executions());
  // One task only. Supabase owns the lease, checkpoint and retry policy.
  run([
    'run', 'jobs', 'execute', 'elevate-course-builder', ...scope,
    '--tasks=1', '--wait', '--quiet',
  ]);
  return {executed:true,taskCount:1,region:'us-central1'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  executeCourseJob().then(result=>console.log(JSON.stringify(result))).catch(error=>{
    const diagnosis=/^(?:COURSE_JOB_[A-Z_]+|EXECUTION_LIST_INVALID)$/.test(error.message)?error.message:'course_execution_failed';
    console.error(JSON.stringify({error:diagnosis,code:error.code||'course_execution_failed',quotaIds:error.quotaIds||[]}));
    process.exitCode=1;
  });
}
