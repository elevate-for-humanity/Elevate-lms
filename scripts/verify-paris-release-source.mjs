import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const manifest = JSON.parse(readFileSync('config/paris-release-source.json', 'utf8'));
assert.equal(manifest.repository, 'elevate-for-humanity/next-platform-starter');
assert.match(manifest.commit, /^[a-f0-9]{40}$/);
for (const entry of manifest.files) {
  assert.ok(!entry.source.includes('..') && !entry.target.includes('..'));
  const hash = value => createHash('sha256').update(value).digest('hex');
  assert.equal(hash(readFileSync(entry.target)), entry.sha256, entry.target + ' differs from the source bundle');
  const response = await fetch(`https://raw.githubusercontent.com/${manifest.repository}/${manifest.commit}/${entry.source}`, { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, 'Unable to verify immutable PARIS source: ' + entry.source);
  assert.equal(hash(Buffer.from(await response.arrayBuffer())), entry.sha256, 'Immutable source mismatch: ' + entry.source);
}
console.log(`Verified ${manifest.files.length} PARIS source files at ${manifest.commit}.`);
