import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verifyLocalSource } from './verify-paris-release-source.mjs';
const digest = value => createHash('sha256').update(value).digest('hex');
const fixture = () => ({ repository: 'elevate-for-humanity/next-platform-starter', commit: 'a'.repeat(40), files: [
  { source: 'upstream-a', target: 'local-a', sha256: digest('reviewed-a'), sourceSha256: digest('original-a') },
  { source: 'upstream-b', target: 'local-b', sha256: digest('reviewed-b') },
] });
test('reviewed local revisions preserve distinct immutable upstream digests', () => {
  const manifest = fixture(), before = JSON.stringify(manifest);
  verifyLocalSource(manifest, path => path === 'local-a' ? 'reviewed-a' : 'reviewed-b');
  assert.equal(JSON.stringify(manifest), before);
});
test('reports every stale local file and never accepts changed content automatically', () => {
  const manifest = fixture(), before = JSON.stringify(manifest);
  assert.throws(() => verifyLocalSource(manifest, () => 'unreviewed'), error =>
    error instanceof AggregateError && error.errors.length === 2 && /local-a/.test(error.message) && /local-b/.test(error.message));
  assert.equal(JSON.stringify(manifest), before);
});
test('missing local files are reported alongside stale files', () => {
  assert.throws(() => verifyLocalSource(fixture(), path => { if (path === 'local-a') throw Error('missing'); return 'unreviewed'; }), error =>
    error instanceof AggregateError && error.errors.length === 2);
});
test('reviewed tax-page revision adds only the Supersonic install manifest and retains upstream identity', () => {
  const manifest = JSON.parse(readFileSync(new URL('../config/paris-release-source.json', import.meta.url), 'utf8'));
  const entry = manifest.files.find(file => file.target === 'apps/marketing/app/tax/page.tsx');
  const local = readFileSync(new URL('../apps/marketing/app/tax/page.tsx', import.meta.url), 'utf8');
  const original = local.replace("  manifest: '/manifest-supersonic-fast-cash.json',\n", '');
  assert.notEqual(local, original);
  assert.equal(digest(local), entry.sha256);
  assert.equal(digest(original), entry.sourceSha256);
  assert.match(entry.localRevisionReason, /#2159/);
});
