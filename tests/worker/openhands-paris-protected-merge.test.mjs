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
  [`/commits/${HEAD}/statuses?per_page=100`]: [],
  '/collaborators/human/permission': { permission: 'write' },
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
    if (unreachable.includes(path)) throw Object.assign(Error('GitHub API 404: Not Found'), { status: 404, policyAbsent: path === '/branches/main/protection' });
    if (!(path in data)) throw Error('unavailable');
    return data[path];
  };
}

test('actual PARIS release verifier accepts a protected merged exact PR with independent review', async () => {
  const outcome = await verifyProtectedParisMerge({ pr, expectedHeadSha: HEAD, gh: github() });
  assert.equal(outcome.accepted, true, JSON.stringify(outcome.reasons));
});

test('a classic-only and ruleset-only protected main are recognized', async () => {
  const classicOnly = await verifyProtectedParisMerge({
    pr, expectedHeadSha: HEAD, gh: github({ '/rules/branches/main': [] }),
  });
  assert.equal(classicOnly.accepted, true, JSON.stringify(classicOnly.reasons));
  const rulesOnly = await verifyProtectedParisMerge({
    pr, expectedHeadSha: HEAD, gh: github({}, ['/branches/main/protection']),
  });
  assert.equal(rulesOnly.accepted, true, JSON.stringify(rulesOnly.reasons));
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

test('required commit status contexts are accepted only when latest state succeeded', async () => {
  const path = `/commits/${HEAD}/statuses?per_page=100`;
  const policy = [
    { type: 'pull_request', parameters: { required_approving_review_count: 1 } },
    { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'external-ci' }] } },
  ];
  const classic = { required_pull_request_reviews: { required_approving_review_count: 1 } };
  const base = {
    '/rules/branches/main': policy,
    '/branches/main/protection': classic,
  };
  const pass = github({
    ...base, [path]: [{ context: 'external-ci', state: 'success' }],
  });
  assert.equal((await verifyProtectedParisMerge({ pr, expectedHeadSha: HEAD, gh: pass })).accepted, true);
  for (const statuses of [
    [{ context: 'external-ci', state: 'failure' }],
    [{ context: 'external-ci', state: 'pending' }],
    [],
    Array.from({ length: 100 }, () => ({ context: 'external-ci', state: 'success' })),
  ]) {
    const fail = github({ ...base, [path]: statuses });
    assert.equal((await verifyProtectedParisMerge({ pr, expectedHeadSha: HEAD, gh: fail })).accepted, false);
  }
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

test('PARIS reviewer permission and unresolved change requests block protected acceptance', async () => {
  const permissionPath = '/collaborators/human/permission';
  for (const permission of ['read', 'triage', 'unknown']) {
    const result = await verifyProtectedParisMerge({
      pr, expectedHeadSha: HEAD, gh: github({ [permissionPath]: { permission } }),
    });
    assert.equal(result.accepted, false);
  }
  const requested = { user: { login: 'reviewer-two', type: 'User' },
    state: 'CHANGES_REQUESTED', commit_id: HEAD, submitted_at: '2026-11-14T02:00:00Z' };
  const result = await verifyProtectedParisMerge({
    pr, expectedHeadSha: HEAD, gh: github({
      '/pulls/2613/reviews?per_page=100': [...fixtures['/pulls/2613/reviews?per_page=100'], requested],
      '/collaborators/reviewer-two/permission': { permission: 'write' },
    }),
  });
  assert.equal(result.accepted, false);
  assert.match(result.reasons.join(' '), /Outstanding changes requested/);
});

test('PARIS requires all independent protected approvals, not merely one', async () => {
  const result = await verifyProtectedParisMerge({
    pr, expectedHeadSha: HEAD, gh: github({
      '/branches/main/protection': {
        required_pull_request_reviews: { required_approving_review_count: 2 },
        required_status_checks: { checks: [{ context: 'CI Required Gate' }] },
      },
    }),
  });
  assert.equal(result.accepted, false);
});

test('read errors other than confirmed policy absence cannot weaken protection', async () => {
  const policyRead403 = async path => {
    if (path === '/rules/branches/main') {
      throw Object.assign(Error('GitHub API 403: Forbidden'), { status: 403 });
    }
    return github()(path);
  };
  const result = await verifyProtectedParisMerge({
    pr, expectedHeadSha: HEAD, gh: github(), policyGh: policyRead403,
  });
  assert.equal(result.accepted, false);
  assert.match(result.reasons.join(' '), /PARIS_PROTECTED_PR_VERIFICATION_UNAVAILABLE/);
});

test('required App ID cannot be satisfied by an unrelated green check context', async () => {
  const checkPath = `/commits/${HEAD}/check-runs?per_page=100`;
  const policy = [
    { type: 'pull_request', parameters: { required_approving_review_count: 1 } },
    { type: 'required_status_checks', parameters: {
      required_status_checks: [{ context: 'CI Required Gate', app_id: 17 }],
    } },
  ];
  const input = { pr, expectedHeadSha: HEAD };
  const oldApp = await verifyProtectedParisMerge({
    ...input, gh: github({
      '/rules/branches/main': policy,
      [checkPath]: { check_runs: [{ name: 'CI Required Gate', status: 'completed', conclusion: 'success', app: { id: 18 } }] },
    }),
  });
  assert.equal(oldApp.accepted, false);
  const correctApp = await verifyProtectedParisMerge({
    ...input, gh: github({
      '/rules/branches/main': policy,
      [checkPath]: { check_runs: [{ name: 'CI Required Gate', status: 'completed', conclusion: 'success', app: { id: 17 } }] },
    }),
  });
  assert.equal(correctApp.accepted, true, JSON.stringify(correctApp.reasons));
});

test('ambiguous policy 404 remains blocking instead of being treated as absence', async () => {
  for (const path of ['/rules/branches/main', '/branches/main/protection']) {
    const result = await verifyProtectedParisMerge({
      pr, expectedHeadSha: HEAD, gh: github(), policyGh: async requested => {
        if (requested === path) throw Object.assign(Error('Not Found'), { status: 404 });
        return github()(requested);
      },
    });
    assert.equal(result.accepted, false);
    assert.match(result.reasons.join(' '), /VERIFICATION_UNAVAILABLE/);
  }
});

test('PARIS keeps authorized approvals when a known reader requests changes', async () => {
  const requested = { user: { login: 'reader', type: 'User' }, state: 'CHANGES_REQUESTED',
    commit_id: HEAD, submitted_at: '2026-11-14T02:00:00Z' };
  for (const permission of ['read', 'triage', 'none']) {
    const result = await verifyProtectedParisMerge({
      pr, expectedHeadSha: HEAD, gh: github({
        '/pulls/2613/reviews?per_page=100': [...fixtures['/pulls/2613/reviews?per_page=100'], requested],
        '/collaborators/reader/permission': { permission },
      }),
    });
    assert.equal(result.accepted, true, JSON.stringify(result.reasons));
  }
});
