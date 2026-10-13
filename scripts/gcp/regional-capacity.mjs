import { google, PROJECT } from './runtime-config.mjs';

export function allocation(limits) {
  const cpu = String(limits?.cpu || '');
  const memory = String(limits?.memory || '').match(/^(\d+)(Gi|Mi)$/);
  if (!/^(?:\d+|\d+m)$/.test(cpu) || !memory) throw new Error('Unrecognized resource allocation');
  return { cpu: cpu.endsWith('m') ? Number(cpu.slice(0, -1)) : Number(cpu) * 1000,
    memory: Number(memory[1]) * (memory[2] === 'Gi' ? 2 ** 30 : 2 ** 20) };
}
export const isTerminalExecution = execution => Boolean(execution.status?.completionTime ||
  ['True', 'False'].includes(execution.status?.conditions?.find(c => c.type === 'Completed')?.status));

// A service template can describe an unsuccessful deployment. Only effective
// revisions and nonterminal execution specs describe the resources still used.
// This is a conservative allocation bound, not a utilization measurement.
export function requiredRegionalAllocation(services, task, revisions, executions = []) {
  const required = { cpu: 0, memory: 0 };
  const add = (containers, count) => {
    if (!Array.isArray(containers) || !containers.length || !Number.isInteger(count) || count < 1)
      throw new Error('Workload allocation is unavailable');
    for (const container of containers) {
      const size = allocation(container.resources?.limits);
      required.cpu += size.cpu * count; required.memory += size.memory * count;
    }
  };
  add(task.containers, 1);
  for (const service of services) {
    if (service.metadata?.annotations?.['run.googleapis.com/scalingMode'] === 'manual')
      throw new Error('Manual service scaling requires explicit capacity review');
    // Only revisions receiving traffic or retained by a live traffic tag can
    // scale to the configured maximum. Historical revisions can remain marked
    // Active after traffic has moved; counting all of them double-counts
    // regional capacity and blocks the course worker unnecessarily.
    const names = new Set((service.status?.traffic || [])
      .filter(t => t.percent > 0 || t.tag)
      .map(t => t.revisionName || (t.latestRevision ? service.status?.latestReadyRevisionName : null))
      .filter(Boolean));
    if (!names.size) throw new Error('Service effective revision is unavailable');
    for (const name of names) {
      const revision = revisions.find(r => r.metadata?.name === name);
      if (!revision) throw new Error('Service effective revision is unavailable');
      const max = Number(revision.metadata?.annotations?.['autoscaling.knative.dev/maxScale']);
      if (!Number.isInteger(max) || max < 1) throw new Error('Effective revision needs a bounded maximum');
      add(revision.spec?.containers, max);
    }
  }
  for (const execution of executions.filter(e => !isTerminalExecution(e)))
    add(execution.spec?.template?.spec?.containers, Number(execution.spec?.parallelism || execution.spec?.taskCount || 1));
  return required;
}

export async function inspectRegionalCapacity({ region, task, run = google, request = fetch }) {
  if (!['us-central1', 'us-east1'].includes(region)) throw new Error('Unsupported capacity region');
  const read = args => JSON.parse(run([...args, '--project=' + PROJECT, '--region=' + region, '--format=json']));
  const services = read(['run', 'services', 'list']);
  const revisions = read(['run', 'revisions', 'list']);
  const jobs = read(['run', 'jobs', 'list']);
  const executions = jobs.flatMap(job => read(['run', 'jobs', 'executions', 'list', '--job=' + job.metadata.name]));
  const required = requiredRegionalAllocation(services, task, revisions, executions);
  const token = run(['auth', 'print-access-token']);
  const granted = {};
  for (const [key, quotaId] of [['cpu', 'CpuAllocPerProjectRegion'], ['memory', 'MemAllocPerProjectRegion']]) {
    const response = await request('https://cloudquotas.googleapis.com/v1/projects/484736877039/locations/global/services/run.googleapis.com/quotaInfos/' + quotaId,
      { headers: { authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Unable to verify approved regional quota');
    const info = await response.json();
    const value = info.dimensionsInfos?.find(x => x.dimensions?.region === region)?.details?.value;
    if (!/^(?:-1|\d+)$/.test(String(value))) throw new Error('Approved regional quota is unavailable');
    granted[key] = Number(value);
  }
  return { region, required, granted, fits: Object.keys(granted).every(k => granted[k] === -1 || required[k] <= granted[k]) };
}
