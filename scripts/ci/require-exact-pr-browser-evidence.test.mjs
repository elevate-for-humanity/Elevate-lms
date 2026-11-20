import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectExactPrBrowserEvidence } from './require-exact-pr-browser-evidence.mjs';

const sha = 'a'.repeat(40);
const repository = 'elevate-for-humanity/Elevate-lms';
const headBranch = 'fix/required-test';
const run = { id: 123, head_sha: sha, head_branch: headBranch, head_repository: { full_name: repository },
  path: '.github/workflows/e2e-desktop-chrome.yml', event: 'pull_request', status: 'completed', conclusion: 'success' };
const names = ['E2E desktop-chrome', 'Public Host Shop navigation and application (five devices)', 'Email device browsers'];
const jobs = names.map(name => ({ name, status: 'completed', conclusion: 'success' }));
const inspect = (runs = [run], checkedJobs = jobs) => inspectExactPrBrowserEvidence({
  runs, jobs: checkedJobs, repository, headSha: sha, headBranch,
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
