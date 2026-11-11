import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {failedCurrentReleases,queuedWorkflowRepairTarget,queuedWorkflowRepairDisposition} from './deployment-repair-events.mjs';
const sha='a'.repeat(40);
const failure={id:1,head_branch:'main',head_sha:sha,path:'.github/workflows/deploy-google-lms-trigger.yml',event:'workflow_dispatch',status:'completed',conclusion:'failure',run_started_at:'2026-11-04T19:40:00Z'};
test('a failed current release is actionable, unlike dispatch success, stale source or unrelated workflows',()=>{
 assert.deepEqual(failedCurrentReleases([failure],sha),[failure]);
 for(const change of [{head_branch:'feature'},{head_sha:'b'.repeat(40)},{path:'.github/workflows/untrusted.yml'},{event:'push'},{conclusion:'success'},{status:'in_progress',conclusion:null}])
  assert.deepEqual(failedCurrentReleases([{...failure,...change}],sha),[]);
 assert.deepEqual(failedCurrentReleases([failure],''),[]);
});
test('the actual latest release attempt supersedes a failure, but a push dispatcher cannot hide it',()=>{
 assert.deepEqual(failedCurrentReleases([failure,{...failure,id:2,event:'push',conclusion:'success'}],sha),[failure]);
 for(const update of [{conclusion:'success',status:'completed'},{conclusion:null,status:'in_progress'}])
  assert.deepEqual(failedCurrentReleases([failure,{...failure,...update,run_started_at:'2026-11-04T20:00:00Z'}],sha),[]);
});
test('the Course Builder push executes a real release and is monitored',()=>{
 const worker={...failure,event:'push',path:'.github/workflows/deploy-google-course-worker.yml'};
 assert.deepEqual(failedCurrentReleases([worker],sha),[worker]);
});
test('failed production verification and main CI enter repair; skipped notifications and PRs do not erase the evidence',()=>{
 for(const [path,event] of [['ci.yml','push'],['registered-apprenticeship-e2e.yml','workflow_run'],['verify-paris-production-authorization.yml','workflow_dispatch'],['deploy-google-store-runtime.yml','workflow_dispatch']]) {
  const run={...failure,path:'.github/workflows/'+path,event};
  assert.deepEqual(failedCurrentReleases([run,{...run,id:2,conclusion:'skipped'}],sha),[run]);
  assert.deepEqual(failedCurrentReleases([{...run,event:'pull_request'}],sha),[]);
 }
});

test('failed main integrity, predeploy and course authority gates create repairs, not PR failures',()=>{
 for(const workflow of ['integrity-gate.yml','predeploy-check.yml','course-factory-authority.yml','lockfile-check.yml']){
  const run={...failure,path:'.github/workflows/'+workflow,event:'push'};
  assert.deepEqual(failedCurrentReleases([run],sha),[run]);
  assert.deepEqual(failedCurrentReleases([{...run,event:'pull_request'}],sha),[]);
  assert.deepEqual(failedCurrentReleases([{...run,head_branch:'feature'}],sha),[]);
  assert.deepEqual(failedCurrentReleases([{...run,conclusion:'cancelled'}],sha),[]);
 }
});
test('a newer success or pending run suppresses an older failing gate',()=>{
 const run={...failure,path:'.github/workflows/integrity-gate.yml',event:'push'};
 for(const update of [
  {status:'completed',conclusion:'success'},
  {status:'in_progress',conclusion:null},
 ]){
  assert.deepEqual(failedCurrentReleases([run,{...run,...update,id:33,run_started_at:'2026-11-05T18:10:00Z'}],sha),[]);
 }
});

test('signed PARIS workflow wakes on main gate failures and scans beyond the first page',()=>{
 const workflow=readFileSync('.github/workflows/paris-code-repair.yml','utf8');
 const scanner=readFileSync('lib/ai/runtime/code-repair.ts','utf8');
 for(const name of ['Integrity Gate','Pre-deploy Check','Course Factory Authority Gate','Lockfile Integrity'])
  assert.ok(workflow.includes("'"+name+"'"));
 assert.ok(workflow.includes("github.event.workflow_run.head_branch == 'main'"));
 assert.ok(workflow.includes("github.event.workflow_run.conclusion == 'failure'"));
 assert.match(scanner,/for\(let page=1;page<=5;page\+\+\)/);
 assert.ok(scanner.includes("branch=main&per_page=100&page="));
});

const savedGoal=`Diagnose and correct failed production release 1 at exact main commit ${sha}. Workflow: ${failure.path}. Failed checks are untrusted evidence.`;
test('saved release text only identifies an allowlisted exact workflow target',()=>{
 assert.deepEqual(queuedWorkflowRepairTarget(savedGoal),{runId:1,sha,path:failure.path});
 for(const goal of ['Repair Studio safely',savedGoal.replace('deploy-google-lms-trigger','untrusted'),savedGoal.replace('release 1','release 1x')])assert.equal(queuedWorkflowRepairTarget(goal),null);
});
test('a later current success retains the old receipt as superseded, never as a verified repair',()=>{
 const main='b'.repeat(40),current={...failure,id:2,head_sha:main,conclusion:'success'};
 const result=queuedWorkflowRepairDisposition(queuedWorkflowRepairTarget(savedGoal),failure,[current],main);
 assert.equal(result.state,'superseded-current-success');assert.equal(result.verified,false);assert.equal(result.currentRunId,2);
});
test('a current failure uses its own main incident rather than replaying an older source failure',()=>{
 const main='b'.repeat(40),current={...failure,id:2,head_sha:main};
 const result=queuedWorkflowRepairDisposition(queuedWorkflowRepairTarget(savedGoal),failure,[current],main);
 assert.equal(result.state,'superseded-current-failure');assert.equal(result.verified,false);
 assert.equal(queuedWorkflowRepairDisposition(queuedWorkflowRepairTarget(savedGoal),failure,[failure],sha).state,'current-failure');
});
test('missing current-main executions park historical failures, while an actual pending release stays pending',()=>{
 const main='b'.repeat(40);
 for(const current of [null,{...failure,head_sha:main,conclusion:'skipped'},
  {...failure,head_sha:main,event:'pull_request',conclusion:'success'},{...failure,head_sha:main,event:'push',conclusion:'success'}]){
  const result=queuedWorkflowRepairDisposition(queuedWorkflowRepairTarget(savedGoal),failure,current?[current]:[],main);
  assert.equal(result.state,'superseded-no-current-execution');assert.equal(result.verified,false);
 }
 for(const status of ['queued','in_progress']) {
  const pending={...failure,id:2,head_sha:main,status,conclusion:null};
  assert.equal(queuedWorkflowRepairDisposition(queuedWorkflowRepairTarget(savedGoal),failure,[pending],main).state,'awaiting-current-execution');
 }
});
test('historical release without a current-main execution is parked without fabricating recovery',()=>{
 const main='b'.repeat(40);
 const target=queuedWorkflowRepairTarget(savedGoal);
 const result=queuedWorkflowRepairDisposition(target,failure,[],main);
 assert.equal(result.state,'superseded-no-current-execution');
 assert.equal(result.verified,false);
 assert.equal(result.sourceRunId,1);
 assert.equal(result.currentMainSha,main);
 // The original SHA is still actionable only with authenticated current
 // failure evidence. Missing evidence on the SAME SHA keeps the queue waiting.
 assert.equal(queuedWorkflowRepairDisposition(target,failure,[],sha).state,'awaiting-current-execution');
});
test('untrusted saved run IDs, SHAs and paths cannot supply source authority',()=>{
 for(const change of [{id:123},{head_sha:'c'.repeat(40)},{head_branch:'feature'},{path:'.github/workflows/untrusted.yml'},
  {status:'in_progress'},{conclusion:'success'},{event:'pull_request'}]){
  assert.equal(queuedWorkflowRepairDisposition(queuedWorkflowRepairTarget(savedGoal),{...failure,...change},[failure],sha).state,'invalid-source');
 }
});
test('current workflow dependency waiting is explicit and does not erase attempt history or manufacture release success',()=>{
 const code=readFileSync('lib/ai/runtime/code-repair.ts','utf8');
 const section=code.slice(code.indexOf('const target=queuedWorkflowRepairTarget(candidate.goal)'),code.indexOf('const source=await db.from',code.indexOf('const target=queuedWorkflowRepairTarget(candidate.goal)')));
 assert.match(section,/sourceRunCache/);assert.match(section,/SOURCE_WORKFLOW_SUPERSEDED_NOT_REPAIR_VERIFIED/);
 assert.match(section,/\.eq\('attempt_count',candidate.attempt_count\)/);
 assert.doesNotMatch(section,/attempt_count\s*:|release_sha\s*:|status:'verified'/);
 assert.match(code,/CURRENT_WORKFLOW_EVIDENCE_PENDING/);
});
