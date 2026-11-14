import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import * as acceptance from '../../lib/devstudio/openhands/acceptance-contract.mjs';

const HEAD = 'a'.repeat(40), MERGE = 'b'.repeat(40);
const prefix = '/repos/elevate-for-humanity/Elevate-lms';
function verifier(overrides = {}) {
  const fixtures = {
    [prefix + '/pulls/42']: { number: 42, merged: true, merged_at: '2026-11-14T02:00:00Z',
      merge_commit_sha: MERGE, created_at: '2026-11-14T00:00:00Z', user: { login: 'author' },
      head: { sha: HEAD, ref: 'fix/review' }, base: { ref: 'main' } },
    [prefix + '/pulls/42/files?per_page=100']: [{ filename: 'lib/example.ts' }],
    [prefix + '/commits/' + HEAD + '/status']: { state: 'success' },
    [prefix + '/commits/' + HEAD + '/statuses?per_page=100']: [],
    [prefix + '/commits/' + HEAD + '/check-runs?per_page=100']: { check_runs: [
      { name: 'CI', status: 'completed', conclusion: 'success', app: { id: 99 } },
    ] },
    [prefix + '/pulls/42/reviews?per_page=100']: [{ user: { login: 'human', type: 'User' },
      state: 'APPROVED', commit_id: HEAD, submitted_at: '2026-11-14T01:00:00Z' }],
    [prefix + '/compare/' + MERGE + '...main']: { status: 'ahead' },
    [prefix + '/rules/branches/main']: [
      { type: 'pull_request', parameters: { required_approving_review_count: 1 } },
      { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'CI', integration_id: 99 }] } },
    ],
    [prefix + '/branches/main/protection']: { required_pull_request_reviews: { required_approving_review_count: 1 } },
    [prefix + '/collaborators/human/permission']: { permission: 'write' },
    ...overrides,
  };
  const context = vm.createContext({
    ...acceptance, process: { env: {} }, AbortSignal,
    getSecret: async () => undefined,
    getGitHubToken: async () => 'test-repo',
    getGitHubAppToken: async () => 'test-policy',
    fetch: async url => {
      const path = String(url).replace('https://api.github.com', '');
      assert.ok(path in fixtures, 'Unexpected GitHub API request: ' + path);
      const value = fixtures[path];
      return value instanceof Response ? value.clone() : new Response(JSON.stringify(value));
    },
  });
  const source = readFileSync(new URL('../../lib/devstudio/openhands/github-verifier.ts', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '');
  vm.runInContext(stripTypeScriptTypes(source).replace(/^export /gm, ''), context);
  return () => context.verifyOpenHandsGitHubOutcome({ prNumbers: [42], startedAt: '2026-11-13T00:00:00Z' });
}
test('actual OpenHands reader accepts only explicit classic policy absence', async () => {
  const classic = prefix + '/branches/main/protection';
  assert.equal((await verifier({ [classic]: new Response(JSON.stringify({ message: 'Branch not protected' }), { status: 404 }) })()).verified, true);
  for (const path of [classic, prefix + '/rules/branches/main']) {
    for (const status of [403, 404, 503]) {
      const result = await verifier({ [path]: new Response(JSON.stringify({ message: 'Not Found' }), { status }) })();
      assert.equal(result.verified, false);
    }
  }
});
test('actual OpenHands caller preserves ruleset App identity', async () => {
  assert.equal((await verifier()()).verified, true);
  const path = prefix + '/commits/' + HEAD + '/check-runs?per_page=100';
  assert.equal((await verifier({ [path]: { check_runs: [
    { name: 'CI', status: 'completed', conclusion: 'success', app: { id: 98 } },
  ] } })()).verified, false);
});
test('actual OpenHands caller distinguishes known nonblocking reviewers from missing authority', async () => {
  const path = prefix + '/pulls/42/reviews?per_page=100';
  const reviews = [
    { user: { login: 'human', type: 'User' }, state: 'APPROVED', commit_id: HEAD, submitted_at: '2026-11-14T01:00:00Z' },
    { user: { login: 'reader', type: 'User' }, state: 'CHANGES_REQUESTED', commit_id: HEAD, submitted_at: '2026-11-14T02:00:00Z' },
  ];
  for (const permission of ['read', 'triage', 'none']) {
    assert.equal((await verifier({ [path]: reviews, [prefix + '/collaborators/reader/permission']: { permission } })()).verified, true);
  }
  assert.equal((await verifier({ [path]: reviews, [prefix + '/collaborators/reader/permission']: {} })()).verified, false);
});
test('actual infrastructure reader marks explicit classic absence without masking other 404s', async () => {
  const file = readFileSync(new URL('../../lib/ai/runtime/code-repair.ts', import.meta.url), 'utf8');
  const source = file.slice(file.indexOf('async function infrastructureGitHub('), file.indexOf('export async function enqueueParisRepair('));
  for (const [path, message, absent] of [
    ['/branches/main/protection', 'Branch not protected', true],
    ['/branches/main/protection', 'Not Found', false],
    ['/rules/branches/main', 'Branch not protected', false],
  ]) {
    const context = vm.createContext({
      REPAIR_REPOSITORY: 'elevate-for-humanity/Elevate-lms', AbortSignal,
      getGitHubAppToken: async () => 'test-policy',
      fetch: async () => new Response(JSON.stringify({ message }), { status: 404 }),
    });
    vm.runInContext(stripTypeScriptTypes(source), context);
    await assert.rejects(context.infrastructureGitHub(path), error =>
      error.status === 404 && error.policyAbsent === absent);
  }
});
