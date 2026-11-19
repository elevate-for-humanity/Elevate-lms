import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectExactMainCI, requireExactLmsCI, validateLmsReleaseIdentity } from './require-exact-lms-ci.mjs';
import { readFileSync } from 'node:fs';

const sha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);
const token = 'test-token';
const env = { GITHUB_REPOSITORY: 'elevate-for-humanity/Elevate-lms', GITHUB_REF: 'refs/heads/main',
  GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_SHA: sha, GH_TOKEN: token };
const ci = { id: 123, status: 'completed', conclusion: 'success', head_sha: sha,
  name: 'CI', event: 'push', path: '.github/workflows/ci.yml', head_branch: 'main', head_repository: { full_name: env.GITHUB_REPOSITORY } };
const job = { name: 'CI Required Gate', status: 'completed', conclusion: 'success' };
const reply = value => ({ ok: true, status: 200, json: async () => value });
function fixture({ head = sha, runs = [ci], jobs = [job] } = {}) {
  const calls = [];
  const request = async (url, options) => {
    calls.push(url);
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer ' + token);
    if (url.endsWith('/git/ref/heads/main')) return reply({ object: { sha: head } });
    if (url.includes('/actions/workflows/ci.yml/runs?')) return reply({ workflow_runs: runs });
    if (url.includes('/actions/runs/123/jobs?')) return reply({ jobs });
    throw new Error('Unexpected GitHub API request: ' + url);
  };
  return { request, calls };
}

test('only an authorized exact-main trusted workflow can proceed', () => {
  assert.equal(validateLmsReleaseIdentity(env), sha);
  for (const patch of [{ GITHUB_REF: 'refs/heads/work' }, { GITHUB_EVENT_NAME: 'pull_request' },
    { GITHUB_SHA: otherSha.slice(0, 10) }, { GH_TOKEN: '' }, { GITHUB_REPOSITORY: 'other/repo' }]) {
    assert.throws(() => validateLmsReleaseIdentity({ ...env, ...patch }), /IDENTITY_REQUIRED/);
  }
});

test('passes only after same exact SHA push workflow and successful required gate readback', async () => {
  const { request, calls } = fixture();
  const result = await inspectExactMainCI({ sha, token, request });
  assert.deepEqual(result, { status: 'verified', sha, runId: 123, gate: 'CI Required Gate' });
  assert.equal(calls.filter(url => url.endsWith('/git/ref/heads/main')).length, 2);
});

test('rejects failing CI even if build and deployment workflow succeeded', async () => {
  const { request } = fixture({ runs: [{ ...ci, conclusion: 'failure' }] });
  await assert.rejects(inspectExactMainCI({ sha, token, request }), /REQUIRED_CI_FAILED/);
});

test('fails closed for required gate failure and missing gate', async () => {
  for (const jobs of [[{ ...job, conclusion: 'failure' }], [{ name: 'Lint', status: 'completed', conclusion: 'success' }]]) {
    await assert.rejects(inspectExactMainCI({ sha, token, request: fixture({ jobs }).request }),
      /GATE_(FAILED|MISSING)/);
  }
});

test('does not substitute a successful PR, other SHA, branch or unrelated workflow', async () => {
  const runs = [
    { ...ci, id: 124, event: 'pull_request' },
    { ...ci, id: 125, head_sha: otherSha },
    { ...ci, id: 126, head_branch: 'work' },
    { ...ci, id: 127, name: 'Other CI' },
  ];
  const result = await inspectExactMainCI({ sha, token, request: fixture({ runs }).request });
  assert.equal(result.status, 'pending');
});

test('rejects main SHA changes both before and after checking CI', async () => {
  await assert.rejects(inspectExactMainCI({ sha, token, request: fixture({ head: otherSha }).request }), /MAIN_CHANGED/);
  const { request } = fixture();
  let reads = 0;
  await assert.rejects(inspectExactMainCI({ sha, token, request: (url, opts) => {
    if (url.endsWith('/git/ref/heads/main') && ++reads === 2) return Promise.resolve(reply({ object: { sha: otherSha } }));
    return request(url, opts);
  } }), /MAIN_CHANGED/);
});

test('waits for pending CI and times out closed without dispatching any release', async () => {
  let sleeps = 0;
  const result = await requireExactLmsCI(env, { request: fixture({ runs: [{ ...ci, status: 'in_progress', conclusion: null }] }).request,
    attempts: 2, intervalMs: 1, sleep: async () => { sleeps += 1; } }).catch(error => error.message);
  assert.equal(result, 'LMS_RELEASE_REQUIRED_CI_TIMEOUT');
  assert.equal(sleeps, 1);
});

test('release workflow requires exact main gate before build and deploy', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/deploy-google-lms-trigger.yml', import.meta.url), 'utf8');
  const gateStart = workflow.indexOf('  ci-required:');
  const buildStart = workflow.indexOf('  build:');
  assert.ok(gateStart > 0 && buildStart > gateStart);
  assert.match(workflow.slice(gateStart, buildStart), /node scripts\/gcp\/require-exact-lms-ci\.mjs/);
  assert.match(workflow.slice(buildStart, workflow.indexOf('  deploy:')), /needs: \[validate, ci-required\]/);
  assert.match(workflow.slice(workflow.indexOf('  release-result:')), /needs: \[validate, ci-required, build, deploy, acceptance\]/);
});

test('the same full CI dispatched on exact repository main satisfies release after a workflow-token merge', async () => {
  const r = await inspectExactMainCI({ sha, token, request: fixture({ runs: [{ ...ci, event: 'workflow_dispatch' }] }).request });
  assert.equal(r.status, 'verified');
});
test('a newer failed dispatch cannot be replaced by an older green push CI', async () => {
  await assert.rejects(inspectExactMainCI({ sha, token, request: fixture({ runs: [ci, { ...ci, id: 124, event: 'workflow_dispatch', conclusion: 'failure' }] }).request }), /REQUIRED_CI_FAILED:124/);
});
test('fork, missing workflow path and untrusted event runs cannot establish exact-main CI', async () => {
  for (const patch of [{ head_repository: { full_name: 'attacker/fork' } }, { path: undefined }, { event: 'pull_request_target' }]) {
    const r = await inspectExactMainCI({ sha, token, request: fixture({ runs: [{ ...ci, ...patch }] }).request });
    assert.equal(r.status, 'pending');
  }
});
