import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
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
