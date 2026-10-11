import test from 'node:test';
import assert from 'node:assert/strict';
import { runWorkerLoop } from './worker-loop.mjs';
const options = processJob => ({ processJob, delay: async () => {}, isStopping: () => false, once: true });
test('finite task exits on empty queue without polling forever', async () => {
  let calls = 0;
  const result = await runWorkerLoop(options(async () => { calls++; return { claimed: false }; }));
  assert.equal(calls, 1); assert.equal(result.claimed, false);
});
test('completed lesson and durable continuation finish one task', async () => {
  for (const result of [{claimed:true, completed:true}, {claimed:true, completed:false, continuing:true}]) {
    assert.equal(await runWorkerLoop(options(async () => result)), result);
  }
});
test('repair or failed processing cannot report a successful Google task', async () => {
  for (const result of [{claimed:true, completed:false, repairQueued:true}, {claimed:true, completed:false, error:'render failed'}]) {
    await assert.rejects(runWorkerLoop(options(async () => result)), /ULTIMATE_TASK_INCOMPLETE/);
  }
});
test('claim errors propagate in finite mode', async () => {
  await assert.rejects(runWorkerLoop(options(async () => { throw new Error('claim failed'); })), /claim failed/);
});
test('queued continuation cannot hide a failed lesson or retry it in the same task', async () => {
  let calls = 0;
  await assert.rejects(runWorkerLoop(options(async () => {
    calls++;
    return { claimed: true, completed: false, continuing: true,
      result: { findings: [{ severity: 'error', code: 'STORYBOARD_SCRIPT_MAPPING_REQUIRED' }] } };
  })), /ULTIMATE_TASK_REPAIR_REQUIRED/);
  assert.equal(calls, 1);
});
test('a warning-only completed lesson retains its durable continuation', async () => {
  const result = { claimed: true, completed: false, continuing: true,
    result: { findings: [{ severity: 'warning' }] } };
  assert.equal(await runWorkerLoop(options(async () => result)), result);
});
test('continuous mode retries poll errors and keeps polling until stopped', async () => {
  let calls=0, delays=0, stop=false;
  await runWorkerLoop({ processJob:async()=>{calls++;if(calls===1)throw new Error('transient');stop=true;return {claimed:true,completed:true};}, delay:async()=>{delays++;}, isStopping:()=>stop });
  assert.equal(calls,2);assert.equal(delays,1);
});
