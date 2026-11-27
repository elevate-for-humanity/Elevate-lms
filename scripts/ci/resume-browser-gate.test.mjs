import assert from 'node:assert/strict';
import test from 'node:test';
import { resumeBrowserGate } from './resume-browser-gate.mjs';
const repository = 'elevate-for-humanity/Elevate-lms', sha = 'a'.repeat(40), branch = 'fix/memory';
const identity = { head_sha: sha, head_branch: branch, head_repository: { full_name: repository }, event: 'pull_request' };
const ci = { ...identity, repository: { full_name: repository }, id: 100, path: '.github/workflows/ci.yml', status: 'completed', conclusion: 'failure', run_attempt: 1 };
const browser = { ...identity, id: 200, path: '.github/workflows/e2e-desktop-chrome.yml', status: 'completed', conclusion: 'success', repository: { full_name: repository } };
const pr = { number: 42, state: 'open', head: { sha, ref: branch, repo: { full_name: repository } }, base: { ref: 'main', repo: { full_name: repository } } };
const expected = ['CI Preflight', 'TypeScript — marketing', 'TypeScript — admin', 'TypeScript — lms', 'Lint', 'Canonical Enrollment Database', 'Website edit transactions', 'Functional Tests & Repo Hygiene'];
const jobs = [...expected.map(name => ({ name, status: 'completed', conclusion: 'success' })), {
  id: 999, name: 'CI Required Gate', status: 'completed', conclusion: 'failure', steps: [
    { name: 'Require every CI diagnostic to pass', conclusion: 'success' },
    { name: 'Require completed exact-head browser acceptance for pull requests', conclusion: 'failure' },
  ],
}];
const browserJobs = ['E2E desktop-chrome', ...[1, 2, 3, 4].map(n => `E2E desktop-chrome shard ${n}/4`), 'Public Host Shop navigation and application (five devices)', 'Email device browsers'].map(name => ({ name, status: 'completed', conclusion: 'success' }));
function harness(changes = {}, eventId = 200) {
  const posts = [], reads = [];
  const request = async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (options.method === 'POST') { posts.push(path); return { ok: true, status: 201 }; }
    reads.push(path);
    const routes = {
      '/actions/runs/200': browser,
      [`/commits/${sha}/pulls`]: [pr],
      '/actions/workflows/ci.yml/runs': { workflow_runs: [ci] },
      '/actions/runs/100/jobs': { jobs, total_count: jobs.length },
      '/actions/workflows/e2e-desktop-chrome.yml/runs': { workflow_runs: [browser] },
      '/actions/runs/200/jobs': { jobs: browserJobs, total_count: browserJobs.length },
      '/pulls/42': pr,
      '/actions/runs/100': ci,
      ...changes,
    };
    const value = routes[path.replace(`/repos/${repository}`, '')];
    if (value === undefined) throw Error('Unexpected API call ' + path);
    return { ok: true, status: 200, json: async () => structuredClone(typeof value === 'function' ? value(reads) : value) };
  };
  return { posts, reads, run: () => resumeBrowserGate({ repository, token: 'test-only', event: { workflow_run: { id: eventId } }, request }) };
}
test('only the failed receipt is retried after all exact-head browser and CI evidence passes', async () => {
  const h = harness(); const result = await h.run();
  assert.equal(result.state, 'resumed');
  assert.deepEqual(h.posts, [`/repos/${repository}/actions/jobs/999/rerun`]);
});
test('already retried CI cannot create an automatic rerun loop', async () => {
  const h = harness({ '/actions/workflows/ci.yml/runs': { workflow_runs: [{ ...ci, run_attempt: 2 }] } });
  assert.equal((await h.run()).state, 'ignored'); assert.equal(h.posts.length, 0);
});
test('failed, absent or skipped diagnostics never become green through a receipt retry', async () => {
  for (const selected of [jobs.slice(1), jobs.map((job, i) => i === 0 ? { ...job, conclusion: 'failure' } : job), jobs.map((job, i) => i === 0 ? { ...job, conclusion: 'skipped' } : job)]) {
    const h = harness({ '/actions/runs/100/jobs': { jobs: selected, total_count: selected.length } });
    assert.equal((await h.run()).state, 'ignored'); assert.equal(h.posts.length, 0);
  }
});
test('pending and failed browsers release the finalizer without any retry', async () => {
  for (const change of [{ status: 'in_progress', conclusion: null }, { conclusion: 'failure' }]) {
    const h = harness({ '/actions/workflows/e2e-desktop-chrome.yml/runs': { workflow_runs: [{ ...browser, ...change }] } });
    assert.equal((await h.run()).reason, 'BROWSERS_NOT_GREEN'); assert.equal(h.posts.length, 0);
  }
});
test('newer failed browser attempt blocks an earlier passing browser run', async () => {
  const h = harness({ '/actions/workflows/e2e-desktop-chrome.yml/runs': { workflow_runs: [{ ...browser, id: 201, conclusion: 'failure' }, browser] } });
  assert.equal((await h.run()).state, 'ignored'); assert.equal(h.posts.length, 0);
});
test('closed, retargeted and changed-head PRs are not enqueued', async () => {
  for (const change of [{ state: 'closed' }, { head: { ...pr.head, sha: 'b'.repeat(40) } }, { base: { ...pr.base, ref: 'work' } }]) {
    const h = harness({ [`/commits/${sha}/pulls`]: [{ ...pr, ...change }] });
    assert.equal((await h.run()).state, 'ignored'); assert.equal(h.posts.length, 0);
  }
});
test('wrong source repository or workflow cannot cause a privileged retry', async () => {
  for (const change of [{ repository: { full_name: 'other/repo' } }, { path: '.github/workflows/untrusted.yml' }, { event: 'workflow_dispatch' }]) {
    const h = harness({ '/actions/runs/200': { ...browser, ...change } });
    assert.equal((await h.run()).state, 'ignored'); assert.equal(h.posts.length, 0);
  }
});
test('incomplete job inventory and changed live PR fail closed before writing', async () => {
  const a = harness({ '/actions/runs/100/jobs': { jobs, total_count: jobs.length + 1 } });
  await assert.rejects(a.run(), /JOBS_INCOMPLETE/); assert.equal(a.posts.length, 0);
  const b = harness({ '/pulls/42': { ...pr, head: { ...pr.head, sha: 'b'.repeat(40) } } });
  await assert.rejects(b.run(), /PR_HEAD_OR_BASE_CHANGED/); assert.equal(b.posts.length, 0);
});
test('a concurrent rerun cannot be retried a second time', async () => {
  const h = harness({ '/actions/runs/100': { ...ci, run_attempt: 2 } });
  await assert.rejects(h.run(), /RUN_CHANGED/); assert.equal(h.posts.length, 0);
});
test('missing required browser job cannot certify receipt', async () => {
  const partial = browserJobs.slice(1);
  const h = harness({ '/actions/runs/200/jobs': { jobs: partial, total_count: partial.length } });
  await assert.rejects(h.run(), /REQUIRED_JOB_NOT_SUCCESSFUL/); assert.equal(h.posts.length, 0);
});

test('CI completion resumes the receipt when browsers finished first', async () => {
  const h = harness({}, 100);
  assert.equal((await h.run()).state, 'resumed');
  assert.equal(h.posts.length, 1);
});
test('an old CI completion cannot retry a newer or incomplete CI run', async () => {
  const h = harness({ '/actions/workflows/ci.yml/runs': { workflow_runs: [{ ...ci, id: 101 }] } }, 100);
  assert.equal((await h.run()).state, 'ignored'); assert.equal(h.posts.length, 0);
  const pending = harness({ '/actions/workflows/ci.yml/runs': { workflow_runs: [{ ...ci, status: 'in_progress', conclusion: null }] } });
  assert.equal((await pending.run()).state, 'ignored'); assert.equal(pending.posts.length, 0);
});
