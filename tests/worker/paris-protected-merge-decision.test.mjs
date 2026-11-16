import test from 'node:test';
import assert from 'node:assert/strict';
import {approvalsSatisfied,protectedMergeReadiness,requiredChecksSatisfied,blockingReviewPresent} from '../../lib/devstudio/openhands/protected-merge-decision.mjs';

const HEAD = 'a'.repeat(40);
const openPr = { number: 42, state: 'open', draft: false, merged: false, base: { ref: 'main' },
  head: { sha: HEAD }, user: { login: 'paris-author' } };
const greenCheck = { name: 'CI Required Gate', status: 'completed', conclusion: 'success', app: { id: 15368 } };
const required = [{ context: 'CI Required Gate', app_id: 15368 }];

test('a validated, green, unblocked PR is ready to merge', () => {
  const result = protectedMergeReadiness({ pr: openPr, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required, requiredApprovalCount: 1 });
  assert.equal(result.ready, true, JSON.stringify(result.reasons));
});

test('a moved head, draft, or non-main base blocks the merge', () => {
  assert.equal(protectedMergeReadiness({ pr: openPr, expectedHeadSha: 'b'.repeat(40), checks: [greenCheck], requiredChecks: required, requiredApprovalCount: 1 }).ready, false);
  assert.equal(protectedMergeReadiness({ pr: { ...openPr, draft: true }, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required, requiredApprovalCount: 1 }).ready, false);
  assert.equal(protectedMergeReadiness({ pr: { ...openPr, base: { ref: 'release' } }, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required, requiredApprovalCount: 1 }).ready, false);
});

test('a missing or failing required check blocks the merge', () => {
  assert.equal(requiredChecksSatisfied({ checks: [], requiredChecks: required, requiredApprovalCount: 1 }).satisfied, false);
  assert.equal(requiredChecksSatisfied({ checks: [{ ...greenCheck, conclusion: 'failure' }], requiredChecks: required, requiredApprovalCount: 1 }).satisfied, false);
  assert.equal(requiredChecksSatisfied({ checks: [{ ...greenCheck, status: 'in_progress', conclusion: null }], requiredChecks: required, requiredApprovalCount: 1 }).satisfied, false);
  // A pinned App identity must match; another App's success is not enough.
  assert.equal(requiredChecksSatisfied({ checks: [{ ...greenCheck, app: { id: 999 } }], requiredChecks: required, requiredApprovalCount: 1 }).satisfied, false);
  assert.equal(requiredChecksSatisfied({ checks: [greenCheck], requiredChecks: [] }).satisfied, false);
});

test('an authorized outstanding change request blocks the merge', () => {
  const reviews = [{ user: { login: 'reviewer', type: 'User' }, state: 'CHANGES_REQUESTED', submitted_at: '2026-11-15T00:00:00Z' }];
  assert.equal(blockingReviewPresent({ reviews, reviewerPermissions: { reviewer: 'write' } }), true);
  assert.equal(protectedMergeReadiness({ pr: openPr, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required, requiredApprovalCount: 1, reviews, reviewerPermissions: { reviewer: 'write' } }).ready, false);
  // A read-only reviewer cannot block, and a later approval supersedes it.
  assert.equal(blockingReviewPresent({ reviews, reviewerPermissions: { reviewer: 'read' } }), false);
  const superseded = [...reviews, { user: { login: 'reviewer' }, state: 'APPROVED', submitted_at: '2026-11-15T01:00:00Z' }];
  assert.equal(blockingReviewPresent({ reviews: superseded, reviewerPermissions: { reviewer: 'write' } }), false);
});

test('an unknown reviewer permission fails closed and still blocks the merge', () => {
  const reviews = [{ user: { login: 'mystery', type: 'User' }, state: 'CHANGES_REQUESTED', submitted_at: '2026-11-15T00:00:00Z' }];
  // Missing permission entry (unresolvable) must not be treated as harmless.
  assert.equal(blockingReviewPresent({ reviews, reviewerPermissions: {} }), true);
  assert.equal(blockingReviewPresent({ reviews, reviewerPermissions: { mystery: 'unknown' } }), true);
  assert.equal(protectedMergeReadiness({ pr: openPr, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required, requiredApprovalCount: 1, reviews, reviewerPermissions: {} }).ready, false);
  // Only a definitively powerless reviewer (read/none) is ignored.
  assert.equal(blockingReviewPresent({ reviews, reviewerPermissions: { mystery: 'none' } }), false);
});

test('readiness fails closed when the required approval count is not verifiable', () => {
  for (const requiredApprovalCount of [undefined, 0, -1, 1.5, NaN]) {
    const result = protectedMergeReadiness({ pr: openPr, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required, requiredApprovalCount });
    assert.equal(result.ready, false, String(requiredApprovalCount));
  }
  const truncated = Array.from({ length: 100 }, (_, i) => ({ user: { login: 'c' + i }, state: 'COMMENTED' }));
  assert.equal(protectedMergeReadiness({ pr: openPr, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required, requiredApprovalCount: 1, reviews: truncated }).ready, false);
});

const approve = (login, extra = {}) => ({ user: { login, type: 'User' }, state: 'APPROVED', commit_id: HEAD, submitted_at: '2026-11-15T02:00:00Z', ...extra });

test('merge requires the configured number of independent authorized approvals on the exact head', () => {
  const perms = { verifier: 'write', second: 'maintain' };
  assert.equal(approvalsSatisfied({ pr: openPr, expectedHeadSha: HEAD, reviews: [approve('verifier')], reviewerPermissions: perms, requiredApprovalCount: 1 }).satisfied, true);
  const short = approvalsSatisfied({ pr: openPr, expectedHeadSha: HEAD, reviews: [approve('verifier')], reviewerPermissions: perms, requiredApprovalCount: 2 });
  assert.equal(short.satisfied, false);
  assert.equal(short.approvals, 1);
  assert.equal(approvalsSatisfied({ pr: openPr, expectedHeadSha: HEAD, reviews: [approve('verifier'), approve('second')], reviewerPermissions: perms, requiredApprovalCount: 2 }).satisfied, true);
  assert.equal(approvalsSatisfied({ pr: openPr, expectedHeadSha: HEAD, reviews: [], reviewerPermissions: perms, requiredApprovalCount: 1 }).satisfied, false);
});

test('approvals that cannot satisfy protected review are not counted', () => {
  const count = (reviews, reviewerPermissions) =>
    approvalsSatisfied({ pr: openPr, expectedHeadSha: HEAD, reviews, reviewerPermissions, requiredApprovalCount: 1 }).approvals;
  assert.equal(count([approve('paris-author')], { 'paris-author': 'admin' }), 0, 'author self-approval');
  assert.equal(count([approve('reviewer', { commit_id: 'b'.repeat(40) })], { reviewer: 'write' }), 0, 'stale head');
  assert.equal(count([approve('reviewer')], { reviewer: 'read' }), 0, 'read-only reviewer');
  assert.equal(count([approve('reviewer')], {}), 0, 'unverified permission');
  assert.equal(count([approve('ci[bot]', { user: { login: 'ci[bot]', type: 'Bot' } })], { 'ci[bot]': 'write' }), 0, 'bot');
  assert.equal(count([approve('reviewer', { submitted_at: undefined })], { reviewer: 'write' }), 0, 'undated');
  assert.equal(count([approve('reviewer'), { user: { login: 'reviewer' }, state: 'DISMISSED', submitted_at: '2026-11-15T03:00:00Z' }], { reviewer: 'write' }), 0, 'dismissed later');
  assert.equal(count([approve('reviewer'), { user: { login: 'reviewer' }, state: 'COMMENTED', submitted_at: '2026-11-15T03:00:00Z' }], { reviewer: 'write' }), 1, 'comment keeps approval');
});

test('the merge script proves required approvals after its own review and before merging', async () => {
  const { readFileSync } = await import('node:fs');
  const script = readFileSync(new URL('../../scripts/paris-protected-merge.mjs', import.meta.url), 'utf8');
  assert.match(script, /protectedMergeReadiness\(\{[^}]*requiredApprovalCount/);
  const approvePost = script.indexOf("event: 'APPROVE'");
  const proof = script.indexOf('approvalsSatisfied({');
  const merge = script.indexOf('/merge`');
  assert.ok(approvePost > 0 && proof > approvePost && merge > proof, 'approval proof must sit between the verifier review and the merge');
  assert.match(script, /PARIS_MERGE_APPROVALS_INSUFFICIENT/);
});
