import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibleRepairEvents,validationPassed,repairDeploymentState,repairFingerprint,canRetryRepair} from './code-repair-policy.mjs';
const event=(status,category='quality',time=1)=>({operation:'video.render',status,failure_category:category,created_at:new Date(time*1000).toISOString()});
test('only recurring unresolved quality/code failures trigger repair; billing, credentials and recovered incidents do not',()=>{
 assert.equal(eligibleRepairEvents([event('failed'),event('failed'),event('failed')]).length,1);
 for(const events of [[event('failed')],[event('failed','billing'),event('failed','billing'),event('failed','billing')],[event('failed'),event('failed'),event('failed'),event('completed','quality',2)]])assert.equal(eligibleRepairEvents(events).length,0);
});
test('queued or skipped validation cannot authorize publication',()=>{
 for(const conclusion of ['failure','skipped',null])assert.equal(validationPassed([{name:'validate',status:'completed',conclusion}]),false);
 assert.equal(validationPassed([{name:'validate',status:'completed',conclusion:'success'}]),true);
});
test('push dispatch success and an unrelated commit never count as deployed repair',()=>{
 const names=['Deploy Admin','Deploy LMS automatically on Google','Deploy Google Marketing on trigger','Deploy Google Course Builder on source changes'];
 const runs=names.map(name=>({name,head_sha:'a',event:'workflow_dispatch',status:'completed',conclusion:'success'}));
 assert.equal(repairDeploymentState(runs,'a'),'passed');
 assert.equal(repairDeploymentState(runs,'b'),'pending');
 assert.equal(repairDeploymentState(runs.map(r=>({...r,event:'push'})),'a'),'pending');
 assert.equal(repairDeploymentState(runs.map((r,i)=>i? r:{...r,conclusion:'failure'}),'a'),'failed');
 assert.notEqual(repairFingerprint('render','quality','a'),repairFingerprint('render','quality','b'));
});

test('failed patch validation has one evidence-based retry; deployed or protected failures never replay',()=>{
 const repair={status:'blocked',attempt_count:1,candidate:{branch:{sha:'a'}},error_code:'PATCH_OR_VALIDATION_FAILED_SEE_WORKFLOW'};
 assert.equal(canRetryRepair(repair),true);
 for(const change of [{attempt_count:2},{release_sha:'deployed'},{error_code:'PARIS_GITHUB_HTTP_403'},{candidate:null},{status:'validating'}])assert.equal(canRetryRepair({...repair,...change}),false);
});
