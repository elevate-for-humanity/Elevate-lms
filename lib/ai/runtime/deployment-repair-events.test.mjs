import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {failedCurrentReleases} from './deployment-repair-events.mjs';
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
