import test from 'node:test';
import assert from 'node:assert/strict';
import { executeFiniteVideoJob } from './execute-finite-video-render.mjs';
const image = 'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/admin@sha256:' + 'a'.repeat(64);
function fixture({ active = [], outcome = 'True', altered = false } = {}) {
  let job = { spec: { template: { spec: { taskCount: 1, parallelism: 1, template: { spec: {
    serviceAccountName: 'runtime', maxRetries: 0, timeoutSeconds: '3600',
    containers: [{ image: image.replace(/a{64}$/, 'b'.repeat(64)), command: ['node'], args: ['VIDEO_VALIDATE_ONLY'],
      resources: { limits: { cpu: '8000m', memory: '32Gi' } },
      env: [{ name: 'VIDEO_JOB_ID', value: 'saved-id' }, { name: 'SECRET', valueFrom: { secretKeyRef: { name: 'bound-secret', key: 'latest' } } }] }],
  } } } } } };
  const before = structuredClone(job);
  const calls = [], logs = [];
  const run = args => {
    calls.push(args);
    const command = args.slice(0, 4).join(' ');
    if (command === 'run jobs describe elevate-video-render') return JSON.stringify(job);
    if (command === 'run jobs executions list') return JSON.stringify(active);
    if (command === 'run services describe elevate-admin-migration') return JSON.stringify({
      spec: { template: { spec: { containers: [{ image: 'unready-candidate' }] } } },
      status: { latestReadyRevisionName: 'other', traffic: [{ percent: 100, revisionName: 'serving' }] },
    });
    if (command === 'run revisions describe serving') return JSON.stringify({ spec: { serviceAccountName: 'runtime' }, status: { imageDigest: image, conditions: [{ type: 'Ready', status: 'True' }] } });
    if (command === 'run jobs update elevate-video-render') {
      Object.assign(job.spec.template.spec.template.spec.containers[0], { image, command: ['node'], args: ['--input-type=module', '-e', 'VIDEO_VALIDATE_ONLY\nawait runFiniteVideoRender();'] });
      if (altered) job.spec.template.spec.template.spec.containers[0].resources.limits.memory = '8Gi';
      return '{}';
    }
    if (command === 'run jobs execute elevate-video-render') return JSON.stringify({ metadata: { name: 'elevate-video-render-test' } });
    if (command === 'run jobs executions describe') return JSON.stringify({ metadata: { name: 'elevate-video-render-test' }, status: { completionTime: 'now', conditions: [{ type: 'Completed', status: outcome, message: outcome === 'False' ? 'Internal error running task.' : '' }] } });
    if (command === 'run jobs executions tasks') return JSON.stringify([{ metadata: { name: 'task0' }, status: { lastAttemptResult: { status: { code: 14, message: 'Internal error running task.' } } } }]);
    throw new Error('Unexpected command: ' + command);
  };
  return { calls, logs, before, job, options: { run, log: x => logs.push(x), source: 'VIDEO_VALIDATE_ONLY' } };
}
test('refresh uses the serving immutable image and preserves 8 CPU/32 GiB, exact IDs, secret bindings and retry settings', async () => {
  const f = fixture();
  await executeFiniteVideoJob({ ...f.options, configuration: 'redeploy', validateOnly: true });
  const update = f.calls.find(c => c[2] === 'update');
  assert.equal(update.some(x => /^--(cpu|memory|tasks|parallelism|max-retries|env-vars-file|service-account)=/.test(x)), false);
  const task = f.job.spec.template.spec.template.spec;
  assert.deepEqual(task.containers[0].resources.limits, { cpu: '8000m', memory: '32Gi' });
  assert.deepEqual(task.containers[0].env, f.before.spec.template.spec.template.spec.containers[0].env);
  assert.ok(f.calls.some(c => c.join(' ').includes('run revisions describe serving')));
  assert.ok(f.calls.find(c => c[2] === 'execute').includes('--update-env-vars=VIDEO_VALIDATE_ONLY=true'));
});
test('saved mode never updates the job and explicitly clears validation-only on actual rendering', async () => {
  const f = fixture(); await executeFiniteVideoJob(f.options);
  assert.equal(f.calls.some(c => c[2] === 'update'), false);
  assert.ok(f.calls.find(c => c[2] === 'execute').includes('--update-env-vars=VIDEO_VALIDATE_ONLY=false'));
});
test('active Google task blocks updates and duplicate execution with visible identity', async () => {
  const f = fixture({ active: [{ metadata: { name: 'elevate-video-render-active' }, status: { conditions: [{ type: 'Completed', status: 'Unknown' }] } }] });
  await assert.rejects(executeFiniteVideoJob({ ...f.options, configuration: 'redeploy' }), /already active/);
  assert.equal(f.calls.some(c => ['update', 'execute'].includes(c[2])), false);
  assert.equal(f.logs[0].activeExecution.execution, 'elevate-video-render-active');
});
test('terminal platform error is a failure, and task code 14 survives reporting', async () => {
  const f = fixture({ outcome: 'False' });
  await assert.rejects(executeFiniteVideoJob(f.options), /execution failed/);
  assert.equal(f.logs.at(-1).taskFailures[0].result.status.code, 14);
});
test('unexpected settings drift aborts before execution', async () => {
  const f = fixture({ altered: true });
  await assert.rejects(executeFiniteVideoJob({ ...f.options, configuration: 'redeploy' }), /changed unexpectedly/);
  assert.equal(f.calls.some(c => c[2] === 'execute'), false);
});
test('validation refuses legacy runners that could accidentally render', async () => {
  const f = fixture(); f.job.spec.template.spec.template.spec.containers[0].args = ['old-runner'];
  await assert.rejects(executeFiniteVideoJob({ ...f.options, validateOnly: true }), /Refresh the runner/);
  assert.equal(f.calls.some(c => c[2] === 'execute'), false);
});
