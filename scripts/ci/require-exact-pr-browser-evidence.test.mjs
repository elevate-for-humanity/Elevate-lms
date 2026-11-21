import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectExactPrBrowserEvidence, verifyExactPrBrowserEvidence } from './require-exact-pr-browser-evidence.mjs';

const sha = 'a'.repeat(40);
const repository = 'elevate-for-humanity/Elevate-lms';
const headBranch = 'fix/required-test';
const run = { id: 123, head_sha: sha, head_branch: headBranch, head_repository: { full_name: repository },
  path: '.github/workflows/e2e-desktop-chrome.yml', event: 'pull_request', status: 'completed', conclusion: 'success' };
const names = ['E2E desktop-chrome', 'Public Host Shop navigation and application (five devices)', 'Email device browsers'];
const jobs = names.map(name => ({ name, status: 'completed', conclusion: 'success' }));
const inspect = (runs = [run], checkedJobs = jobs) => inspectExactPrBrowserEvidence({
  runs, jobs: checkedJobs, sourceRepository: repository, headSha: sha, headBranch,
});

test('passes only successful exact-head browser workflow with all required jobs', () => {
  assert.deepEqual(inspect(), { state: 'verified', runId: 123 });
});
test('missing run and in-progress run remain pending, never green', () => {
  assert.equal(inspect([], null).state, 'pending');
  assert.equal(inspect([{ ...run, status: 'in_progress', conclusion: null }], null).state, 'pending');
});
test('failed or cancelled latest run blocks despite earlier success', () => {
  assert.throws(() => inspect([{ ...run, id: 125, conclusion: 'failure' }, run]), /E2E_EXACT_HEAD_FAILED/);
  assert.throws(() => inspect([{ ...run, id: 125, conclusion: 'cancelled' }, run]), /E2E_EXACT_HEAD_FAILED/);
});
test('skipped, absent and incomplete browser jobs block', () => {
  assert.throws(() => inspect([run], jobs.slice(1)), /E2E_REQUIRED_JOB_NOT_SUCCESSFUL/);
  assert.throws(() => inspect([run], jobs.map((job, i) => i === 1 ? { ...job, conclusion: 'skipped' } : job)), /E2E_REQUIRED_JOB_NOT_SUCCESSFUL/);
  assert.throws(() => inspect([run], jobs.map((job, i) => i === 2 ? { ...job, status: 'in_progress' } : job)), /E2E_REQUIRED_JOB_NOT_SUCCESSFUL/);
});
test('wrong repository, branch, event, or SHA never satisfies this PR', () => {
  for (const change of [
    { head_sha: 'b'.repeat(40) }, { head_branch: 'other' },
    { event: 'workflow_dispatch' }, { head_repository: { full_name: 'other/repo' } },
  ]) assert.equal(inspect([{ ...run, ...change }], null).state, 'pending');
});
test('incomplete paginated evidence fails closed', () => {
  assert.throws(() => inspect(Array(100).fill(run)), /E2E_RUN_INVENTORY_INCOMPLETE/);
  assert.throws(() => inspect([run], Array(100).fill(jobs[0])), /E2E_JOB_INVENTORY_INCOMPLETE/);
});

const event = (base = 'main', source = repository) => ({
  pull_request: {
    number: 123, head: { sha, ref: headBranch, repo: { full_name: source } },
    base: { ref: base, repo: { full_name: repository } },
  },
});
const pr = (base = 'main', source = repository) => ({
  state: 'open', head: { sha, ref: headBranch, repo: { full_name: source } },
  base: { ref: base, repo: { full_name: repository } },
});
function mockApi(prResponse, runResponse) {
  const seen = [];
  const request = async url => {
    const path = new URL(url).pathname;
    seen.push(path);
    const response = path.endsWith('/pulls/123') ? prResponse
      : path.endsWith('/actions/runs/123/jobs') ? { jobs, total_count: jobs.length }
      : { workflow_runs: [runResponse] };
    return { ok: true, json: async () => response };
  };
  return { request, seen };
}

test('accepts a fork browser run by source repository identity, not base API repository', async () => {
  const fork = 'contributor/Elevate-lms';
  const { request, seen } = mockApi(pr('main', fork), {
    ...run, head_repository: { full_name: fork },
  });
  const result = await verifyExactPrBrowserEvidence({
    repository, event: event('main', fork), token: 'test-token', request,
    timeoutMs: 1000, pollMs: 1, sleep: async () => {},
  });
  assert.equal(result.state, 'verified');
  assert.equal(seen.length, 4);
});

test('non-main PR retains normal CI without requiring a main-only browser workflow', async () => {
  const { request, seen } = mockApi(pr('work'), run);
  const result = await verifyExactPrBrowserEvidence({
    repository, event: event('work'), token: 'test-token', request,
    timeoutMs: 1000, pollMs: 1, sleep: async () => {},
  });
  assert.equal(result.state, 'not-applicable');
  assert.deepEqual(seen, ['/repos/' + repository + '/pulls/123']);
});

test('retargeted non-main PR fails closed instead of reusing its prior CI receipt', async () => {
  const { request } = mockApi(pr('main'), run);
  await assert.rejects(
    verifyExactPrBrowserEvidence({ repository, event: event('work'), token: 'test-token', request }),
    /E2E_PR_HEAD_OR_BASE_CHANGED/,
  );
});

test('retargeted main PR or a changed source identity fails closed', async () => {
  const changedBase = mockApi(pr('work'), run);
  await assert.rejects(
    verifyExactPrBrowserEvidence({ repository, event: event('main'), token: 'test-token', request: changedBase.request }),
    /E2E_PR_HEAD_OR_BASE_CHANGED/,
  );
  const changedFork = mockApi(pr('main', 'other/Elevate-lms'), run);
  await assert.rejects(
    verifyExactPrBrowserEvidence({ repository, event: event('main'), token: 'test-token', request: changedFork.request }),
    /E2E_PR_HEAD_OR_BASE_CHANGED/,
  );
});

test('a PR head movement during evidence evaluation rejects previously successful browsers', async () => {
  let prReads = 0;
  const { request: fallback } = mockApi(pr(), run);
  const request = url => {
    if (new URL(url).pathname.endsWith('/pulls/123')) {
      prReads += 1;
      return Promise.resolve({ ok: true, json: async () =>
        prReads === 1 ? pr() : { ...pr(), head: { ...pr().head, sha: 'b'.repeat(40) } },
      });
    }
    return fallback(url);
  };
  await assert.rejects(verifyExactPrBrowserEvidence({
    repository, event: event(), token: 'test-token', request,
    timeoutMs: 1000, pollMs: 1,
  }), /E2E_PR_HEAD_OR_BASE_CHANGED/);
});

test('truncated or unverifiable jobs total count cannot certify browser acceptance', async () => {
  const response = async url => {
    const path = new URL(url).pathname;
    const data = path.endsWith('/pulls/123') ? pr()
      : path.endsWith('/actions/runs/123/jobs') ? { jobs, total_count: jobs.length + 1 }
      : { workflow_runs: [run] };
    return { ok: true, json: async () => data };
  };
  await assert.rejects(verifyExactPrBrowserEvidence({
    repository, event: event(), token: 'test-token', request: response,
    timeoutMs: 1000, pollMs: 1,
  }), /E2E_JOB_INVENTORY_INCOMPLETE/);
});
