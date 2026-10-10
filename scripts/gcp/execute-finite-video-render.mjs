import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { google, PROJECT } from './runtime-config.mjs';

const JOB = 'elevate-video-render';
const SCOPE = ['--project=' + PROJECT, '--region=us-central1', '--format=json'];
const terminal = execution => Boolean(execution.status?.completionTime ||
  ['True', 'False'].includes(execution.status?.conditions?.find(c => c.type === 'Completed')?.status));
export function executionSummary(execution) {
  return { execution: execution.metadata?.name, started: execution.status?.startTime,
    completed: execution.status?.completionTime, running: execution.status?.runningCount,
    succeeded: execution.status?.succeededCount, failed: execution.status?.failedCount,
    conditions: (execution.status?.conditions || []).map(c => ({ type: c.type, status: c.status,
      reason: c.reason, message: String(c.message || '').replace(/https?:\/\/\S+/g, '[url]').slice(0, 1000) })) };
}
export async function executeFiniteVideoJob({ configuration = 'saved', validateOnly = false,
  run = google, log = value => console.log(JSON.stringify(value)),
  pause = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now,
  source = readFileSync(new URL('./finite-video-render.mjs', import.meta.url), 'utf8'),
} = {}) {
  if (!['saved', 'redeploy'].includes(configuration) || typeof validateOnly !== 'boolean')
    throw new Error('Explicit saved/redeploy configuration and boolean validation mode required');
  const read = args => JSON.parse(run([...args, ...SCOPE]));
  let job = read(['run', 'jobs', 'describe', JOB]);
  const task = job.spec.template.spec.template.spec;
  if (task.containers.length !== 1 || Number(job.spec.template.spec.taskCount) !== 1 ||
      Number(job.spec.template.spec.parallelism || 1) !== 1 || Number(task.maxRetries) !== 0)
    throw new Error('Finite renderer requires one task, parallelism one, and zero automatic retries');
  const active = read(['run', 'jobs', 'executions', 'list', '--job=' + JOB]).filter(x => !terminal(x));
  if (active.length) {
    active.forEach(x => log({ activeExecution: executionSummary(x) }));
    throw new Error('Render is already active; inspect the reported execution before retrying');
  }
  if (configuration === 'redeploy') {
    const service = read(['run', 'services', 'describe', 'elevate-admin-migration']);
    const traffic = (service.status?.traffic || []).filter(x => x.percent > 0);
    if (traffic.length !== 1 || traffic[0].percent !== 100 || !traffic[0].revisionName)
      throw new Error('One fully serving Admin revision is required for the renderer image');
    const revision = read(['run', 'revisions', 'describe', traffic[0].revisionName]);
    if (revision.status?.conditions?.find(c => c.type === 'Ready')?.status !== 'True' ||
        revision.status?.conditions?.some(c => c.type === 'ContainerHealthy' && c.status === 'False'))
      throw new Error('The serving Admin revision is not healthy');
    const image = revision.status?.imageDigest || revision.spec.containers[0].image;
    if (!/^us-central1-docker.pkg.dev\/elegant-racer-299721\/elevate\/admin@sha256:[a-f0-9]{64}$/.test(image))
      throw new Error('An immutable Google Admin image digest is required');
    if (revision.spec.serviceAccountName !== task.serviceAccountName)
      throw new Error('Saved renderer and serving Admin runtime identities differ');
    const runner = source + '\nawait runFiniteVideoRender();';
    if (runner.includes('~')) throw new Error('Unsupported runner argument delimiter');
    // Update only the image and entrypoint. Resource allocations, task settings,
    // secret bindings, and exact course/video IDs remain owned by the saved job.
    run(['run', 'jobs', 'update', JOB, ...SCOPE, '--image=' + image, '--command=node',
      '--args=^~^--input-type=module~-e~' + runner, '--quiet']);
    const updated = read(['run', 'jobs', 'describe', JOB]);
    const expected = structuredClone(job.spec);
    Object.assign(expected.template.spec.template.spec.containers[0], {
      image, command: ['node'], args: ['--input-type=module', '-e', runner],
    });
    if (!isDeepStrictEqual(expected, updated.spec))
      throw new Error('Saved job settings changed unexpectedly; execution stopped');
    job = updated;
    log({ updated: true, image, servingRevision: traffic[0].revisionName, savedSettingsPreserved: true });
  }
  const container = job.spec.template.spec.template.spec.containers[0];
  if (validateOnly && !container.args?.some(x => x.includes('VIDEO_VALIDATE_ONLY')))
    throw new Error('Refresh the runner before requesting validation-only execution');
  log({ configuration, validateOnly, resources: container.resources?.limits,
    taskCount: job.spec.template.spec.taskCount, retries: task.maxRetries });
  const started = read(['run', 'jobs', 'execute', JOB, '--quiet', '--async',
    '--update-env-vars=VIDEO_VALIDATE_ONLY=' + validateOnly]);
  const name = started.metadata?.name;
  if (!/^elevate-video-render-[a-z0-9]+$/.test(name || ''))
    throw new Error('Execution submitted but its identity is unavailable; inspect Google before another launch');
  log({ executionSubmitted: name, validateOnly });
  const deadline = now() + 65 * 60 * 1000;
  let previous = '';
  while (now() < deadline) {
    const execution = read(['run', 'jobs', 'executions', 'describe', name]);
    const summary = executionSummary(execution);
    const serialized = JSON.stringify(summary);
    if (serialized !== previous) { log(summary); previous = serialized; }
    if (terminal(execution)) {
      if (execution.status?.conditions?.find(c => c.type === 'Completed')?.status === 'True') return summary;
      try {
        const tasks = read(['run', 'jobs', 'executions', 'tasks', 'list', '--execution=' + name]);
        log({ taskFailures: tasks.map(t => ({ ...executionSummary(t), result: t.status?.lastAttemptResult })) });
      } catch { log({ taskDetailsUnavailable: true }); }
      throw new Error('Google render execution failed; see the execution and task conditions above');
    }
    await pause(15000);
  }
  throw new Error('Execution remains active; inspect it before retrying');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!['true', 'false'].includes(process.env.VALIDATE_ONLY || 'false')) throw new Error('Invalid validation flag');
  await executeFiniteVideoJob({ configuration: process.env.RENDER_CONFIGURATION || 'saved',
    validateOnly: process.env.VALIDATE_ONLY === 'true' });
}
