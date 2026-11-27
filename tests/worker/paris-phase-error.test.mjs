import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyParisPhaseError,describeParisPhaseFailure} from '../../lib/devstudio/paris-phase-error.mjs';

test('planner inspection and source evidence rejection are not mislabeled upstream gateway outages',()=>{
  assert.deepEqual(classifyParisPhaseError(new Error('PARIS_PATCH_FAILED: PARIS_PLANNER_REPEATED_INSPECTION')),
    {errorCode:'PARIS_PLANNER_REPEATED_INSPECTION',status:422});
  assert.deepEqual(classifyParisPhaseError(new Error('PARIS_PATCH_FAILED: PARIS_WORKFLOW_FAILED_JOB_REQUIRED')),
    {errorCode:'PARIS_WORKFLOW_FAILED_JOB_REQUIRED',status:422});
  assert.deepEqual(classifyParisPhaseError(new Error('PARIS_PATCH_FAILED: PARIS_REPAIR_PLANNING_DEADLINE_REACHED')),
    {errorCode:'PARIS_REPAIR_PLANNING_DEADLINE_REACHED',status:422});
});

test('gateway errors remain errors and private provider messages cannot escape',()=>{
  assert.deepEqual(classifyParisPhaseError(new Error('PARIS_GITHUB_HTTP_503')),
    {errorCode:'PARIS_GITHUB_HTTP_503',status:502});
  assert.deepEqual(classifyParisPhaseError(new Error('private provider message token xyz')),
    {errorCode:'PARIS_REPAIR_PHASE_FAILED',status:502});
  assert.deepEqual(classifyParisPhaseError({code:'23514',message:'private SQL details'}),
    {errorCode:'PARIS_DATABASE_23514',status:502});
});

test('authorization failures retain an explicit failed authorization code',()=>{
  assert.deepEqual(classifyParisPhaseError(new Error('PARIS_AUTOPILOT_OWNER_AUTHORITY_REQUIRED')),
    {errorCode:'PARIS_AUTOPILOT_OWNER_AUTHORITY_REQUIRED',status:403});
});

// The workflow only receives an allow-listed code. The redacted diagnostic is
// the log-only signal that turns an unattributed 502 into a named cause.
test('a provider transport failure is named instead of falling into the 502 bucket',()=>{
  const failure=describeParisPhaseFailure(new Error('Configured AI provider "elevate" failed: HTTP 502 Bad Gateway'));
  assert.equal(failure.errorCode,'PARIS_PROVIDER_TRANSPORT_FAILURE');
  assert.equal(failure.status,503);
});

test('an open provider circuit is reported with its own code',()=>{
  const failure=describeParisPhaseFailure(new Error('Configured AI provider "elevate" failed; Circuit "ai:elevate" is open. Retry after 30s.'));
  assert.equal(failure.errorCode,'PARIS_PROVIDER_CIRCUIT_OPEN');
});

test('the redacted diagnostic never discloses a bearer token, jwt or key',()=>{
  const failure=describeParisPhaseFailure(new Error(
    'fetch failed for Authorization: Bearer sk-live-abcdef1234567890 and api_key=supersecretvalue eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig'));
  assert.ok(!failure.diagnostic.includes('sk-live-abcdef1234567890'));
  assert.ok(!failure.diagnostic.includes('supersecretvalue'));
  assert.ok(!failure.diagnostic.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
  assert.ok(failure.diagnostic.includes('<redacted>'));
  assert.ok(failure.diagnostic.length<=401);
});

test('the nested cause is redacted, not just the primary message',()=>{
  const inner=new Error('upstream rejected Authorization: Bearer sk-live-abcdef1234567890');
  const outer=new Error('provider call failed',{cause:inner});
  const failure=describeParisPhaseFailure(outer);
  assert.ok(failure.cause, 'the cause must be preserved for diagnosis');
  assert.ok(!failure.cause.includes('sk-live-abcdef1234567890'),'the cause must not leak the token');
  assert.ok(failure.cause.includes('<redacted>'));
  // A jwt-bearing cause is also redacted and bounded.
  const jwtCause=describeParisPhaseFailure(new Error('outer',{cause:new Error('x eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig')}));
  assert.ok(!jwtCause.cause.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
  assert.ok(jwtCause.cause.length<=401);
});


test('an actual GitHub branch-write refusal is distinct from an upstream GitHub 5xx',()=>{
  const branch='GITHUB_APP_403_BRANCH: GitHub App cannot create branches in elevate-for-humanity/Elevate-lms.; provider message: Resource not accessible by integration';
  for(const message of [branch,'PARIS_PATCH_FAILED: '+branch])
    assert.deepEqual(classifyParisPhaseError(new Error(message)),{errorCode:'GITHUB_APP_403_BRANCH',status:403});
  assert.deepEqual(classifyParisPhaseError(new Error('GITHUB_BRANCH_AUTHORITY_UNKNOWN: GitHub did not report repository permissions')),
    {errorCode:'GITHUB_BRANCH_AUTHORITY_UNKNOWN',status:403});
  for(const [message,code] of [
    ['GitHub API 502 for /git/refs: GitHub API error (502); provider message: Bad Gateway','PARIS_GITHUB_HTTP_502'],
    ['PARIS_PATCH_FAILED: GitHub API 503 for /git/ref/heads/main: unavailable','PARIS_GITHUB_HTTP_503'],
    ['GITHUB_BRANCH_AUTHORITY_CHECK_HTTP_502','PARIS_GITHUB_HTTP_502'],
    ['GITHUB_BRANCH_AUTHORITY_CHECK_HTTP_403','PARIS_GITHUB_HTTP_403'],
  ]){
    const classified=classifyParisPhaseError(new Error(message));
    assert.deepEqual(classified,{errorCode:code,status:502});
    assert.notEqual(classified.errorCode,'GITHUB_APP_403_BRANCH');
  }
  assert.deepEqual(classifyParisPhaseError(new Error('GitHub API 404 for /git/refs: not found')),
    {errorCode:'PARIS_REPAIR_PHASE_FAILED',status:502});
});
