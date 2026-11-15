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

