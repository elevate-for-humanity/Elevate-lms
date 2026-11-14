import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProtectedPullRequest, evaluateOriginalRepairAcceptance } from '../../lib/devstudio/openhands/acceptance-contract.mjs';

const HEAD = 'a'.repeat(40);
const MERGE = 'b'.repeat(40);
const pr = {
  head: { sha: HEAD }, base: { ref: 'main' }, user: { login: 'author' },
  merged: true, merged_at: '2026-11-14T00:00:00Z', merge_commit_sha: MERGE,
};
const reviews = [{ user: { login: 'independent-reviewer', type: 'User' }, state: 'APPROVED',
  commit_id: HEAD, submitted_at: '2026-11-14T01:00:00Z' }];
const checks = [{ name: 'CI Required Gate', status: 'completed', conclusion: 'success' }];

test('protected GitHub acceptance requires merge ancestry, current-head checks and independent review', () => {
  assert.equal(evaluateProtectedPullRequest({ pr, reviews, checks, ancestryVerified: true, protectionVerified: true }).accepted, true);
  assert.equal(evaluateProtectedPullRequest({ pr, reviews, checks, ancestryVerified: true, protectionVerified: false }).accepted, false);
  assert.equal(evaluateProtectedPullRequest({ pr, reviews, checks, ancestryVerified: false, protectionVerified: true }).accepted, false);
  assert.equal(evaluateProtectedPullRequest({ pr: { ...pr, merged: false }, reviews, checks, ancestryVerified: true, protectionVerified: true }).accepted, false);
  assert.equal(evaluateProtectedPullRequest({ pr, reviews: [], checks, ancestryVerified: true, protectionVerified: true }).accepted, false);
  assert.equal(evaluateProtectedPullRequest({ pr, reviews, checks: [], ancestryVerified: true, protectionVerified: true }).accepted, false);
});

test('reviewer cannot be author, bot, stale approval or superseded by changes requested', () => {
  for (const bad of [
    [{ ...reviews[0], user: { login: 'author', type: 'User' } }],
    [{ ...reviews[0], user: { login: 'robot[bot]', type: 'Bot' } }],
    [{ ...reviews[0], commit_id: 'c'.repeat(40) }],
    [{ ...reviews[0], state: 'COMMENTED' }],
    [reviews[0], { ...reviews[0], state: 'CHANGES_REQUESTED', submitted_at: '2026-11-14T02:00:00Z' }],
  ]) {
    assert.equal(evaluateProtectedPullRequest({ pr, reviews: bad, checks, ancestryVerified: true, protectionVerified: true }).accepted, false);
  }
});

test('missing, failing, pending and truncated CI all fail closed', () => {
  for (const invalid of [
    [{ name: 'CI', status: 'in_progress', conclusion: null }],
    [{ name: 'CI', status: 'completed', conclusion: 'failure' }],
    Array.from({ length: 100 }, () => checks[0]),
  ]) {
    assert.equal(evaluateProtectedPullRequest({ pr, reviews, checks: invalid, ancestryVerified: true, protectionVerified: true }).accepted, false);
  }
});

const repairId = 'd1507c12-93f7-459e-9aaf-b73286e2bd5c';
const repair = { id: repairId, status: 'verified', release_sha: MERGE };
const correlatedTask = { id: 'same-task', tool_name: 'openhands.execute',
  correlation_id: `paris-repair:${repairId}:attempt:1`,
  tool_output: { start_task_id: 'same-start', conversation_id: 'same-conversation' } };
const services = [{ service: 'admin', ready: true, servingSha: MERGE },
  { service: 'lms', ready: true, servingSha: MERGE },
  { service: 'marketing', ready: true, servingSha: MERGE }];
const accepted = { originalRepairId: repairId, repair, correlatedTask,
  originalTaskId: 'same-task', providerStartTaskId: 'same-start',
  providerConversationId: 'same-conversation', mergeSha: MERGE,
  services, originalDefectRegressionPassed: true };

test('original repair acceptance requires durable repair receipt, exact serving SHA and regression', () => {
  assert.equal(evaluateOriginalRepairAcceptance(accepted).accepted, true);
  assert.equal(evaluateOriginalRepairAcceptance({ ...accepted, repair: { ...repair, status: 'blocked' } }).accepted, false);
  assert.equal(evaluateOriginalRepairAcceptance({ ...accepted, repair: { ...repair, release_sha: null } }).accepted, false);
  assert.equal(evaluateOriginalRepairAcceptance({ ...accepted, originalRepairId: 'another' }).accepted, false);
  assert.equal(evaluateOriginalRepairAcceptance({ ...accepted, correlatedTask: null }).accepted, false);
  assert.equal(evaluateOriginalRepairAcceptance({ ...accepted, originalTaskId: 'replacement-task' }).accepted, false);
  assert.equal(evaluateOriginalRepairAcceptance({ ...accepted, providerConversationId: 'replacement-conversation' }).accepted, false);
  assert.equal(evaluateOriginalRepairAcceptance({ ...accepted, correlatedTask: { ...correlatedTask, correlation_id: 'paris-repair:other:attempt:1' } }).accepted, false);
  assert.equal(evaluateOriginalRepairAcceptance({ ...accepted, services: [{ ready: true, servingSha: HEAD }] }).accepted, false);
  assert.equal(evaluateOriginalRepairAcceptance({ ...accepted, originalDefectRegressionPassed: false }).accepted, false);
});
