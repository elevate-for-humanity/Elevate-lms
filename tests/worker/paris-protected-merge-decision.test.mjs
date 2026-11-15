import test from 'node:test';
import assert from 'node:assert/strict';
import {protectedMergeReadiness,requiredChecksSatisfied,blockingReviewPresent} from '../../lib/devstudio/openhands/protected-merge-decision.mjs';

const HEAD = 'a'.repeat(40);
const openPr = { number: 42, state: 'open', draft: false, merged: false, base: { ref: 'main' },
  head: { sha: HEAD }, user: { login: 'paris-author' } };
const greenCheck = { name: 'CI Required Gate', status: 'completed', conclusion: 'success', app: { id: 15368 } };
const required = [{ context: 'CI Required Gate', app_id: 15368 }];

test('a validated, green, unblocked PR is ready to merge', () => {
  const result = protectedMergeReadiness({ pr: openPr, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required });
  assert.equal(result.ready, true, JSON.stringify(result.reasons));
});

test('a moved head, draft, or non-main base blocks the merge', () => {
  assert.equal(protectedMergeReadiness({ pr: openPr, expectedHeadSha: 'b'.repeat(40), checks: [greenCheck], requiredChecks: required }).ready, false);
  assert.equal(protectedMergeReadiness({ pr: { ...openPr, draft: true }, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required }).ready, false);
  assert.equal(protectedMergeReadiness({ pr: { ...openPr, base: { ref: 'release' } }, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required }).ready, false);
});

test('a missing or failing required check blocks the merge', () => {
  assert.equal(requiredChecksSatisfied({ checks: [], requiredChecks: required }).satisfied, false);
  assert.equal(requiredChecksSatisfied({ checks: [{ ...greenCheck, conclusion: 'failure' }], requiredChecks: required }).satisfied, false);
  assert.equal(requiredChecksSatisfied({ checks: [{ ...greenCheck, status: 'in_progress', conclusion: null }], requiredChecks: required }).satisfied, false);
  // A pinned App identity must match; another App's success is not enough.
  assert.equal(requiredChecksSatisfied({ checks: [{ ...greenCheck, app: { id: 999 } }], requiredChecks: required }).satisfied, false);
  assert.equal(requiredChecksSatisfied({ checks: [greenCheck], requiredChecks: [] }).satisfied, false);
});

test('an authorized outstanding change request blocks the merge', () => {
  const reviews = [{ user: { login: 'reviewer', type: 'User' }, state: 'CHANGES_REQUESTED', submitted_at: '2026-11-15T00:00:00Z' }];
  assert.equal(blockingReviewPresent({ reviews, reviewerPermissions: { reviewer: 'write' } }), true);
  assert.equal(protectedMergeReadiness({ pr: openPr, expectedHeadSha: HEAD, checks: [greenCheck], requiredChecks: required, reviews, reviewerPermissions: { reviewer: 'write' } }).ready, false);
  // A read-only reviewer cannot block, and a later approval supersedes it.
  assert.equal(blockingReviewPresent({ reviews, reviewerPermissions: { reviewer: 'read' } }), false);
  const superseded = [...reviews, { user: { login: 'reviewer' }, state: 'APPROVED', submitted_at: '2026-11-15T01:00:00Z' }];
  assert.equal(blockingReviewPresent({ reviews: superseded, reviewerPermissions: { reviewer: 'write' } }), false);
});
