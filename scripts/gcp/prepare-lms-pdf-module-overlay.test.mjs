import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, symlinkSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = new URL('./prepare-lms-pdf-module-overlay.sh', import.meta.url).pathname;
const packages = ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas', '@napi-rs/canvas-linux-x64-gnu'];

function withTemp(t) {
  const base = mkdtempSync(join(tmpdir(), 'lms-pdf-overlay-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const root = join(base, 'node_modules');
  mkdirSync(root);
  return { base, root };
}
function run(root) { return spawnSync('sh', [script, root], { encoding: 'utf8' }); }

test('replaces only conflicting traced symlinks and directories, keeping unrelated modules and targets', t => {
  const { base, root } = withTemp(t);
  const real = join(base, 'real-pdf');
  mkdirSync(real);
  writeFileSync(join(real, 'outside-marker'), 'preserve');
  symlinkSync(real, join(root, 'pdf-parse'));
  mkdirSync(join(root, 'pdfjs-dist'));
  writeFileSync(join(root, 'pdfjs-dist', 'old'), 'old');
  mkdirSync(join(root, '@napi-rs'), { recursive: true });
  for (const name of ['canvas', 'canvas-linux-x64-gnu'])
    symlinkSync(real, join(root, '@napi-rs', name));
  mkdirSync(join(root, 'other-package'));
  writeFileSync(join(root, 'other-package', 'important'), 'safe');
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  for (const name of packages) assert.equal(existsSync(join(root, name)), false, name);
  assert.equal(readFileSync(join(real, 'outside-marker'), 'utf8'), 'preserve');
  assert.equal(readFileSync(join(root, 'other-package', 'important'), 'utf8'), 'safe');
  assert.equal(run(root).status, 0, 'idempotent on empty package slots');
});

test('refuses a symlinked node_modules root or @napi-rs scope', t => {
  const { base, root } = withTemp(t);
  const link = join(base, 'linked-node_modules');
  symlinkSync(root, link);
  assert.notEqual(run(link).status, 0);
  const external = join(base, 'external');
  mkdirSync(external);
  writeFileSync(join(external, 'untouched'), 'safe');
  symlinkSync(external, join(root, '@napi-rs'));
  assert.notEqual(run(root).status, 0);
  assert.equal(readFileSync(join(external, 'untouched'), 'utf8'), 'safe');
});
