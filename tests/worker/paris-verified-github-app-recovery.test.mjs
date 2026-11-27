import test from 'node:test';
import assert from 'node:assert/strict';
import {canRetryVerifiedGithubAppRepair,isGithubAppBranchFailure,isInfrastructureRepairFailure,hasOnlyInfrastructureAttemptFailures} from '../../lib/ai/runtime/code-repair-policy.mjs';
import {readFileSync} from 'node:fs';

const base={status:'blocked',attempt_count:1,source_job_id:null,
  candidate:null,release_sha:null,verification:{}};

test('source-free 401s are eligible for one verified App recovery',()=>{
 for(const error_code of [
  'PARIS_PATCH_FAILED: GitHub API 401 for /contents/apps/admin/page.ts: Bad credentials',
  'GitHub API 403 for /git/refs: Resource not accessible by personal access token',
  'PARIS_PATCH_FAILED: GitHub code search failed: 401',
  'GITHUB_BRANCH_AUTHORITY_CHECK_HTTP_403',
  'PARIS_PATCH_FAILED: GITHUB_BRANCH_AUTHORITY_CHECK_HTTP_403'
 ]) assert.equal(canRetryVerifiedGithubAppRepair({...base,error_code}),true);
 for(const error_code of ['GITHUB_BRANCH_AUTHORITY_CHECK_HTTP_502','GITHUB_BRANCH_AUTHORITY_CHECK_HTTP_403 extra'])
  assert.equal(canRetryVerifiedGithubAppRepair({...base,error_code}),false);
});

test('no source job or third attempt can be revived automatically',()=>{
 const repair={...base,error_code:'GitHub API 403 for /git/refs: forbidden'};
 for(const change of [{attempt_count:2},{source_job_id:'course-job'},
  {status:'verified'},{candidate:{branch:{sha:'a'.repeat(40)}}},
  {release_sha:'a'.repeat(40)},{verification:{reconciliation:{replay:false}}}])
  assert.equal(canRetryVerifiedGithubAppRepair({...repair,...change}),false);
});

test('non-credential and incomplete repairs are ineligible',()=>{
 for(const error_code of [
  'PARIS_PATCH_FAILED: Internal engineering finished without a verifiable repository change.',
  'Configured AI provider elevate timed out', 'SOURCE_DEFECT_RESOLVED',
 ]) assert.equal(canRetryVerifiedGithubAppRepair({...base,error_code}),false);
});

const branchError='GITHUB_APP_403_BRANCH: The configured GitHub App or token cannot create branches in elevate-for-humanity/Elevate-lms (POST /git/refs was forbidden). Grant the App installation Contents: write permission on the repository and re-run the repair; no branch was created. GitHub reports permissions.push is false for this credential.';
const branchBase={status:'blocked',attempt_count:1,candidate:null,
  release_sha:null,verification:{}};

test('branch-creation credential failure is eligible at the first attempt, linked or not',()=>{
 assert.equal(canRetryVerifiedGithubAppRepair({...branchBase,source_job_id:'course-job',error_code:branchError}),true);
 assert.equal(canRetryVerifiedGithubAppRepair({...branchBase,source_job_id:null,error_code:branchError}),true);
 assert.equal(canRetryVerifiedGithubAppRepair({...branchBase,source_job_id:null,error_code:'GITHUB_APP_403_BRANCH'}),true);
 assert.equal(isGithubAppBranchFailure({error_code:branchError}),true);
 assert.equal(isGithubAppBranchFailure({error_code:'GITHUB_APP_401_TOKEN: Bad credentials'}),false);
 assert.equal(isGithubAppBranchFailure({error_code:'PARIS_PATCH_FAILED: GITHUB_APP_403_BRANCH: prefixed'}),false);
 assert.equal(isGithubAppBranchFailure({}),false);
});

test('branch-creation recovery keeps the attempt budget and candidate guards',()=>{
 const repair={...branchBase,source_job_id:'course-job',error_code:branchError};
 for(const change of [{attempt_count:2},{attempt_count:0},{status:'queued'},
  {candidate:{branch:{sha:'a'.repeat(40)}}},{release_sha:'a'.repeat(40)},
  {verification:{reconciliation:{replay:false}}}])
  assert.equal(canRetryVerifiedGithubAppRepair({...repair,...change}),false);
});

test('original credential classes keep their source-free guard',()=>{
 assert.equal(canRetryVerifiedGithubAppRepair({status:'blocked',attempt_count:1,
  source_job_id:'course-job',candidate:null,release_sha:null,verification:{},
  error_code:'GitHub API 403 for /git/refs: Resource not accessible by personal access token'}),false);
});

test('monitor proves Contents write before reviving a branch-creation failure',()=>{
 const runtime=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
 const a=runtime.indexOf('if(!recoveredAppThisTick && canRetryVerifiedGithubAppRepair(repair))');
 const b=runtime.indexOf('if(!recoveredProviderThisTick',a);
 const section=runtime.slice(a,b);
 assert.ok(a>0&&b>a);
 // The requeue update stays behind the write-health gate for this class:
 // no proven write authority, no revival.
 assert.match(section,/const branchFailure=isGithubAppBranchFailure\(repair\);/);
 assert.match(section,/diagnostic\?\.repository\?\.permissions\?\.contentsWrite===true/);
 // Installation tokens report no repository flags; issuance proved contents:write.
 assert.match(section,/diagnostic\?\.repository\?\.permissions\?\.contentsWrite===null/);
 assert.doesNotMatch(section,/contentsWrite===false/);
 assert.match(section,/if\(branchFailure\?githubAppWriteHealth:githubAppRecoveryHealth\)\{/);
 assert.ok(section.indexOf('if(branchFailure?githubAppWriteHealth:githubAppRecoveryHealth)')<
  section.indexOf("status:'queued'"));
 assert.match(section,/contentsWrite:true/);
 assert.match(runtime,/isGithubAppBranchFailure/);
});

test('monitor verifies App explicitly and preserves attempts and error receipts',()=>{
 const runtime=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
 const a=runtime.indexOf('if(!recoveredAppThisTick && canRetryVerifiedGithubAppRepair(repair))');
 const b=runtime.indexOf('if(!recoveredProviderThisTick',a);
 const section=runtime.slice(a,b);
 assert.ok(a>0&&b>a);
 assert.match(section,/getGitHubAppToken\(\)/);
 assert.match(section,/diagnoseParisGitHubCredential/);
 assert.match(section,/retryReason:'verified-github-app-recovery'/);
 assert.match(section,/\.eq\('attempt_count',repair.attempt_count\)/);
 assert.doesNotMatch(section,/attempt_count\s*:/);
 assert.doesNotMatch(section,/ultimate_build_jobs/);
});

test('infrastructure failure vocabulary is exact and fails closed',()=>{
 for(const error of [branchError,
  'PARIS_PATCH_FAILED: OWNED_MODEL_TEMPORARILY_UNAVAILABLE:request_failed',
  'PARIS_PATCH_FAILED: OWNED_MODEL_TEMPORARILY_UNAVAILABLE:model_unavailable',
  'PARIS_OPENHANDS_PROTECTED_REPAIR_BOUNDARY'])
  assert.equal(isInfrastructureRepairFailure(error),true);
 for(const error of [
  'PARIS_PATCH_FAILED: PARIS_PLANNER_REPEATED_INSPECTION',
  'PARIS_PATCH_FAILED: Internal engineering finished without a verifiable repository change.',
  'PARIS_PATCH_FAILED: OWNED_MODEL_TEMPORARILY_UNAVAILABLE:unknown_suffix',
  'GITHUB_APP_401_TOKEN: Bad credentials','',undefined,null])
  assert.equal(isInfrastructureRepairFailure(error),false);
});

// Exact production ledger shapes, 2026-11-25: both rows blocked at their
// second attempt by the branch-creation credential wall, every prior
// failure infrastructure-class, no branch sha, no release.
const rowA519218b={status:'blocked',attempt_count:2,source_job_id:null,release_sha:null,
 candidate:{kind:'openhands-checkpoint',checkpoint:{
  branch:'studio/paris-openhands-a519218b-124b-4958-88c8-9eff3ae1c74e-1',branchPrepared:true}},
 verification:{},error_code:branchError,
 attempt_history:[{at:'2026-11-24T00:35:59.226+00:00',
  error:'PARIS_OPENHANDS_PROTECTED_REPAIR_BOUNDARY',
  retryReason:'owner-authorized-approval-unblock-2026-11-24'}]};
const row3d6e44ee={status:'blocked',attempt_count:2,
 source_job_id:'6408828b-4fb5-4b22-a31d-e0e6934ae32a',release_sha:null,
 candidate:null,verification:{},error_code:branchError,
 attempt_history:[{at:'2026-11-19T03:52:58.254+00:00',
  error:'PARIS_PATCH_FAILED: OWNED_MODEL_TEMPORARILY_UNAVAILABLE:request_failed',
  retryReason:'operator-fixed-error-code'}]};

test('both walled second attempts are eligible for the audited third attempt',()=>{
 assert.equal(hasOnlyInfrastructureAttemptFailures(rowA519218b),true);
 assert.equal(hasOnlyInfrastructureAttemptFailures(row3d6e44ee),true);
 assert.equal(canRetryVerifiedGithubAppRepair(rowA519218b),true);
 // Source-linked included under Elizabeth's blanket fix order, 2026-11-25.
 assert.equal(canRetryVerifiedGithubAppRepair(row3d6e44ee),true);
});

test('third-attempt credential recovery fails closed on any real attempt outcome',()=>{
 for(const change of [
  {attempt_history:[{error:'PARIS_PATCH_FAILED: Internal engineering finished without a verifiable repository change.'}]},
  {attempt_history:[{error:'PARIS_OPENHANDS_PROTECTED_REPAIR_BOUNDARY',sha:'a'.repeat(40)}]},
  {attempt_history:[]},{attempt_history:undefined},
  {attempt_history:[{retryReason:'owner-authorized-approval-unblock-2026-11-24'}]},
  {attempt_history:[...rowA519218b.attempt_history,{error:branchError,retryReason:'verified-github-app-recovery'}]},
  {candidate:{branch:{sha:'a'.repeat(40)}}},{release_sha:'a'.repeat(40)},
  {attempt_count:3},{attempt_count:0},{status:'queued'},
  {verification:{reconciliation:{replay:false}}}])
  assert.equal(canRetryVerifiedGithubAppRepair({...rowA519218b,...change}),false);
 // The source-linked row is equally closed to a non-infrastructure history.
 assert.equal(canRetryVerifiedGithubAppRepair({...row3d6e44ee,
  attempt_history:[{error:'PARIS_PATCH_FAILED: PARIS_PLANNER_REPEATED_INSPECTION'}]}),false);
});
