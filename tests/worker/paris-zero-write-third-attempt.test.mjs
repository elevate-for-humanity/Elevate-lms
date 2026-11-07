import test from 'node:test';
import assert from 'node:assert/strict';
import {canResumeZeroWritePlannerRepair,canDispatchParisRepairAttempt} from '../../lib/ai/runtime/code-repair-policy.mjs';

const sha='a'.repeat(40);
const base={
 status:'blocked',attempt_count:2,source_job_id:null,release_sha:null,
 candidate:{kind:'planner-checkpoint',checkpoint:{
  complete:false,writes:0,commits:[],changedFiles:[],baseSha:sha,headSha:sha,
  branch:'studio/verified-source-free',nextTurn:1
 }},
 attempt_history:[],verification:{},
 error_code:'PARIS_PATCH_FAILED: PARIS_PLANNER_REPEATED_INSPECTION'
};

test('only an entirely unwritten source-free planner may be released once',()=>{
 assert.equal(canResumeZeroWritePlannerRepair(base),true);
 for(const patch of [
  {attempt_count:1},{attempt_count:3},{source_job_id:'source-job'},
  {release_sha:sha},{verification:{reconciliation:{replay:false}}},
  {candidate:{kind:'planner-checkpoint',checkpoint:{...base.candidate.checkpoint,writes:1}}},
  {candidate:{kind:'planner-checkpoint',checkpoint:{...base.candidate.checkpoint,headSha:'b'.repeat(40)}}},
  {candidate:{kind:'planner-checkpoint',checkpoint:{...base.candidate.checkpoint,commits:[sha]}}},
  {candidate:{kind:'planner-checkpoint',checkpoint:{...base.candidate.checkpoint,changedFiles:['lib/x.ts']}}},
  {attempt_history:[{retryReason:'zero-write-planner-v2'}]},
  {error_code:'PARIS_PATCH_FAILED: Internal engineering finished without a verifiable repository change.'}
 ]) assert.equal(canResumeZeroWritePlannerRepair({...base,...patch}),false,JSON.stringify(patch));
});

test('third dispatch is only allowed with a durable recovery receipt',()=>{
 assert.equal(canDispatchParisRepairAttempt({...base,attempt_history:[]}),false);
 assert.equal(canDispatchParisRepairAttempt({...base,attempt_history:[{retryReason:'zero-write-planner-v2'}]}),true);
 assert.equal(canDispatchParisRepairAttempt({...base,source_job_id:'course-job',attempt_history:[{retryReason:'zero-write-planner-v2'}]}),false);
 assert.equal(canDispatchParisRepairAttempt({...base,attempt_count:3,attempt_history:[{retryReason:'zero-write-planner-v2'}]}),false);
});

test('deadline exhaustion is eligible only with untouched checkpoint',()=>{
 assert.equal(canResumeZeroWritePlannerRepair({...base,error_code:'PARIS_PATCH_FAILED: PARIS_REPAIR_PLANNING_DEADLINE_REACHED'}),true);
});
