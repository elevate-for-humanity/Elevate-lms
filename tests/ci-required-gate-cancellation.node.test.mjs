import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'js-yaml';
import { inspectExactPrBrowserEvidence } from '../scripts/ci/require-exact-pr-browser-evidence.mjs';
const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const gate = workflow.split('\n  ci-gate:')[1];
const dependencies = ['preflight', 'typecheck', 'lint', 'enrollment-database', 'website-database', 'diagnostics'];
const runBlock = gate
  .match(/^        run: \|\n((?: {10}[^\n]*\n)+)/m)?.[1]
  .replace(/^ {10}/gm, '');
assert.ok(runBlock, 'The CI required gate must contain its diagnostic shell block');
function execute(results) {
  const script = runBlock.replace(/\$\{\{ needs\.([\w-]+)\.result \}\}/g, (_, name) => results[name]);
  return spawnSync('bash', ['-e', '-c', script], { stdio: 'ignore' }).status;
}
test('cancelled workflows can stop while failed workflows still evaluate the required gate', () => {
  assert.match(gate, /if: \$\{\{ !cancelled\(\) \}\}/);
  assert.doesNotMatch(gate, /if: always\(\)/);
  for (const name of dependencies) assert.ok(gate.includes(name));
});
test('the actual required-gate script accepts only a completely successful diagnostic set', () => {
  const success = Object.fromEntries(dependencies.map(name => [name, 'success']));
  assert.equal(execute(success), 0);
  for (const name of dependencies) for (const result of ['failure', 'cancelled', 'skipped']) {
    assert.notEqual(execute({ ...success, [name]: result }), 0, `${name}=${result} must block acceptance`);
  }
});


test('pending exact-head browser evidence exits normally before the CI job timeout so the completion finalizer can retry', () => {
  const step = gate.split('      - name: Require completed exact-head browser acceptance for pull requests\n')[1];
  assert.ok(step, 'The required exact-head browser receipt must remain present');
  assert.match(step, /^\s+E2E_EVIDENCE_TIMEOUT_MS:\s*'0'\s*$/m, 'Use a single evidence check; the trusted completion finalizer handles pending browsers');
  assert.match(step, /^\s+run: node scripts\/ci\/require-exact-pr-browser-evidence\.mjs\s*$/m);
});

test('browser completion reconciliation is isolated by source repository, branch and exact head', () => {
  const finalizer = readFileSync(new URL('../.github/workflows/resume-ci-browser-gate.yml', import.meta.url), 'utf8');
  const group = finalizer.match(/^  group: (.+)$/m)?.[1];
  assert.equal(group, 'browser-ci-receipt-${{ github.repository }}-${{ github.event.workflow_run.head_repository.id }}-${{ github.event.workflow_run.head_branch }}-${{ github.event.workflow_run.head_sha }}');
  assert.match(finalizer, /^  cancel-in-progress: false$/m);
  assert.match(finalizer, /ref: \$\{\{ github\.sha \}\}/, 'Privileged finalizer must keep executing trusted main');
});

const browserWorkflow = load(readFileSync(new URL('../.github/workflows/e2e-desktop-chrome.yml', import.meta.url), 'utf8'));
const browserGate = browserWorkflow.jobs['desktop-chrome'];

test('superseded browser aggregates can stop while every fixture cleanup and artifact upload still runs', () => {
  assert.equal(browserWorkflow.concurrency.group, 'e2e-desktop-chrome-${{ github.head_ref || github.ref_name }}');
  assert.equal(browserWorkflow.concurrency['cancel-in-progress'], true);
  assert.equal(browserGate.name, 'E2E desktop-chrome');
  assert.deepEqual(browserGate.needs, ['desktop-chrome-shard']);
  assert.equal(browserGate.if, '${{ !cancelled() }}');
  const shard = browserWorkflow.jobs['desktop-chrome-shard'];
  assert.equal(shard.strategy['fail-fast'], false);
  for (const script of [
    'provision-apprenticeship-e2e.mjs',
    'provision-learner-program-holder-e2e.mjs',
    'provision-remaining-portal-e2e.mjs',
  ]) {
    const steps = shard.steps.filter(step => step.run === `node scripts/qa/${script} cleanup`);
    assert.equal(steps.length, 1, `${script} must retain its independent cleanup`);
    assert.equal(steps[0].if, 'always()', `${script} cleanup must survive cancellation`);
  }
  const uploads = shard.steps.filter(step => step.uses?.startsWith('actions/upload-artifact@'));
  assert.ok(uploads.length, 'Cancelled shards must retain their diagnostic artifact upload');
  for (const step of uploads) assert.equal(step.if, 'always()');
});

test('the actual browser aggregate shell accepts only successful matrix results', () => {
  assert.notEqual(browserGate['continue-on-error'], true);
  assert.equal(browserGate.steps.length, 1);
  const step = browserGate.steps[0];
  assert.equal(step.if, undefined, 'The matrix assertion must not be conditionally bypassed');
  assert.notEqual(step['continue-on-error'], true);
  assert.deepEqual(step.env, { SHARD_RESULT: '${{ needs.desktop-chrome-shard.result }}' });
  for (const result of ['success', 'failure', 'skipped', 'cancelled', 'pending', '']) {
    const execution = spawnSync('bash', ['-e', '-c', step.run], {
      env: { PATH: process.env.PATH || '', SHARD_RESULT: result },
      stdio: 'ignore',
    });
    assert.equal(execution.error, undefined);
    if (result === 'success') assert.equal(execution.status, 0);
    else assert.notEqual(execution.status, 0, `matrix=${result || '(empty)'} must block browser acceptance`);
  }
});

test('cancelled browser workflows or skipped aggregates cannot certify the current PR head', () => {
  const headSha = 'a'.repeat(40);
  const headBranch = 'fix/browser-cancellation';
  const sourceRepository = 'elevate-for-humanity/Elevate-lms';
  const run = {
    id: 123, head_sha: headSha, head_branch: headBranch,
    head_repository: { full_name: sourceRepository },
    path: '.github/workflows/e2e-desktop-chrome.yml', event: 'pull_request',
    status: 'completed', conclusion: 'success',
  };
  const jobs = [browserGate.name, ...[1, 2, 3, 4].map(n => `E2E desktop-chrome shard ${n}/4`), 'Public Host Shop navigation and application (five devices)', 'Email device browsers']
    .map(name => ({ name, status: 'completed', conclusion: 'success' }));
  const evidence = { runs: [run], jobs, sourceRepository, headSha, headBranch };
  assert.equal(inspectExactPrBrowserEvidence(evidence).state, 'verified');
  for (const conclusion of ['failure', 'cancelled', 'skipped']) {
    assert.throws(() => inspectExactPrBrowserEvidence({
      ...evidence, runs: [{ ...run, conclusion }],
    }), /E2E_EXACT_HEAD_FAILED/);
    assert.throws(() => inspectExactPrBrowserEvidence({
      ...evidence, jobs: jobs.map((job, index) => index === 0 ? { ...job, conclusion } : job),
    }), /E2E_REQUIRED_JOB_NOT_SUCCESSFUL:E2E desktop-chrome/);
  }
});
