import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoActiveExecutions, executeCourseJob } from './execute-course-job.mjs';
import { readFileSync } from 'node:fs';

test('blocks running and pending executions before dispatch', () => {
  for (const status of [{}, { conditions: [{ type: 'Completed', status: 'Unknown' }] }]) {
    assert.throws(() => assertNoActiveExecutions([{ status }]), /ALREADY_ACTIVE/);
  }
  assert.throws(() => assertNoActiveExecutions(null), /INVALID/);
});

function fixture() {
  const calls = [];
  return { calls, run: args => {
    calls.push(args);
    if (args.includes('executions')) return '[]';
    if (args.includes('describe')) return JSON.stringify({spec:{template:{spec:{template:{spec:{containers:[{resources:{limits:{cpu:'4',memory:'8Gi'}}}]}}}}}});
    if (args.includes('execute')) return '{}';
    throw Error('Unexpected operation');
  }};
}
test('insufficient regional capacity never starts the direct course task', async () => {
  const f = fixture();
  await assert.rejects(executeCourseJob({run:f.run, capacityCheck:async ({region,task,taskCount}) => {
    assert.equal(region, 'us-central1'); assert.equal(taskCount, 1);
    assert.equal(task.containers[0].resources.limits.memory, '8Gi');
    return {fits:false};
  }}), /REGIONAL_CAPACITY_UNAVAILABLE/);
  assert.equal(f.calls.some(args=>args.includes('execute')),false);
});
test('quota-read failures never start a task', async () => {
  const f = fixture();
  await assert.rejects(executeCourseJob({run:f.run,capacityCheck:async()=>{throw Error('quota unavailable');}}),/quota unavailable/);
  assert.equal(f.calls.some(args=>args.includes('execute')),false);
});
test('rechecks overlap after the capacity read and before execution', async () => {
  const f = fixture(); let checked=false;
  await assert.rejects(executeCourseJob({run:args=>checked&&args.includes('executions')?'[{"status":{}}]':f.run(args),
    capacityCheck:async()=>{checked=true;return {fits:true};}}),/ALREADY_ACTIVE/);
  assert.equal(f.calls.some(args=>args.includes('execute')),false);
});
test('verified capacity permits exactly one finite task', async () => {
  const f = fixture();
  await executeCourseJob({run:f.run,capacityCheck:async()=>({fits:true})});
  const launches=f.calls.filter(args=>args.includes('execute'));
  assert.equal(launches.length,1);
  assert.ok(launches[0].includes('--tasks=1'));
  assert.ok(launches[0].includes('--wait'));
});
test('scheduled and direct dispatchers share the worker deployment lane', () => {
  for(const file of ['dispatch-google-course-queue.yml','dispatch-google-course-job.yml','execute-google-course-job.yml','deploy-google-course-job.yml']) {
    const source=readFileSync(new URL('../../.github/workflows/'+file,import.meta.url),'utf8');
    assert.match(source,/group: google-course-runtime-operations\s+cancel-in-progress: false/);
  }
});
test('permits an empty history and terminal failed or successful tasks', () => {
  assertNoActiveExecutions([]);
  assertNoActiveExecutions([{ status: { completionTime: '2026-10-06T10:00:00Z' } }]);
  for (const status of ['True', 'False']) {
    assertNoActiveExecutions([{ status: { conditions: [{ type: 'Completed', status }] } }]);
  }
});
