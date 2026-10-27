import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const hash = value => createHash('sha256').update(value).digest('hex');

// Audit every local entry before network access so one stale entry cannot hide
// the rest. Never regenerate accepted digests automatically during verification.
export function verifyLocalSource(manifest, read = readFileSync) {
  assert.equal(manifest.repository, 'elevate-for-humanity/next-platform-starter');
  assert.match(manifest.commit, /^[a-f0-9]{40}$/);
  assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0);
  const failures = [];
  for (const entry of manifest.files) {
    try {
      assert.ok(!entry.source.includes('..') && !entry.target.includes('..'));
      assert.match(entry.sha256, /^[a-f0-9]{64}$/);
      assert.match(entry.sourceSha256 || entry.sha256, /^[a-f0-9]{64}$/);
      assert.equal(hash(read(entry.target)), entry.sha256, 'Local digest differs from reviewed manifest');
    } catch (error) {
      failures.push(new Error(`${entry.target}: ${error.message}`));
    }
  }
  if (failures.length) throw new AggregateError(failures, failures.map(error => error.message).join('\n'));
}

export async function verifyReleaseSource() {
  const manifest = JSON.parse(readFileSync('config/paris-release-source.json', 'utf8'));
  verifyLocalSource(manifest);
  const failures = [];
  for (const entry of manifest.files) {
    try {
      // Keep the immutable upstream digest separate from reviewed local changes.
      const sourceSha256 = entry.sourceSha256 || entry.sha256;
      const response = await fetch(`https://raw.githubusercontent.com/${manifest.repository}/${manifest.commit}/${entry.source}`, { signal: AbortSignal.timeout(20000) });
      assert.equal(response.status, 200, 'Unable to verify immutable source');
      assert.equal(hash(Buffer.from(await response.arrayBuffer())), sourceSha256, 'Immutable source mismatch');
    } catch (error) {
      failures.push(new Error(`${entry.source}: ${error.message}`));
    }
  }
  if (failures.length) throw new AggregateError(failures, failures.map(error => error.message).join('\n'));
  console.log(`Verified ${manifest.files.length} PARIS source files at ${manifest.commit}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyReleaseSource().catch(error => { console.error(error.message); process.exitCode = 1; });
}
