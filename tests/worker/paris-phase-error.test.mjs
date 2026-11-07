import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyParisPhaseError} from '../../lib/devstudio/paris-phase-error.mjs';

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
