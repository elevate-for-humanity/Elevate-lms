import test from 'node:test';
import assert from 'node:assert/strict';
import {REPAIR_DEPLOYMENTS,repairDeploymentState,nextRepairDeployment} from './code-repair-policy.mjs';
const sha='a'.repeat(40);
test('release observation uses canonical workflow paths even when execution titles change',()=>{
 const runs=REPAIR_DEPLOYMENTS.map((d,i)=>({id:i+1,path:'.github/workflows/'+d.workflow,name:'Execute release '+sha,head_sha:sha,event:'workflow_dispatch',status:'completed',conclusion:'success'}));
 assert.equal(repairDeploymentState(runs,sha),'passed');assert.equal(nextRepairDeployment(runs,sha),null);
});
test('another workflow cannot impersonate a release through its display name',()=>{
 const d=REPAIR_DEPLOYMENTS[0];
 const run={path:'.github/workflows/unrelated.yml',name:d.name,head_sha:sha,event:'workflow_dispatch',status:'completed',conclusion:'success'};
 assert.equal(repairDeploymentState([run],sha),'pending');assert.equal(nextRepairDeployment([run],sha),d.workflow);
});
test('a request-only push run cannot count as deployed despite a matching workflow path',()=>{
 const runs=REPAIR_DEPLOYMENTS.map(d=>({path:'.github/workflows/'+d.workflow,name:d.name,head_sha:sha,event:'push',status:'completed',conclusion:'success'}));
 assert.equal(repairDeploymentState(runs,sha),'pending');
});
