import test from 'node:test';
import assert from 'node:assert/strict';
import {canRetryVerifiedGithubAppRepair} from '../../lib/ai/runtime/code-repair-policy.mjs';
import {readFileSync} from 'node:fs';

const base={status:'blocked',attempt_count:1,source_job_id:null,
  candidate:null,release_sha:null,verification:{}};

test('source-free 401s are eligible for one verified App recovery',()=>{
 for(const error_code of [
  'PARIS_PATCH_FAILED: GitHub API 401 for /contents/apps/admin/page.ts: Bad credentials',
  'GitHub API 403 for /git/refs: Resource not accessible by personal access token',
  'PARIS_PATCH_FAILED: GitHub code search failed: 401'
 ]) assert.equal(canRetryVerifiedGithubAppRepair({...base,error_code}),true);
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
