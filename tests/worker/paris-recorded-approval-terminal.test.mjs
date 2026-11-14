import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {observeAcceptedOpenHandsRepair, openHandsRepairPrompt} from '../../lib/devstudio/paris-openhands-repair.mjs';

const repairId = '11111111-1111-4111-8111-111111111111';
const goal = 'Fix verified production bug.';
const cp = {
  version: 1, repairId, actorId: 'owner', attempt: 1, runId: 12,
  goalHash: createHash('sha256').update(goal).digest('hex'),
  correlationId: `paris-repair:${repairId}:attempt:1`,
  branch: `studio/paris-openhands-${repairId}-1`,
  baseSha: 'a'.repeat(40), startedAt: 1, sequence: 3,
  branchPrepared: true, dispatchRequested: true, taskId: 'task'
};
const lifecycle = {
  status: 'completed', startTaskId: 'provider-start',
  repository: 'elevate-for-humanity/Elevate-lms', branch: cp.branch
};

async function probe(approval_status, requires_approval, status = 'running') {
  const task = {
    id: 'task', user_id: 'owner', tenant_id: null, tool_name: 'openhands.execute',
    correlation_id: cp.correlationId, command: openHandsRepairPrompt({...cp, goal}),
    tool_input: {repository: 'elevate-for-humanity/Elevate-lms', branch: cp.branch},
    tool_output: {start_task_id: 'provider-start'},
    approval_status, requires_approval, status
  };
  let refreshed = 0, read = 0, started = 0;
  const result = await observeAcceptedOpenHandsRepair(
    {repairId, actorId: 'owner', attempt: 1, runId: 12, goal, checkpoint: cp},
    {
      findTask: async () => task,
      refresh: async () => {refreshed++; return {task, lifecycle};},
      readCandidate: async () => {read++; return {branch: {name: cp.branch, sha: 'b'.repeat(40)}};},
      dispatch: async () => {started++; throw Error('must not dispatch');}
    }
  );
  return {result, refreshed, read, started};
}

test('an explicitly approved existing task is not blocked by a stale requires_approval flag', async () => {
  const {result, refreshed, read, started} = await probe('approved', true);
  assert.equal(result.state, 'ready');
  assert.equal(refreshed, 1);
  assert.equal(read, 1);
  assert.equal(started, 0);
});

test('pending, rejected, or awaiting-approval tasks cannot admit source', async () => {
  for (const [decision, required, state] of [
    ['pending', true, 'running'], ['rejected', true, 'running'],
    ['not_required', true, 'running'], ['approved', true, 'awaiting_approval']
  ]) {
    await assert.rejects(probe(decision, required, state), /PARIS_OPENHANDS_APPROVAL_REQUIRED/);
  }
});

test('not-required canonical execution remains eligible without a second approval', async () => {
  const {result, started} = await probe('not_required', false);
  assert.equal(result.state, 'ready');
  assert.equal(started, 0);
});

test('provider candidate classification agrees with terminal authorization for explicit approvals', async () => {
  const {readFileSync} = await import('node:fs');
  const {stripTypeScriptTypes} = await import('node:module');
  const {isProviderConfirmationSnapshot} = await import('../../lib/devstudio/openhands/provider-confirmation.mjs');
  const source = readFileSync(new URL('../../lib/devstudio/openhands/paris-provider-candidate.ts', import.meta.url), 'utf8');
  const compiled = stripTypeScriptTypes(source).replace(/^import .*;.*$/gm, '').replaceAll('export ', '');
  const classify = new Function('isProviderConfirmationSnapshot', compiled + ';return isParisProviderBranchCandidate;')(isProviderConfirmationSnapshot);
  const baseTask = {
    id: 'task', user_id: 'owner', tenant_id: null, tool_name: 'openhands.execute',
    correlation_id: cp.correlationId, command: openHandsRepairPrompt({...cp, goal}),
    tool_input: {repository: lifecycle.repository, branch: cp.branch},
    tool_output: {start_task_id: lifecycle.startTaskId}, status: 'running'
  };
  const github = {
    verified: false, repository: lifecycle.repository,
    branch: {name: cp.branch, sha: 'b'.repeat(40)}, pullRequests: []
  };
  assert.equal(classify({...baseTask, requires_approval: true, approval_status: 'approved'}, {...lifecycle, prNumbers: []}, github), true);
  assert.equal(classify({...baseTask, requires_approval: false, approval_status: 'not_required'}, {...lifecycle, prNumbers: []}, github), true);
  for (const changes of [
    {requires_approval: true, approval_status: 'pending'},
    {requires_approval: true, approval_status: 'rejected'},
    {requires_approval: true, approval_status: 'not_required'},
    {requires_approval: true, approval_status: 'approved', status: 'awaiting_approval'}
  ]) {
    assert.equal(classify({...baseTask, ...changes}, {...lifecycle, prNumbers: []}, github), false);
  }
  assert.equal(classify({...baseTask, requires_approval: true, approval_status: 'approved'}, {...lifecycle, startTaskId: 'changed', prNumbers: []}, github), false);
});
