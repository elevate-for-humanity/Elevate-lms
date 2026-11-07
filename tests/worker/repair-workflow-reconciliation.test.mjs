import test from 'node:test';
import assert from 'node:assert/strict';
import {recordFailedRepairWorkflow} from '../../lib/ai/runtime/repair-workflow-reconciliation.mjs';

function database(row) {
  const state={...row};
  return {state,from(table){
    assert.equal(table,'paris_code_repairs');
    return {update(values){
      const filters=[];
      const query={eq(key,value){filters.push([key,value]);return query;},select(){return query;},
        async maybeSingle(){
          if(!filters.every(([key,value])=>state[key]===value))return {data:null,error:null};
          Object.assign(state,values);return {data:{id:state.id},error:null};
        }};
      return query;
    }};
  }};
}
const snapshot={id:'repair',status:'patching',updated_at:'2026-11-07T14:10:00Z'};
const failed={status:'completed',conclusion:'failure'};
test('a late failed-workflow observation preserves a newer precise planner diagnosis',async()=>{
  const db=database({...snapshot,status:'blocked',updated_at:'2026-11-07T14:11:00Z',error_code:'PARIS_PATCH_FAILED: PARIS_PLANNER_REPEATED_INSPECTION'});
  assert.equal(await recordFailedRepairWorkflow(db,snapshot,failed),false);
  assert.equal(db.state.error_code,'PARIS_PATCH_FAILED: PARIS_PLANNER_REPEATED_INSPECTION');
});
test('matching active snapshot records an actual failure, while a newer same-state checkpoint survives',async()=>{
  const db=database(snapshot);
  assert.equal(await recordFailedRepairWorkflow(db,snapshot,failed),true);
  assert.equal(db.state.error_code,'REPAIR_WORKFLOW_failure');
  const changed=database({...snapshot,updated_at:'2026-11-07T14:11:00Z'});
  assert.equal(await recordFailedRepairWorkflow(changed,snapshot,failed),false);
  assert.equal(changed.state.status,'patching');
});
test('a successful or active workflow cannot block a repair',async()=>{
  for(const run of [{status:'completed',conclusion:'success'},{status:'in_progress',conclusion:null}]) {
    const db=database(snapshot);
    assert.equal(await recordFailedRepairWorkflow(db,snapshot,run),false);
    assert.equal(db.state.status,'patching');
  }
});
