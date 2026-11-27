import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const audit = fileURLToPath(new URL('./check-analytics-integrity.mjs', import.meta.url));
const canonical = 'components/analytics/google-analytics.tsx';
const injector = 'const src = "https://www.googletagmanager.com/gtag/js";';

function runAudit(files = {}, env = process.env) {
  const cwd = mkdtempSync(join(tmpdir(), 'analytics-integrity-'));
  try {
    for (const [path, content] of Object.entries({ [canonical]: injector, ...files })) {
      const target = join(cwd, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
    const result = spawnSync(process.execPath, [audit], { cwd, env, encoding: 'utf8' });
    assert.ifError(result.error);
    return result;
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test('does not mistake the interior of uppercase program names for analytics IDs', () => {
  const result = runAudit({ 'tests/program.ts': "const slug = 'BUILDING-MAINTENANCE-WRG';" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /All analytics integrity checks passed/);
});

for (const value of ["'G-ABCDEF1234'", '"https://example.test/?id=G-ABCDEF1234"', '`G-12345678`']) {
  test(`rejects a complete measurement ID in ${value}`, () => {
    const result = runAudit({ 'app/page.tsx': `const value = ${value};` });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /FAIL: Rule 2/);
    assert.match(result.stderr, /app\/page.tsx/);
  });
}

test('allows the documented placeholder without allowing it to mask a real ID', () => {
  const placeholder = runAudit({ 'app/page.tsx': "const example = 'G-XXXXXXXXXX';" });
  assert.equal(placeholder.status, 0, placeholder.stderr);
  const mixed = runAudit({ 'app/page.tsx': "const ids = ['G-XXXXXXXXXX', 'G-ABCDEF1234'];" });
  assert.equal(mixed.status, 1);
  assert.match(mixed.stderr, /FAIL: Rule 2/);
});

test('preserves rejection of duplicate injectors and noncanonical config calls', () => {
  const result = runAudit({ 'app/page.tsx': `${injector}\ngtag('config', measurementId);` });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL: Rule 1/);
  assert.match(result.stderr, /FAIL: Rule 3/);
});

test('fails closed when the audit command cannot execute', () => {
  const result = runAudit({}, { ...process.env, PATH: '/nonexistent-analytics-audit-bin' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL: Audit execution/);
});
