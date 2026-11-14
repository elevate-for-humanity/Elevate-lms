import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retryRepairInference} from '../../lib/devstudio/repair-inference-retry.mjs';

function clock() {
  const state={time:0, waits:[], budgets:[], signals:[]};
  const options={timeoutMs:210000,now:()=>state.time,
    sleep:async ms=>{state.waits.push(ms);state.time+=ms;},
    createSignal:ms=>{state.budgets.push(ms);const signal=new AbortController().signal;state.signals.push(signal);return signal;}};
  return {state,options};
}
test('transient retries use distinct signals within one diminishing deadline',async()=>{
  const {state,options}=clock();let calls=0;
  assert.equal(await retryRepairInference(async()=>{state.time+=1000;if(++calls===1)throw Error('HTTP 502');return 'actual result';},options),'actual result');
  assert.deepEqual(state.budgets,[210000,204000]);
  assert.notEqual(state.signals[0],state.signals[1]);
});
test('expired inference is not retried with an already-aborted signal',async()=>{
  const {state,options}=clock();let calls=0;
  await assert.rejects(retryRepairInference(async()=>{calls++;state.time+=210000;throw Error('The operation was aborted due to timeout');},options),/PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE/);
  assert.equal(calls,1);assert.deepEqual(state.waits,[]);
});
test('open circuit waits for its provider cooldown without resetting the circuit',async()=>{
  const {state,options}=clock();let calls=0;
  assert.equal(await retryRepairInference(async()=>{if(++calls===1)throw Error('Configured AI provider "elevate" failed; Circuit "ai:elevate" is open. Retry after 30s.');return 'recovered';},options),'recovered');
  assert.deepEqual(state.waits,[30000]);assert.deepEqual(state.budgets,[210000,180000]);
});
test('cooldown outside the remaining request budget defers without another call',async()=>{
  const {state,options}=clock();let calls=0;
  await assert.rejects(retryRepairInference(async()=>{calls++;state.time+=190000;throw Error('Circuit "ai:elevate" is open. Retry after 30s.');},options),/PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE/);
  assert.equal(calls,1);assert.deepEqual(state.waits,[]);
});
test('authorization and paid-inference errors remain terminal and unchanged',async()=>{
  for(const message of ['HTTP 403','PARIS_INFERENCE_DENIED','PARIS_INFERENCE_RESULT_REQUIRED']){
    const {state,options}=clock();const error=Error(message);
    await assert.rejects(retryRepairInference(async()=>{throw error;},options),actual=>actual===error);
    assert.deepEqual(state.waits,[]);
  }
});
test('persistent transient failures stop after the bounded retries',async()=>{
  const {state,options}=clock();let calls=0;
  await assert.rejects(retryRepairInference(async()=>{calls++;throw Error('HTTP 503');},options),/PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE/);
  assert.equal(calls,4);assert.deepEqual(state.waits,[5000,5000,5000]);
});
test('controller checkpoints exhausted inference and still requires paid authorization and committed deliverables',()=>{
  const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
  assert.match(source,/aiChat\(\{\.\.\.inferenceOptions,signal\}\)/);
  assert.match(source,/timeoutMs: REPAIR_INFERENCE_TIMEOUT_MS/);
  assert.match(source,/executePaidInference\(\{db,authorize:\(\)=>reservePaidInference/);
  assert.match(source,/if \(!\(error instanceof Error\).*error\.message !== 'PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE'\) throw error;\s*await checkpoint\(\);/);
  assert.match(source,/Internal engineering finished without a verifiable repository change/);
});
