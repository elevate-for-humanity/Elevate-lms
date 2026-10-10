import test from 'node:test';
import assert from 'node:assert/strict';
import { requiredRegionalAllocation, inspectRegionalCapacity } from './regional-capacity.mjs';

const container = (cpu, memory) => ({ resources: { limits: { cpu, memory } } });
const task = { containers: [container('8', '32Gi')] };
const service = { metadata: { name: 'marketing' }, spec: { template: {
  metadata: { annotations: { 'autoscaling.knative.dev/maxScale': '2' } },
  spec: { containers: [container('1', '2Gi')] },
} }, status: { traffic: [{ revisionName: 'serving', percent: 100 }] } };
const revision = (name = 'serving') => ({ metadata: { name, labels: { 'serving.knative.dev/service': 'marketing' },
  annotations: { 'autoscaling.knative.dev/maxScale': '1' } }, spec: { containers: [container('4', '8Gi')] } });

test('uses the serving immutable revision instead of an unapplied smaller template', () => {
  assert.deepEqual(requiredRegionalAllocation([service], task, [revision()]), { cpu: 12000, memory: 40 * 2 ** 30 });
});
test('includes tagged candidates once, even when they also have traffic', () => {
  const s = structuredClone(service);
  s.status.traffic.push({ revisionName: 'serving', tag: 'live' }, { revisionName: 'candidate', tag: 'candidate' });
  assert.deepEqual(requiredRegionalAllocation([s], task, [revision(), revision('candidate')]), { cpu: 16000, memory: 48 * 2 ** 30 });
});
test('counts older active executions even when the latest execution failed', () => {
  const executions = [
    { spec: { parallelism: 1, template: { spec: { containers: [container('4', '8Gi')] } } }, status: { runningCount: 1 } },
    { status: { conditions: [{ type: 'Completed', status: 'False' }] } },
  ];
  assert.deepEqual(requiredRegionalAllocation([service], task, [revision()], executions), { cpu: 16000, memory: 48 * 2 ** 30 });
});
test('missing effective revisions or an unbounded maximum fail closed', () => {
  assert.throws(() => requiredRegionalAllocation([service], task, []), /effective revision/);
  const unbounded = revision(); delete unbounded.metadata.annotations;
  assert.throws(() => requiredRegionalAllocation([service], task, [unbounded]), /bounded maximum/);
});
test('reads approved regional limits and reports insufficient memory without mutating Google', async () => {
  const calls = [];
  const run = args => {
    calls.push(args);
    const command = args.slice(0, 3).join(' ');
    if (command === 'run services list') return JSON.stringify([service]);
    if (command === 'run revisions list') return JSON.stringify([revision()]);
    if (command === 'run jobs list') return '[]';
    if (args[0] === 'auth') return 'fixture-token';
    throw Error('Unexpected mutation or read');
  };
  const request = async url => ({ ok: true, json: async () => ({ dimensionsInfos: [
    { dimensions: { region: 'us-east1' }, details: { value: String(url.endsWith('CpuAllocPerProjectRegion') ? 20000 : 32 * 2 ** 30) } },
  ] }) });
  const result = await inspectRegionalCapacity({ region: 'us-east1', task, run, request });
  assert.equal(result.fits, false);
  assert.equal(result.required.memory, 40 * 2 ** 30);
  assert.ok(calls.every(c => c.includes('list') || c[0] === 'auth'));
});
