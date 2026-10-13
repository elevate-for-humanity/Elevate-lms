import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function assertNoActiveExecutions(executions) {
  if (!Array.isArray(executions)) throw new Error('EXECUTION_LIST_INVALID');
  for (const execution of executions) {
    const condition = execution.status?.conditions?.find(item => item.type === 'Completed');
    const terminal = execution.status?.completionTime || ['True', 'False'].includes(condition?.status);
    if (!terminal) throw new Error('COURSE_JOB_ALREADY_ACTIVE');
  }
}

function main() {
  const scope = ['--project=elegant-racer-299721', '--region=us-central1'];
  const executions = JSON.parse(execFileSync('gcloud', [
    'run', 'jobs', 'executions', 'list', '--job=elevate-course-builder',
    ...scope, '--format=json',
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  assertNoActiveExecutions(executions);
  // One task only. Supabase owns the lease, checkpoint and retry policy.
  execFileSync('gcloud', [
    'run', 'jobs', 'execute', 'elevate-course-builder', ...scope,
    '--tasks=1', '--wait', '--quiet',
  ], { stdio: 'inherit' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
