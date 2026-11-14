import test from 'node:test';
import assert from 'node:assert/strict';
import { readGitHubBranchPolicy } from '../lib/devstudio/github-branch-policy.mjs';

test('uses a fixed read-only endpoint and returns only policy fields', async () => {
  const result = await readGitHubBranchPolicy('private-test-token', async (url, options) => {
    assert.equal(url, 'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/branches/main/protection');
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer private-test-token');
    return { ok: true, status: 200, json: async () => ({
      required_status_checks: { strict: true, checks: [{ context: 'CI Required Gate', app_id: 15368 }] },
      required_pull_request_reviews: { required_approving_review_count: 1, dismiss_stale_reviews: true },
      allow_force_pushes: { enabled: false }, unexpectedSecret: 'never-return-this',
    }) };
  });
  assert.equal(result.policy.requiredApprovals, 1);
  assert.equal(result.policy.upToDateRequired, true);
  assert.equal(result.policy.forcePushesAllowed, false);
  assert.equal(JSON.stringify(result).includes('never-return-this'), false);
  assert.equal(JSON.stringify(result).includes('private-test-token'), false);
});

test('missing App configuration never sends a request', async () => {
  const result = await readGitHubBranchPolicy(null, () => { throw Error('must not call'); });
  assert.equal(result.reason, 'github_app_not_configured');
});

test('permission denial returns a safe failure without reading the upstream body', async () => {
  const result = await readGitHubBranchPolicy('private-test-token', async () => ({ ok: false, status: 403,
    json: () => { throw Error('must not read'); } }));
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'github_app_administration_read_required');
});
