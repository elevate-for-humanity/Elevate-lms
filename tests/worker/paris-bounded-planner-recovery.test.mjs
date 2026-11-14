import test from 'node:test';
import assert from 'node:assert/strict';
import {canResumePlannerInspectionRepair} from '../../lib/ai/runtime/code-repair-policy.mjs';
const base={status:'blocked',attempt_count:1,source_job_id:null,release_sha:null,candidate:{kind:'planner-checkpoint'},attempt_history:[],verification:{},error_code:'PARIS_PATCH_FAILED: PARIS_PLANNER_REPEATED_INSPECTION'};
test('one source-free planner failure can recover without resetting attempts',()=>assert.equal(canResumePlannerInspectionRepair(base),true));
test('retired, released, already-retried or exhausted records stay blocked',()=>{
 for(const patch of [{attempt_count:2},{release_sha:'release'},{candidate:{branch:{sha:'sha'}}},{verification:{reconciliation:{replay:false}}},{attempt_history:[{retryReason:'planner-inspection-fix'}]}])
  assert.equal(canResumePlannerInspectionRepair({...base,...patch}),false,JSON.stringify(patch));
});

test('one source-linked planner failure can enter source-verified retry path without resetting attempts',()=>{
 const linked={...base,source_job_id:'course-media-job'};
 assert.equal(canResumePlannerInspectionRepair(linked),true);
 assert.equal(canResumePlannerInspectionRepair({...linked,attempt_history:[{retryReason:'planner-inspection-fix'}]}),false);
});
