import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { imageRelationship, readCommitIndex } from './verify-image-provenance.mjs';

const repo = 'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/marketing';
const child = 'sha256:' + 'a'.repeat(64);
const attest = 'sha256:' + 'b'.repeat(64);
const imageType = 'application/vnd.oci.image.manifest.v1+json';
const indexType = 'application/vnd.oci.image.index.v1+json';
const image = digest => `${repo}@${digest}`;
const hash = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
function indexFixture(mutate = () => {}) {
  const index = { schemaVersion: 2, mediaType: indexType, manifests: [
    { mediaType: imageType, digest: child, size: 123, platform: { os: 'linux', architecture: 'amd64' } },
    { mediaType: imageType, digest: attest, size: 234, platform: { os: 'unknown', architecture: 'unknown' }, annotations: { 'vnd.docker.reference.type': 'attestation-manifest' } },
  ] };
  mutate(index);
  const bytes = Buffer.from(JSON.stringify(index));
  return { bytes, commit: image(hash(bytes)) };
}
test('exact digest preserves legacy single-manifest acceptance', () => {
  assert.equal(imageRelationship('marketing', image(child), image(child)), 'exact');
});
test('authentic OCI index proves the selected Linux/amd64 child, not the attestation', () => {
  const { bytes, commit } = indexFixture();
  assert.equal(imageRelationship('marketing', image(child), commit, bytes), 'linux-amd64-child');
  assert.equal(imageRelationship('marketing', image(attest), commit, bytes), 'unverified');
});
test('Docker manifest list and image manifest v2 are supported', () => {
  const { bytes, commit } = indexFixture(index => {
    index.mediaType = 'application/vnd.docker.distribution.manifest.list.v2+json';
    index.manifests[0].mediaType = 'application/vnd.docker.distribution.manifest.v2+json';
  });
  assert.equal(imageRelationship('marketing', image(child), commit, bytes), 'linux-amd64-child');
});
test('mismatching raw hash, missing bytes, unrelated digest, wrong repo and mutable tag fail closed', () => {
  const { bytes, commit } = indexFixture();
  for (const args of [
    ['marketing', image(child), commit, Buffer.concat([bytes, Buffer.from(' ')])],
    ['marketing', image(child), commit],
    ['marketing', image('sha256:' + 'c'.repeat(64)), commit, bytes],
    ['marketing', image(child).replace('/marketing@', '/admin@'), commit, bytes],
    ['marketing', image(child), commit.replace('/marketing@', '/admin@'), bytes],
    ['marketing', `${repo}:latest`, `${repo}:latest`],
    ['admin', image(child), image(child)],
  ]) assert.equal(imageRelationship(...args), 'unverified');
});
test('wrong platform, malformed descriptors, ambiguous Linux candidates and disguised attestations fail closed', () => {
  for (const mutate of [
    index => { index.manifests[0].platform.architecture = 'arm64'; },
    index => { index.manifests[0].platform.os = 'windows'; },
    index => { index.manifests[0].size = 0; },
    index => { index.manifests[0].mediaType = indexType; },
    index => { index.manifests[0].annotations = { 'vnd.docker.reference.type': 'attestation-manifest' }; },
    index => { index.manifests[0].artifactType = 'application/vnd.in-toto+json'; },
    index => { index.manifests.push({ ...index.manifests[0], digest: attest }); },
    index => { index.mediaType = imageType; },
    index => { index.schemaVersion = 1; },
  ]) {
    const { bytes, commit } = indexFixture(mutate);
    assert.equal(imageRelationship('marketing', image(child), commit, bytes), 'unverified');
  }
});
test('malformed JSON and oversized evidence fail closed even with matching hash', () => {
  for (const bytes of [Buffer.from('{'), Buffer.alloc(2 * 1024 * 1024 + 1)]) {
    assert.equal(imageRelationship('marketing', image(child), image(hash(bytes)), bytes), 'unverified');
  }
});
test('registry read uses only fixed HTTPS repo and immutable digest, refuses redirects', async () => {
  const { bytes, commit } = indexFixture();
  const observed = await readCommitIndex('marketing', commit, 'synthetic-test-token', async (url, options) => {
    assert.equal(url, `https://us-central1-docker.pkg.dev/v2/elegant-racer-299721/elevate/marketing/manifests/${hash(bytes)}`);
    assert.equal(options.headers.Authorization, 'Bearer synthetic-test-token');
    assert.ok(options.headers.Accept.includes(indexType));
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(bytes);
  });
  assert.deepEqual(observed, bytes);
  assert.equal(imageRelationship('marketing', image(child), commit, observed), 'linux-amd64-child');
});
test('invalid registry identity never sends a token; failed reads and oversized responses reject', async () => {
  const { commit } = indexFixture();
  let calls = 0;
  const request = async () => { calls++; return new Response(null, { status: 403 }); };
  await assert.rejects(readCommitIndex('marketing', `${repo}:latest`, 'token', request), /IDENTITY_REQUIRED/);
  await assert.rejects(readCommitIndex('marketing', commit.replace('/marketing@', '/admin@'), 'token', request), /IDENTITY_REQUIRED/);
  await assert.rejects(readCommitIndex('marketing', commit, '', request), /IDENTITY_REQUIRED/);
  assert.equal(calls, 0);
  await assert.rejects(readCommitIndex('marketing', commit, 'token', request), /READ_FAILED/);
  assert.equal(calls, 1);
  await assert.rejects(readCommitIndex('marketing', commit, 'token', async () => new Response(Buffer.alloc(2 * 1024 * 1024 + 1))), /TOO_LARGE/);
});
