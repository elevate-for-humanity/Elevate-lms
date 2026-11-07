import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordFailedRepairWorkflow,repairDispatchValues} from '../../lib/ai/runtime/repair-workflow-reconciliation.mjs';
import {classifyParisPhaseError} from '../../lib/devstudio/paris-phase-error.mjs';

const at='2026-11-07T17:14:29Z';
test('a claim conflict reports its actual state instead of an upstream HTTP 502',()=>{
 assert.deepEqual(classifyParisPhaseError(new Error('REPAIR_ALREADY_CLAIMED')),
  {errorCode:'REPAIR_ALREADY_CLAIMED',status:409});
});
test('dispatch retires the previous run before a new workflow can claim the retry',()=>{
 const prior={attempt_count:2,workflow_run_id:42388314796,
  attempt_history:[{retryReason:'zero-write-planner-v2'}]};
 const values=repairDispatchValues(prior,at);
 assert.equal(values.status,'dispatched');assert.equal(values.attempt_count,3);
 assert.equal(values.workflow_run_id,null);assert.equal(values.error_code,null);
 assert.deepEqual(values.attempt_history[0],prior.attempt_history[0]);
 assert.deepEqual(values.attempt_history[1],{event:'prior-workflow-association-retired',runId:42388314796,attempt:2,at});
 assert.equal(prior.workflow_run_id,42388314796);assert.equal(prior.attempt_history.length,1);
});
test('first dispatch retains history without fabricating an earlier workflow',()=>{
 const values=repairDispatchValues({attempt_count:0,workflow_run_id:null,attempt_history:[]},at);
 assert.equal(values.attempt_count,1);assert.deepEqual(values.attempt_history,[]);
 assert.equal(values.dispatched_at,at);assert.equal(values.updated_at,at);
});
test('a dispatched retry cannot be blocked by the previous failed workflow before claim',async()=>{
 let touched=false;const db={from(){touched=true;throw Error('unexpected write')}};
 assert.equal(await recordFailedRepairWorkflow(db,{id:'repair',status:'dispatched',workflow_run_id:42388314796},
  {id:42388314796,status:'completed',conclusion:'failure'}),false);
 assert.equal(touched,false);
});
test('malformed attempt history is never erased to launch a new attempt',()=>{
 assert.throws(()=>repairDispatchValues({attempt_count:2,attempt_history:{}},at),/HISTORY/);
 assert.throws(()=>repairDispatchValues({attempt_count:-1,attempt_history:[]},at),/ATTEMPT/);
});
test('the production compare-and-swap uses the new dispatch payload and reads the prior association',()=>{
 const code=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
 assert.match(code,/select\('id,attempt_count,source_job_id,attempt_history,workflow_run_id'\)/);
 assert.match(code,/update\(repairDispatchValues\(pending\)\)\.eq\('id',pending.id\)\.eq\('status','queued'\)\.eq\('attempt_count',pending.attempt_count\)/);
});
