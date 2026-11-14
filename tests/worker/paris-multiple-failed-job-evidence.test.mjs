import test from 'node:test';
import assert from 'node:assert/strict';
import {bindVerifiedFailedWorkflowInspection} from '../../lib/devstudio/paris-workflow-target.mjs';
const runId=42156591255;
const task='Diagnose failed production release 42156591255. Failed checks include several jobs.';
const run={head_branch:'main',status:'completed',conclusion:'failure'};
const inventory={total_count:4,jobs:[
 {id:127694806127,run_id:runId,conclusion:'failure'},
 {id:127694806238,run_id:runId,conclusion:'failure'},
 {id:127696876316,run_id:runId,conclusion:'failure'},
 {id:127694800000,run_id:runId,conclusion:'success'},
]};
const search={type:'search',query:'failed HTTP request in ApiClient'};
test('a multi-failure release inspects each real failed job once before broad search',async()=>{
 const history=[];
 for(const id of [127694806127,127694806238,127696876316]){
  const action=await bindVerifiedFailedWorkflowInspection(task,search,history,async()=>run,async()=>inventory);
  assert.deepEqual(action,{type:'workflow_log',runId,jobId:id});
  history.push(`workflow_log:${runId}:${id}`);
 }
 assert.equal(await bindVerifiedFailedWorkflowInspection(task,search,history,async()=>run,async()=>inventory),search);
});
test('a guessed workflow log is replaced by authenticated evidence, never another guessed ID',async()=>{
 const guessed={type:'workflow_log',runId:127694806127,jobId:127694806238};
 assert.deepEqual(await bindVerifiedFailedWorkflowInspection(task,guessed,[],async id=>{
  assert.equal(id,runId);return run;
 },async()=>inventory),{type:'workflow_log',runId,jobId:127694806127});
});
test('jobs belonging to a different run and successful jobs never become failure evidence',async()=>{
 const wrong={total_count:2,jobs:[{id:1,run_id:999,conclusion:'failure'},{id:2,run_id:runId,conclusion:'success'}]};
 assert.equal(await bindVerifiedFailedWorkflowInspection(task,search,[],async()=>run,async()=>wrong),search);
});
test('a truncated job inventory cannot bind partial evidence',async()=>{
 assert.equal(await bindVerifiedFailedWorkflowInspection(task,search,[],async()=>run,
  async()=>({...inventory,total_count:101})),search);
});
