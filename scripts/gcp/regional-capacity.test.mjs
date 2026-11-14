import test from 'node:test';
import assert from 'node:assert/strict';
import { requiredRegionalAllocation, inspectRegionalCapacity, executionAllocationCount } from './regional-capacity.mjs';

const container = (cpu, memory) => ({ resources: { limits: { cpu, memory } } });
const task = { containers: [container('8', '32Gi')] };
const service = { metadata: { name: 'marketing' }, spec: { template: {
  metadata: { annotations: { 'autoscaling.knative.dev/maxScale': '2' } },
  spec: { containers: [container('1', '2Gi')] },
} }, status: { traffic: [{ revisionName: 'serving', percent: 100 }] } };
const revision = (name = 'serving') => ({ metadata: { name, labels: { 'serving.knative.dev/service': 'marketing' },
  annotations: { 'autoscaling.knative.dev/maxScale': '1' } }, spec: { containers: [container('4', '8Gi')] } });

test('new execution memory covers the complete requested task batch', () => {
  assert.deepEqual(requiredRegionalAllocation([], task, [], [], 2), {cpu:16000,memory:64*2**30});
  for(const count of [0,-1,1.5,5,NaN])
    assert.throws(()=>requiredRegionalAllocation([],task,[],[],count),/between one and four/);
});

test('uses the serving immutable revision instead of an unapplied smaller template', () => {
  assert.deepEqual(requiredRegionalAllocation([service], task, [revision()]), { cpu: 12000, memory: 40 * 2 ** 30 });
});
test('includes tagged candidates once, even when they also have traffic', () => {
  const s = structuredClone(service);
  s.status.traffic.push({ revisionName: 'serving', tag: 'live' }, { revisionName: 'candidate', tag: 'candidate' });
  assert.deepEqual(requiredRegionalAllocation([s], task, [revision(), revision('candidate')]), { cpu: 16000, memory: 48 * 2 ** 30 });
});
test('ignores historical active revisions without traffic or tags', () => {
  const old = revision('historical');
  old.status = { conditions: [{type:'Active',status:'True'}] };
  old.spec.containers = [container('8','16Gi')];
  assert.deepEqual(requiredRegionalAllocation([service], task, [revision(), old]), {
    cpu: 12000, memory: 40 * 2 ** 30,
  });
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
    if (command === 'run revisions describe' && args[3] === 'serving') return JSON.stringify(revision());
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
  assert.ok(calls.every(c => c.includes('list') || c.includes('describe') || c[0] === 'auth'));
});

test('describes each effective revision once and never reads historical revision inventory', async () => {
  const calls = [];
  const s = structuredClone(service);
  s.status.latestReadyRevisionName = 'serving';
  s.status.traffic = [
    { latestRevision: true, percent: 100 },
    { revisionName: 'serving', tag: 'live' },
    { revisionName: 'candidate', tag: 'candidate', percent: 0 },
    { revisionName: 'historical', percent: 0 },
  ];
  const run = args => {
    calls.push(args);
    const command = args.slice(0, 3).join(' ');
    if (command === 'run services list') return JSON.stringify([s]);
    if (command === 'run revisions describe') return JSON.stringify(revision(args[3]));
    if (command === 'run jobs list') return '[]';
    if (args[0] === 'auth') return 'fixture-token';
    throw Error('Unexpected inventory or mutation');
  };
  const request = async () => ({ ok: true, json: async () => ({ dimensionsInfos: [
    { dimensions: { region: 'us-east1' }, details: { value: '-1' } },
  ] }) });
  const result = await inspectRegionalCapacity({ region: 'us-east1', task, run, request });
  assert.equal(result.fits, true);
  assert.equal(result.required.memory, 48 * 2 ** 30);
  assert.deepEqual(calls.filter(c => c[1] === 'revisions').map(c => c.slice(0, 4)), [
    ['run', 'revisions', 'describe', 'serving'],
    ['run', 'revisions', 'describe', 'candidate'],
  ]);
  await assert.rejects(inspectRegionalCapacity({ region: 'us-east1', task, request,
    run: args => args[1] === 'revisions' ? (() => { throw Error('readback unavailable'); })() : run(args),
  }), /readback unavailable/);
});

test('completed tasks release their slots while pending tasks remain budgeted',()=>{
 assert.equal(executionAllocationCount({spec:{taskCount:3,parallelism:3},status:{succeededCount:1,runningCount:2}}),2);
 assert.equal(executionAllocationCount({spec:{taskCount:3,parallelism:2},status:{runningCount:0}}),2);
 assert.equal(executionAllocationCount({spec:{taskCount:3,parallelism:3},status:{succeededCount:1,failedCount:1,cancelledCount:1}}),0);
 assert.equal(executionAllocationCount({spec:{taskCount:3,parallelism:3},status:{retriedCount:2}}),3);
});
test('invalid task totals fail closed',()=>{
 for(const status of [{succeededCount:4},{failedCount:-1}])assert.throws(()=>executionAllocationCount({spec:{taskCount:3},status}),/allocation/);
});
test('regional budget retains only remaining slots of an active execution',()=>{
 const executions=[{spec:{taskCount:3,parallelism:3,template:{spec:{containers:[container('4','8Gi')]}}},status:{succeededCount:1,runningCount:2}}];
 assert.deepEqual(requiredRegionalAllocation([], {containers:[container('4','8Gi'),container('4','8Gi')]}, [],executions),{cpu:16000,memory:32*2**30});
});

test('service-wide maximum bounds a larger revision maximum',()=>{
 const s=structuredClone(service);s.metadata.annotations={'run.googleapis.com/maxScale':'1'};
 const r=revision();r.metadata.annotations['autoscaling.knative.dev/maxScale']='2';
 assert.deepEqual(requiredRegionalAllocation([s],task,[r]),{cpu:12000,memory:40*2**30});
});
test('a verified service-wide maximum bounds a revision without its own maximum',()=>{
 const s=structuredClone(service);s.metadata.annotations={'run.googleapis.com/maxScale':'1'};
 const r=revision();delete r.metadata.annotations;
 assert.deepEqual(requiredRegionalAllocation([s],task,[r]),{cpu:12000,memory:40*2**30});
});
test('invalid service-wide maximum never permits a launch budget',()=>{
 const s=structuredClone(service);s.metadata.annotations={'run.googleapis.com/maxScale':'invalid'};
 assert.throws(()=>requiredRegionalAllocation([s],task,[revision()]),/service maximum/);
});
