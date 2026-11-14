import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProtectedPullRequest, evaluateOriginalRepairAcceptance, protectedMainPolicyVerified, requiredMainReviewCount, requiredMainChecks } from '../../lib/devstudio/openhands/acceptance-contract.mjs';

const HEAD = 'a'.repeat(40);
const MERGE = 'b'.repeat(40);
const pr = {
  head: { sha: HEAD }, base: { ref: 'main' }, user: { login: 'author' },
  merged: true, merged_at: '2026-11-14T00:00:00Z', merge_commit_sha: MERGE,
};
const reviews = [{ user: { login: 'independent-reviewer', type: 'User' }, state: 'APPROVED',
  commit_id: HEAD, submitted_at: '2026-11-14T01:00:00Z' }];
const checks = [{ name: 'CI Required Gate', status: 'completed', conclusion: 'success' }];
const evaluate = options => evaluateProtectedPullRequest({
  reviewerPermissions: { 'independent-reviewer': 'write' }, ...options,
});

test('protected GitHub acceptance requires merge ancestry, current-head checks and independent review', () => {
  assert.equal(evaluate({ pr, reviews, checks, requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true }).accepted, true);
  assert.equal(evaluate({ pr, reviews, checks, requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: false }).accepted, false);
  assert.equal(evaluate({ pr, reviews, checks, requiredChecks: ['CI Required Gate'], ancestryVerified: false, protectionVerified: true }).accepted, false);
  assert.equal(evaluate({ pr: { ...pr, merged: false }, reviews, checks, requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true }).accepted, false);
  assert.equal(evaluate({ pr, reviews: [], checks, requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true }).accepted, false);
  assert.equal(evaluate({ pr, reviews, checks: [], requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true }).accepted, false);
});

test('reviewer cannot be author, bot, stale approval or superseded by changes requested', () => {
  for (const bad of [
    [{ ...reviews[0], user: { login: 'author', type: 'User' } }],
    [{ ...reviews[0], user: { login: 'robot[bot]', type: 'Bot' } }],
    [{ ...reviews[0], commit_id: 'c'.repeat(40) }],
    [{ ...reviews[0], state: 'COMMENTED' }],
    [reviews[0], { ...reviews[0], state: 'CHANGES_REQUESTED', submitted_at: '2026-11-14T02:00:00Z' }],
  ]) {
    assert.equal(evaluate({ pr, reviews: bad, checks, requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true }).accepted, false);
  }
});

test('missing, failing, pending and truncated CI all fail closed', () => {
  for (const invalid of [
    [{ name: 'CI', status: 'in_progress', conclusion: null }],
    [{ name: 'CI', status: 'completed', conclusion: 'failure' }],
    Array.from({ length: 100 }, () => checks[0]),
  ]) {
    assert.equal(evaluate({ pr, reviews, checks: invalid, requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true }).accepted, false);
  }
});


test('skipped nonrequired operational checks do not override successful required gates', () => {
  const optional = [...checks, { name: 'PBX preserve (push only)', status: 'completed', conclusion: 'skipped' }];
  assert.equal(evaluate({
    pr, reviews, checks: optional, requiredChecks: ['CI Required Gate'],
    ancestryVerified: true, protectionVerified: true,
  }).accepted, true);
  assert.equal(evaluate({
    pr, reviews, checks: optional, requiredChecks: ['PBX preserve (push only)'],
    ancestryVerified: true, protectionVerified: true,
  }).accepted, false);
  assert.equal(evaluate({
    pr, reviews, checks: [...optional, { name: 'Security', status: 'completed', conclusion: 'failure' }],
    requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true,
  }).accepted, false);
});

test('neutral optional check is not sufficient validation', () => {
  assert.equal(evaluate({
    pr, reviews, checks: [...checks, { name: 'Security', status: 'completed', conclusion: 'neutral' }],
    requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true,
  }).accepted, false);
});

test('required shared context needs BOTH successful check run and commit status', () => {
  for (const conclusion of ['skipped', 'failure', 'neutral']) {
    assert.equal(evaluate({
      pr, reviews,
      checks: [{ name: 'external-ci', status: 'completed', conclusion }],
      statuses: [{ context: 'external-ci', state: 'success' }],
      requiredChecks: ['external-ci'], ancestryVerified: true, protectionVerified: true,
    }).accepted, false);
  }
  assert.equal(evaluate({
    pr, reviews,
    checks: [{ name: 'external-ci', status: 'completed', conclusion: 'success' }],
    statuses: [{ context: 'external-ci', state: 'failure' }],
    requiredChecks: ['external-ci'], ancestryVerified: true, protectionVerified: true,
  }).accepted, false);
  assert.equal(evaluate({
    pr, reviews, checks: [],
    statuses: [{ context: 'external-ci', state: 'success' }],
    requiredChecks: ['external-ci'], ancestryVerified: true, protectionVerified: true,
  }).accepted, true);
});

test('classic-only, ruleset-only and mixed protection are recognized without assuming enforcement', () => {
  const classic = { required_pull_request_reviews: { required_approving_review_count: 1 },
    required_status_checks: { checks: [{ context: 'CI Required Gate' }] } };
  const rules = [
    { type: 'pull_request', parameters: { required_approving_review_count: 1 } },
    { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'CI Required Gate' }] } },
  ];
  assert.equal(protectedMainPolicyVerified({ classic }), true);
  assert.equal(protectedMainPolicyVerified({ rules }), true);
  assert.equal(protectedMainPolicyVerified({
    classic: { required_pull_request_reviews: { required_approving_review_count: 1 } },
    rules: [rules[1]],
  }), true);
  assert.equal(protectedMainPolicyVerified({ rules: [], classic: {} }), false);
  assert.equal(protectedMainPolicyVerified({}), false);
});

test('comments do not erase an independent approval or reinstate changes requested', () => {
  const comment = { ...reviews[0], state: 'COMMENTED', submitted_at: '2026-11-14T02:00:00Z' };
  assert.equal(evaluate({
    pr, reviews: [reviews[0], comment], checks, requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true,
  }).accepted, true);
  const changes = { ...reviews[0], state: 'CHANGES_REQUESTED', submitted_at: '2026-11-14T01:30:00Z' };
  assert.equal(evaluate({
    pr, reviews: [reviews[0], changes, comment], checks, requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true,
  }).accepted, false);
  const dismissed = { ...reviews[0], state: 'DISMISSED', submitted_at: '2026-11-14T01:30:00Z' };
  assert.equal(evaluate({
    pr, reviews: [reviews[0], dismissed, comment], checks, requiredChecks: ['CI Required Gate'], ancestryVerified: true, protectionVerified: true,
  }).accepted, false);
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
  const newerSha = 'c'.repeat(40);
  assert.equal(evaluateOriginalRepairAcceptance({
    ...accepted, deployedSha: newerSha,
    releaseAncestryVerified: true,
    services: [{ ready: true, servingSha: newerSha }],
  }).accepted, true);
  assert.equal(evaluateOriginalRepairAcceptance({
    ...accepted, deployedSha: newerSha,
    releaseAncestryVerified: false,
    services: [{ ready: true, servingSha: newerSha }],
  }).accepted, false);

});


test('read-only or unknown reviewers cannot certify protected acceptance', () => {
  for (const permission of ['read', 'triage', 'unknown']) {
    const result = evaluate({
      pr, reviews, checks, requiredChecks: ['CI Required Gate'],
      reviewerPermissions: { 'independent-reviewer': permission },
      ancestryVerified: true, protectionVerified: true,
    });
    assert.equal(result.accepted, false);
    assert.match(result.reasons.join(' '), /Insufficient independent authorized approvals/);
  }
});

test('an outstanding authorized change request blocks another reviewer approval', () => {
  const requested = { user: { login: 'second-reviewer', type: 'User' },
    state: 'CHANGES_REQUESTED', commit_id: HEAD, submitted_at: '2026-11-14T02:00:00Z' };
  const result = evaluate({
    pr, reviews: [...reviews, requested], checks, requiredChecks: ['CI Required Gate'],
    reviewerPermissions: { 'independent-reviewer': 'write', 'second-reviewer': 'write' },
    ancestryVerified: true, protectionVerified: true,
  });
  assert.equal(result.accepted, false);
  assert.match(result.reasons.join(' '), /Outstanding changes requested/);
  const unknown = evaluate({
    pr, reviews: [...reviews, requested], checks, requiredChecks: ['CI Required Gate'],
    reviewerPermissions: { 'independent-reviewer': 'write', 'second-reviewer': 'unknown' },
    ancestryVerified: true, protectionVerified: true,
  });
  assert.equal(unknown.accepted, false);
  assert.match(unknown.reasons.join(' '), /reviewer authority could not be verified/);
});

test('required approval count is enforced from both classic and ruleset policy', () => {
  const classic = { required_pull_request_reviews: { required_approving_review_count: 2 } };
  const rules = [{ type: 'pull_request', parameters: { required_approving_review_count: 1 } }];
  assert.equal(requiredMainReviewCount({ classic, rules }), 2);
  const base = { pr, reviews, checks, requiredChecks: ['CI Required Gate'],
    ancestryVerified: true, protectionVerified: true, requiredApprovalCount: 2 };
  assert.equal(evaluate(base).accepted, false);
  const second = { user: { login: 'second-reviewer', type: 'User' },
    state: 'APPROVED', commit_id: HEAD, submitted_at: '2026-11-14T02:00:00Z' };
  assert.equal(evaluate({ ...base, reviews: [...reviews, second],
    reviewerPermissions: { 'independent-reviewer': 'write', 'second-reviewer': 'maintain' },
  }).accepted, true);
  assert.equal(requiredMainReviewCount({}), 0);
});

test('required GitHub App ID must match the independently reported check issuer', () => {
  const rules = [
    { type: 'pull_request', parameters: { required_approving_review_count: 1 } },
    { type: 'required_status_checks', parameters: {
      required_status_checks: [{ context: 'CI Required Gate', app_id: 99 }],
    } },
  ];
  const requiredChecks = requiredMainChecks({ rules });
  assert.deepEqual(requiredChecks, [{ context: 'CI Required Gate', app_id: 99 }]);
  const base = { pr, reviews, requiredChecks, ancestryVerified: true, protectionVerified: true };
  const wrong = evaluate({ ...base, checks: [{ ...checks[0], app: { id: 98 } }] });
  assert.equal(wrong.accepted, false);
  const right = evaluate({ ...base, checks: [{ ...checks[0], app: { id: 99 } }] });
  assert.equal(right.accepted, true, JSON.stringify(right.reasons));
  const statusOnly = evaluate({ ...base, checks: [],
    statuses: [{ context: 'CI Required Gate', state: 'success' }] });
  assert.equal(statusOnly.accepted, false);
});

test('ruleset integration_id pins the check issuer independently of classic policy', () => {
  const requiredChecks = requiredMainChecks({ rules: [{
    type: 'required_status_checks', parameters: { required_status_checks: [
      { context: 'CI Required Gate', integration_id: 99 },
    ] },
  }] });
  assert.deepEqual(requiredChecks, [{ context: 'CI Required Gate', app_id: 99 }]);
  const base = { pr, reviews, requiredChecks, ancestryVerified: true, protectionVerified: true };
  assert.equal(evaluate({ ...base, checks: [{ ...checks[0], app: { id: 98 } }] }).accepted, false);
  assert.equal(evaluate({ ...base, checks: [{ ...checks[0], app: { id: 99 } }] }).accepted, true);
});

test('known read-only change requests do not veto sufficient authorized approvals', () => {
  const requested = { user: { login: 'reader', type: 'User' }, state: 'CHANGES_REQUESTED',
    commit_id: HEAD, submitted_at: '2026-11-14T02:00:00Z' };
  for (const permission of ['read', 'triage', 'none']) {
    const result = evaluate({
      pr, reviews: [...reviews, requested], checks, requiredChecks: ['CI Required Gate'],
      reviewerPermissions: { 'independent-reviewer': 'write', reader: permission },
      ancestryVerified: true, protectionVerified: true,
    });
    assert.equal(result.accepted, true, JSON.stringify(result.reasons));
  }
  const unknown = evaluate({
    pr, reviews: [...reviews, requested], checks, requiredChecks: ['CI Required Gate'],
    reviewerPermissions: { 'independent-reviewer': 'write' },
    ancestryVerified: true, protectionVerified: true,
  });
  assert.equal(unknown.accepted, false);
  assert.match(unknown.reasons.join(' '), /reviewer authority could not be verified/);
});
