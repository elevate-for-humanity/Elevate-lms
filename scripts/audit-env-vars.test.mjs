import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
const script = fileURLToPath(new URL('./audit-env-vars.sh', import.meta.url));

test('environment audit checks tracked source while excluding installed and generated files', () => {
  const root = mkdtempSync(join(tmpdir(), 'env-audit-'));
  const write = (path, text) => { const full = join(root, path); mkdirSync(join(full, '..'), { recursive: true }); writeFileSync(full, text); };
  try {
    execFileSync('git', ['init', '-q'], { cwd: root });
    write('.env.example', 'CANONICAL_CREDENTIAL=\n');
    write('apps/admin/app/page.ts', 'const token = process.env.CANONICAL_CREDENTIAL;\n');
    execFileSync('git', ['add', '-f', '.env.example', 'apps/admin/app/page.ts'], { cwd: root });
    write('apps/admin/node_modules/dependency/index.ts', 'process.env.APP_NAME;\n');
    write('apps/admin/.next/types/generated.ts', 'process.env.ELEVATE_RUNTIME_COMPONENT;\n');
    let result = spawnSync('bash', [script], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Referenced in code: 1/);
    write('apps/admin/app/page.ts', 'const token = process.env.UNDECLARED_APPLICATION_CREDENTIAL;\n');
    result = spawnSync('bash', [script], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /UNDECLARED_APPLICATION_CREDENTIAL/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a missing repository cannot masquerade as an empty successful source scan', () => {
  const root = mkdtempSync(join(tmpdir(), 'env-audit-no-repo-'));
  try {
    const result = spawnSync('bash', [script], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
