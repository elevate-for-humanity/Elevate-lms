import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyProtectedParisMerge } from '../../lib/devstudio/openhands/paris-protected-merge.mjs';

const HEAD = 'a'.repeat(40), MERGE = 'b'.repeat(40), MAIN = 'c'.repeat(40);
const pr = { number: 2613, merged: true, merged_at: '2026-11-14T00:00:00Z',
  merge_commit_sha: MERGE, head: { sha: HEAD }, base: { ref: 'main' }, user: { login: 'author' } };
const fixtures = {
  '/pulls/2613/reviews?per_page=100': [{ user: { login: 'human', type: 'User' }, state: 'APPROVED',
    commit_id: HEAD, submitted_at: '2026-11-14T01:00:00Z' }],
  [`/commits/${HEAD}/check-runs?per_page=100`]: { check_runs: [{ name: 'CI Required Gate', status: 'completed', conclusion: 'success' }] },
  '/git/ref/heads/main': { object: { sha: MAIN } },
  [`/compare/${MERGE}...${MAIN}`]: { status: 'ahead' },
  '/rules/branches/main': [
    { type: 'pull_request', parameters: { required_approving_review_count: 1 } },
    { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'CI Required Gate' }] } },
  ],
  '/branches/main/protection': { required_pull_request_reviews: { required_approving_review_count: 1 },
    required_status_checks: { checks: [{ context: 'CI Required Gate' }] } },
};
function github(overrides = {}, unreachable = []) {
  const data = { ...fixtures, ...overrides };
  return async path => {
    if (unreachable.includes(path) || !(path in data)) throw Error('unavailable');
    return data[path];
  };
}

test('actual PARIS release verifier accepts a protected merged exact PR with independent review', async () => {
  const outcome = await verifyProtectedParisMerge({ pr, expectedHeadSha: HEAD, gh: github() });
  assert.equal(outcome.accepted, true, JSON.stringify(outcome.reasons));
});

test('a classic-only and ruleset-only protected main are recognized', async () => {
  for (const missing of ['/rules/branches/main', '/branches/main/protection']) {
    const outcome = await verifyProtectedParisMerge({ pr, expectedHeadSha: HEAD, gh: github({}, [missing]) });
    assert.equal(outcome.accepted, true, missing);
  }
});

test('no readable protection, no independent review, or failed checks block deployment', async () => {
  for (const gh of [
    github({}, ['/rules/branches/main', '/branches/main/protection']),
    github({ '/pulls/2613/reviews?per_page=100': [] }),
    github({ [`/commits/${HEAD}/check-runs?per_page=100`]: { check_runs: [{ status: 'completed', conclusion: 'failure' }] } }),
  ]) {
    assert.equal((await verifyProtectedParisMerge({ pr, expectedHeadSha: HEAD, gh })).accepted, false);
  }
});

test('policy checks use separate App-authenticated reader, not workflow-scoped token', async () => {
  const workflowGh = github({}, ['/rules/branches/main', '/branches/main/protection']);
  const appPolicyGh = github();
  const result = await verifyProtectedParisMerge({
    pr, expectedHeadSha: HEAD, gh: workflowGh, policyGh: appPolicyGh,
  });
  assert.equal(result.accepted, true, JSON.stringify(result.reasons));
});

test('skipped operational jobs do not override approved required PR validation checks', async () => {
  const checkPath = `/commits/${HEAD}/check-runs?per_page=100`;
  const data = { check_runs: [
    { name: 'CI Required Gate', status: 'completed', conclusion: 'success' },
    { name: 'PBX preserve operation', status: 'completed', conclusion: 'skipped' },
  ] };
  assert.equal((await verifyProtectedParisMerge({
    pr, expectedHeadSha: HEAD, gh: github({ [checkPath]: data }),
  })).accepted, true);
  assert.equal((await verifyProtectedParisMerge({
    pr, expectedHeadSha: HEAD,
    gh: github({ [checkPath]: data,
      '/rules/branches/main': [
        { type: 'pull_request', parameters: { required_approving_review_count: 1 } },
        { type: 'required_status_checks', parameters: {
          required_status_checks: [{ context: 'PBX preserve operation' }],
        } },
      ],
      '/branches/main/protection': { required_pull_request_reviews: { required_approving_review_count: 1 } },
    }),
  })).accepted, false);
});

test('exact candidate, protected merge and main ancestry are mandatory', async () => {
  assert.equal((await verifyProtectedParisMerge({ pr, expectedHeadSha: MAIN, gh: github() })).accepted, false);
  assert.equal((await verifyProtectedParisMerge({
    pr: { ...pr, merged: false }, expectedHeadSha: HEAD, gh: github(),
  })).accepted, false);
  assert.equal((await verifyProtectedParisMerge({
    pr, expectedHeadSha: HEAD, gh: github({ [`/compare/${MERGE}...${MAIN}`]: { status: 'diverged' } }),
  })).accepted, false);
});
