import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./verify-admin-media-release.sh', import.meta.url));
const repo = mkdtempSync(join(tmpdir(), 'admin-media-ancestry-'));

function git(...args) {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 0, 'git ' + args.join(' ') + ': ' + result.stderr);
  return result.stdout.trim();
}

function approved(required, live, workflow) {
  return spawnSync('bash', [script, required, live, workflow], {
    cwd: repo,
    encoding: 'utf8',
  }).status === 0;
}

try {
  git('init', '-q');
  git('config', 'user.name', 'Deployment Test');
  git('config', 'user.email', 'deployment-test@example.invalid');
  git('commit', '-q', '--allow-empty', '-m', 'last Admin runtime change');
  const required = git('rev-parse', 'HEAD');
  git('commit', '-q', '--allow-empty', '-m', 'deployed runtime');
  const live = git('rev-parse', 'HEAD');
  git('commit', '-q', '--allow-empty', '-m', 'latest workflow main');
  const workflow = git('rev-parse', 'HEAD');

  test('accepts an exact required runtime revision', () => {
    assert.equal(approved(required, required, workflow), true);
  });

  test('accepts a trusted deployed descendant containing the required runtime change', () => {
    assert.equal(approved(required, live, workflow), true);
  });

  test('rejects a serving revision older than the required runtime change', () => {
    assert.equal(approved(live, required, workflow), false);
  });

  test('rejects a serving revision newer than the triggering workflow commit', () => {
    assert.equal(approved(required, workflow, live), false);
  });

  test('rejects malformed or nonexisting commit identities', () => {
    assert.equal(approved(required, 'not-a-sha', workflow), false);
    assert.equal(approved(required, 'f'.repeat(40), workflow), false);
  });

  test('rejects an unrelated deployment branch', () => {
    git('checkout', '-q', '-b', 'unapproved', required);
    git('commit', '-q', '--allow-empty', '-m', 'unapproved change');
    const divergent = git('rev-parse', 'HEAD');
    git('checkout', '-q', '-');
    assert.equal(approved(required, divergent, workflow), false);
  });
} finally {
  // The test corpus is intentionally tiny and holds no production credentials.
  process.on('exit', () => rmSync(repo, { recursive: true, force: true }));
}
