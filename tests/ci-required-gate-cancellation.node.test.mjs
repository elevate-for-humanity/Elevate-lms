import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const gate = workflow.split('\n  ci-gate:')[1];
const dependencies = ['preflight', 'typecheck', 'lint', 'enrollment-database', 'diagnostics'];
const runBlock = gate.split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
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
