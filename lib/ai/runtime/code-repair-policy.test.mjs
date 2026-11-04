import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibleRepairEvents,validationPassed,repairDeploymentState,repairFingerprint,canRetryRepair,canRetryHealthyProviderRepair,canResumeLegacyCpuEdit,canResumeContextBudgetRepair,nextRepairDeployment,courseDefectDisposition} from './code-repair-policy.mjs';
const event=(status,category='quality',time=1)=>({operation:'video.render',status,failure_category:category,created_at:new Date(time*1000).toISOString()});
test('context-budget recovery is once-only and never resumes written, released or retired repairs',()=>{
 const repair={status:'blocked',attempt_count:2,error_code:'PARIS_PATCH_FAILED: PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT'};
 assert.equal(canResumeContextBudgetRepair(repair),true);
 for(const change of [{attempt_count:3},{status:'queued'},{release_sha:'release'},{candidate:{branch:{sha:'written'}}},{verification:{reconciliation:{replay:false}}},{attempt_history:[{retryReason:'bounded-context-budget-recovery'}]},{error_code:'PARIS_PATCH_FAILED: authentication_failed'}])
  assert.equal(canResumeContextBudgetRepair({...repair,...change}),false);
 const checkpoint={writes:0,commits:[],changedFiles:[],headSha:'base',baseSha:'base'};
 assert.equal(canResumeContextBudgetRepair({...repair,candidate:{kind:'planner-checkpoint',checkpoint}}),true);
 for(const change of [{writes:1},{commits:['commit']},{changedFiles:['file']},{headSha:'written'},{complete:true}])
  assert.equal(canResumeContextBudgetRepair({...repair,candidate:{kind:'planner-checkpoint',checkpoint:{...checkpoint,...change}}}),false);
});
test('the first unresolved quality/code failure triggers repair; billing, credentials and recovered incidents do not',()=>{
 assert.equal(eligibleRepairEvents([event('failed'),event('failed'),event('failed')]).length,1);
 assert.equal(eligibleRepairEvents([event('failed')]).length,1);
 assert.equal(eligibleRepairEvents([event('failed','quality',1),event('failed','billing',2)]).length,0);
 assert.equal(eligibleRepairEvents([event('failed','quality',1),event('failed','auth',2)]).length,0);
 for(const events of [[event('failed','billing'),event('failed','billing'),event('failed','billing')],[event('failed'),event('failed'),event('failed'),event('completed','quality',2)]])assert.equal(eligibleRepairEvents(events).length,0);
});
test('queued or skipped validation cannot authorize publication',()=>{
 for(const conclusion of ['failure','skipped',null])assert.equal(validationPassed([{name:'validate',status:'completed',conclusion}]),false);
 assert.equal(validationPassed([{name:'validate',status:'completed',conclusion:'success'}]),true);
});
test('a recovered incident cannot supply failures for a new repair',()=>{
 const history=[event('failed','quality',1),event('failed','quality',2),event('failed','quality',3),event('completed','quality',4)];
 assert.equal(eligibleRepairEvents([...history,event('failed','quality',5)]).length,1);
 assert.equal(eligibleRepairEvents([...history,event('failed','quality',5),event('failed','quality',6)]).length,1);
 assert.equal(eligibleRepairEvents([...history,event('failed','quality',5),event('failed','quality',6),event('failed','quality',7)]).length,1);
});
test('push dispatch success and an unrelated commit never count as deployed repair',()=>{
 const names=['Deploy Admin','Deploy LMS automatically on Google','Deploy Google Marketing on trigger','Deploy Google Course Builder on source changes'];
 const runs=names.map(name=>({name,head_sha:'a',event:'workflow_dispatch',status:'completed',conclusion:'success'}));
 assert.equal(repairDeploymentState(runs,'a'),'passed');
 assert.equal(repairDeploymentState(runs,'b'),'pending');
 assert.equal(repairDeploymentState(runs.map(r=>({...r,event:'push'})),'a'),'pending');
 assert.equal(repairDeploymentState(runs.map((r,i)=>i? r:{...r,conclusion:'failure'}),'a'),'failed');
 for(const conclusion of ['cancelled','timed_out','skipped'])assert.equal(repairDeploymentState(runs.map((r,i)=>i?r:{...r,conclusion}),'a'),'failed');
 assert.notEqual(repairFingerprint('render','quality','a'),repairFingerprint('render','quality','b'));
});

test('failed patch validation has one evidence-based retry; deployed or protected failures never replay',()=>{
 const repair={status:'blocked',attempt_count:1,candidate:{branch:{sha:'a'}},error_code:'PATCH_OR_VALIDATION_FAILED_SEE_WORKFLOW'};
 assert.equal(canRetryRepair(repair),true);
 for(const change of [{attempt_count:2},{release_sha:'deployed'},{error_code:'PARIS_GITHUB_HTTP_403'},{candidate:null},{status:'validating'}])assert.equal(canRetryRepair({...repair,...change}),false);
});

test('only bounded unclaimed dispatch failures can retry without a patch candidate',()=>{
 const repair={status:'blocked',attempt_count:1,candidate:null,release_sha:null};
 assert.equal(canRetryRepair({...repair,error_code:'REPAIR_DISPATCH_FAILED'}),true);
 assert.equal(canRetryRepair({...repair,error_code:'REPAIR_DISPATCH_NOT_CLAIMED'}),true);
 assert.equal(canRetryRepair({...repair,error_code:'PARIS_GITHUB_HTTP_403'}),false);
 assert.equal(canRetryRepair({...repair,attempt_count:2,error_code:'REPAIR_DISPATCH_FAILED'}),false);
});

test('repairs deploy one service at a time and never repeat an accepted dispatch',()=>{
 assert.equal(nextRepairDeployment([],'sha',[]),'deploy-admin.yml');
 assert.equal(nextRepairDeployment([],'sha',['deploy-admin.yml']),null);
 const admin={name:'Deploy Admin',head_sha:'sha',event:'workflow_dispatch',status:'in_progress',conclusion:null};
 assert.equal(nextRepairDeployment([admin],'sha',[]),null);
 assert.equal(nextRepairDeployment([{...admin,status:'completed',conclusion:'success'}],'sha',['deploy-admin.yml']),'deploy-google-lms-trigger.yml');
});

test('PARIS retains unresolved code defects across new worker leases without bypassing completion',()=>{
 const source={id:'old',build_id:'build',status:'failed',last_error:'ULTIMATE_VIDEO_RENDER_FAILED:PICTURE_CUE_NOT_ALIGNED_TO_SPEECH'};
 const latest={id:'new',build_id:'build',status:'running'};
 const build={id:'build',status:'running',profile:{ownerPaused:false},findings:[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'PICTURE_CUE_NOT_ALIGNED_TO_SPEECH'}]};
 assert.equal(courseDefectDisposition({source,latest,build}),'repair');
 assert.equal(courseDefectDisposition({source,latest:{...latest,status:'completed'},build}),'resolved');
 assert.equal(courseDefectDisposition({source,latest,build:{...build,findings:[]}}),'resolved');
 assert.equal(courseDefectDisposition({source,latest,build:{...build,status:'published'}}),'blocked');
 assert.equal(courseDefectDisposition({source,latest,build:{...build,profile:{ownerPaused:true}}}),'blocked');
 assert.equal(courseDefectDisposition({source,latest:{...latest,build_id:'another'},build}),'blocked');
});

test('owned model timeout recovery is bounded and never retries source-linked or retired repairs',()=>{
 const base={status:'blocked',attempt_count:1,source_job_id:null,release_sha:null,candidate:null,
  error_code:'PARIS_PATCH_FAILED: Configured AI provider "elevate" failed; repair that provider before retrying: The operation was aborted due to timeout'};
 assert.equal(canRetryHealthyProviderRepair(base),true);
 // Source-linked retries require a separate live stage/build/owner fence.
 assert.equal(canRetryHealthyProviderRepair({...base,source_job_id:'job-id'}),true);
 for (const reason of [
  'Owned model connection is unavailable. Verify the selected private CPU endpoint before retrying.',
  'OWNED_MODEL_TEMPORARILY_UNAVAILABLE:request_failed',
 ]) assert.equal(canRetryHealthyProviderRepair({...base,error_code:'PARIS_PATCH_FAILED: '+reason}),true);
 assert.equal(canRetryHealthyProviderRepair({...base,error_code:'PARIS_PATCH_FAILED: OWNED_MODEL_NOT_READY:authentication_failed'}),false);
 for(const change of [
  {attempt_count:2},{status:'queued'},
  {release_sha:'deployed'},{candidate:{branch:{sha:'candidate'}}},
  {verification:{reconciliation:{replay:false}}},{error_code:'PARIS_PATCH_FAILED: GitHub code search failed: 401'},
 ]){
  assert.equal(canRetryHealthyProviderRepair({...base,...change}),false);
 }
});

test('the reduced CPU edit budget can resume only an unmodified legacy checkpoint with its own timed-out model call',()=>{
 const checkpoint={writes:0,commits:[],changedFiles:[],headSha:'base',baseSha:'base',nextTurn:6,observations:['READ lib/example.ts']};
 const repair={id:'repair',status:'blocked',attempt_count:2,candidate:{kind:'planner-checkpoint',checkpoint},
  error_code:'PARIS_PATCH_FAILED: Configured AI provider "elevate" failed; repair that provider before retrying: The operation was aborted due to timeout',
  verification:{providerRecoveryPreflight:{ownedModelVerified:true,githubRepositoryRead:true,workflowEnabled:true,checkedAt:'2026-11-03T10:00:00Z'}}};
 const timeout={operation:'ai.chat',status:'failed',provider:'elevate',failure_category:'transient',duration_ms:211000,correlation_id:'repair',created_at:'2026-11-03T10:08:00Z'};
 assert.equal(canResumeLegacyCpuEdit(repair,[timeout],'cpu'),true);
 for(const change of [{attempt_count:3},{source_job_id:'job'},{release_sha:'release'},{verification:{}},{status:'patching'}])
  assert.equal(canResumeLegacyCpuEdit({...repair,...change},[timeout],'cpu'),false);
 for(const change of [{boundedCpuEdits:true},{nextTurn:14},{complete:true},{commits:['commit']},{writes:1},{changedFiles:['file']},{headSha:'new'}])
  assert.equal(canResumeLegacyCpuEdit({...repair,candidate:{...repair.candidate,checkpoint:{...checkpoint,...change}}},[timeout],'cpu'),false);
 for(const change of [{duration_ms:1},{provider:'other'},{failure_category:'auth'},{correlation_id:'unrelated'},{created_at:'2026-11-03T09:00:00Z'}])
  assert.equal(canResumeLegacyCpuEdit(repair,[{...timeout,...change}],'cpu'),false);
 assert.equal(canResumeLegacyCpuEdit(repair,[timeout],'gpu'),false);
});
