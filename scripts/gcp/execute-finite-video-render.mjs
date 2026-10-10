import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { google, PROJECT } from './runtime-config.mjs';

const JOB = 'elevate-video-render';
const scope = region => ['--project=' + PROJECT, '--region=' + region, '--format=json'];
const REGIONS = ['us-central1', 'us-east1'];
const STARTUP_PROBE = { httpGet: { path: '/ready', port: 3101 }, timeoutSeconds: 5, periodSeconds: 10, failureThreshold: 60 };

export function allocation(limits) {
  const cpu = String(limits?.cpu || '');
  const memory = String(limits?.memory || '').match(/^(\d+)(Gi|Mi)$/);
  if (!/^(?:\d+|\d+m)$/.test(cpu) || !memory) throw new Error('Unrecognized resource allocation');
  return { cpu: cpu.endsWith('m') ? Number(cpu.slice(0, -1)) : Number(cpu) * 1000,
    memory: Number(memory[1]) * (memory[2] === 'Gi' ? 2 ** 30 : 2 ** 20) };
}

export function requiredRegionalAllocation(services, task) {
  const required = allocation(task.containers[0].resources?.limits);
  for (const service of services) {
    const max = Number(service.spec.template.metadata.annotations?.['autoscaling.knative.dev/maxScale']);
    if (!Number.isInteger(max) || max < 1) throw new Error('Target service needs a bounded maximum before placing the renderer');
    for (const container of service.spec.template.spec.containers) {
      const size = allocation(container.resources?.limits);
      required.cpu += size.cpu * max; required.memory += size.memory * max;
    }
  }
  return required;
}
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
  region = 'us-central1', sourceRegion = '', request = fetch,
  run = google, log = value => console.log(JSON.stringify(value)),
  pause = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now,
  source = readFileSync(new URL('./finite-video-render.mjs', import.meta.url), 'utf8'),
} = {}) {
  if (!['saved', 'redeploy'].includes(configuration) || typeof validateOnly !== 'boolean')
    throw new Error('Explicit saved/redeploy configuration and boolean validation mode required');
  if (!REGIONS.includes(region) || (sourceRegion && (!REGIONS.includes(sourceRegion) || sourceRegion === region)))
    throw new Error('Unsupported target or source region');
  const read = (args, location = region) => JSON.parse(run([...args, ...scope(location)]));
  let migrating = false;
  let job;
  if (sourceRegion) {
    const existing = read(['run', 'jobs', 'list']);
    migrating = !existing.some(x => x.metadata.name === JOB);
    if (migrating && (configuration !== 'redeploy' || !validateOnly || existing.length))
      throw new Error('Initial regional placement requires refresh, validation-only, and no other target jobs');
  }
  job = read(['run', 'jobs', 'describe', JOB], migrating ? sourceRegion : region);
  const task = job.spec.template.spec.template.spec;
  if (task.containers.length !== 1 || Number(job.spec.template.spec.taskCount) !== 1 ||
      Number(job.spec.template.spec.parallelism || 1) !== 1 || Number(task.maxRetries) !== 0)
    throw new Error('Finite renderer requires one task, parallelism one, and zero automatic retries');
  const active = migrating ? [] : read(['run', 'jobs', 'executions', 'list', '--job=' + JOB]).filter(x => !terminal(x));
  if (active.length) {
    active.forEach(x => log({ activeExecution: executionSummary(x) }));
    throw new Error('Render is already active; inspect the reported execution before retrying');
  }
  let sourceValidations = [];
  if (migrating) {
    const annotations = job.spec.template.metadata?.annotations || {};
    if (task.volumes?.length || Object.keys(annotations).some(k => /vpc|network|cloudsql/i.test(k)))
      throw new Error('Regional networking or storage requires an explicit migration plan');
    sourceValidations = read(['run', 'jobs', 'executions', 'list', '--job=' + JOB], sourceRegion).filter(x => !terminal(x));
    if (sourceValidations.some(x => !x.spec?.template?.spec?.containers?.[0]?.env?.some(e => e.name === 'VIDEO_VALIDATE_ONLY' && e.value === 'true')))
      throw new Error('A real source render is active; regional placement stopped');
    const services = read(['run', 'services', 'list']);
    const required = requiredRegionalAllocation(services, task);
    const token = run(['auth', 'print-access-token']);
    const granted = {};
    for (const [key, quotaId] of [['cpu', 'CpuAllocPerProjectRegion'], ['memory', 'MemAllocPerProjectRegion']]) {
      const response = await request('https://cloudquotas.googleapis.com/v1/projects/484736877039/locations/global/services/run.googleapis.com/quotaInfos/' + quotaId,
        { headers: { authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('Unable to verify approved target-region quota');
      const info = await response.json();
      const value = info.dimensionsInfos?.find(x => x.dimensions?.region === region)?.details?.value;
      if (!/^(?:-1|\d+)$/.test(String(value))) throw new Error('Target-region quota is unavailable');
      granted[key] = Number(value);
      if (granted[key] !== -1 && required[key] > granted[key]) throw new Error('Approved target-region quota does not cover bounded workloads');
    }
    log({ targetRegionCapacity: region, required, granted });
  }
  if (configuration === 'redeploy') {
    const service = read(['run', 'services', 'describe', 'elevate-admin-migration'], 'us-central1');
    const traffic = (service.status?.traffic || []).filter(x => x.percent > 0);
    if (traffic.length !== 1 || traffic[0].percent !== 100 || !traffic[0].revisionName)
      throw new Error('One fully serving Admin revision is required for the renderer image');
    const revision = read(['run', 'revisions', 'describe', traffic[0].revisionName], 'us-central1');
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
    // Update the image, entrypoint and requested startup health check. Resource allocations, task settings,
    // secret bindings, and exact course/video IDs remain owned by the saved job.
    const expected = structuredClone(job.spec);
    const expectedContainer = expected.template.spec.template.spec.containers[0];
    Object.assign(expectedContainer, {
      image, command: ['node'], args: ['--input-type=module', '-e', runner], startupProbe: structuredClone(STARTUP_PROBE),
    });
    const existingHealthPort = (expectedContainer.env || []).find(e => e.name === 'VIDEO_HEALTH_PORT');
    if (existingHealthPort?.valueFrom) throw new Error('Health-check port conflicts with a saved secret binding');
    if (existingHealthPort) existingHealthPort.value = '3101';
    else (expectedContainer.env ||= []).push({ name: 'VIDEO_HEALTH_PORT', value: '3101' });
    if (migrating) {
      const directory = mkdtempSync(join(tmpdir(), 'google-render-region-'));
      try {
        const path = join(directory, 'job.json');
        writeFileSync(path, JSON.stringify({ apiVersion: 'run.googleapis.com/v1', kind: 'Job', metadata: { name: JOB }, spec: expected }), { mode: 0o600 });
        run(['run', 'jobs', 'replace', path, ...scope(region), '--quiet']);
      } finally { rmSync(directory, { recursive: true, force: true }); }
    } else {
      run(['run', 'jobs', 'update', JOB, ...scope(region), '--image=' + image, '--command=node',
        '--args=^~^--input-type=module~-e~' + runner, '--update-env-vars=VIDEO_HEALTH_PORT=3101',
        '--startup-probe=httpGet.path=/ready,httpGet.port=3101,timeoutSeconds=5,periodSeconds=10,failureThreshold=60', '--quiet']);
    }
    const updated = read(['run', 'jobs', 'describe', JOB]);
    // gcloud changes this bookkeeping nonce on every update. It is not a
    // runtime setting; all resource, secret, network and identity fields must match.
    const actual = structuredClone(updated.spec);
    for (const spec of [expected, actual]) {
      if (spec.template.metadata?.labels) delete spec.template.metadata.labels['client.knative.dev/nonce'];
    }
    if (!isDeepStrictEqual(expected, actual)) {
      const changedPaths = (left, right, path = 'spec') => {
        if (isDeepStrictEqual(left, right)) return [];
        if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return [path];
        return [...new Set([...Object.keys(left), ...Object.keys(right)])]
          .flatMap(key => changedPaths(left[key], right[key], path + '.' + key));
      };
      log({ unexpectedSettingPaths: changedPaths(expected, actual),
        resourcesBefore: task.containers[0].resources?.limits,
        resourcesAfter: updated.spec.template.spec.template.spec.containers[0].resources?.limits });
      throw new Error('Saved job settings changed unexpectedly; execution stopped');
    }
    job = updated;
    log({ updated: true, region, migratedFrom: migrating ? sourceRegion : undefined, image, servingRevision: traffic[0].revisionName, savedSettingsPreserved: true });
  }
  // Stop only validation tasks we created in the source region. Their media
  // queues are untouched. Never cancel a real rendering execution here.
  for (const execution of sourceValidations) {
    run(['run', 'jobs', 'executions', 'cancel', execution.metadata.name, ...scope(sourceRegion), '--quiet']);
    log({ cancelledSourceValidation: execution.metadata.name, region: sourceRegion });
  }
  const container = job.spec.template.spec.template.spec.containers[0];
  if (validateOnly && !container.args?.some(x => x.includes('VIDEO_VALIDATE_ONLY')))
    throw new Error('Refresh the runner before requesting validation-only execution');
  if (!isDeepStrictEqual(container.startupProbe, STARTUP_PROBE) ||
      !container.env?.some(e => e.name === 'VIDEO_HEALTH_PORT' && e.value === '3101') ||
      !container.args?.some(x => x.includes('startRenderHealthCheck')))
    throw new Error('Refresh the runner to configure and verify its startup health check');
  log({ configuration, region, validateOnly, resources: container.resources?.limits,
    startupProbe: container.startupProbe, taskCount: job.spec.template.spec.taskCount, retries: task.maxRetries });
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
    validateOnly: process.env.VALIDATE_ONLY === 'true', region: process.env.RENDER_REGION || 'us-central1',
    sourceRegion: process.env.RENDER_SOURCE_REGION || '' });
}
