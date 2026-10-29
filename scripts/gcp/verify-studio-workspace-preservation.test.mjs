import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {workspaceContentProof, verifyStudioWorkspacePreservation, WORKSPACE_PRESERVATION_PROBE} from './verify-studio-workspace-preservation.mjs';

test('actual copied trees match despite restore timestamps; content and permissions changes fail equality', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-proof-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  const first = path.join(root, 'first'), second = path.join(root, 'second');
  for (const folder of [first, second]) {
    await fs.mkdir(path.join(folder, 'nested'), {recursive: true});
    await fs.writeFile(path.join(folder, 'nested', 'work.txt'), 'existing private user work');
    await fs.chmod(path.join(folder, 'nested', 'work.txt'), 0o600);
  }
  await fs.utimes(path.join(second, 'nested', 'work.txt'), 100, 100);
  const before = await workspaceContentProof(first);
  assert.deepEqual(await workspaceContentProof(second), before);
  assert.equal(before.files, 1);
  assert.equal(JSON.stringify(before).includes('private user work'), false);
  await fs.writeFile(path.join(second, 'nested', 'work.txt'), 'different private user work');
  assert.notEqual((await workspaceContentProof(second)).digest, before.digest);
  await fs.writeFile(path.join(second, 'nested', 'work.txt'), 'existing private user work');
  await fs.chmod(path.join(second, 'nested', 'work.txt'), 0o644);
  assert.notEqual((await workspaceContentProof(second)).digest, before.digest);
  assert.deepEqual(await workspaceContentProof(first), before, 'proof leaves original work unchanged');
});

test('dependency caches are excluded, but user symlinks are never silently dropped', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-proof-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  await fs.mkdir(path.join(root, 'node_modules'));
  await fs.writeFile(path.join(root, 'node_modules', 'cache'), 'reinstallable');
  assert.equal((await workspaceContentProof(root)).files, 0);
  await fs.symlink('/outside-workspace', path.join(root, 'user-link'));
  await assert.rejects(workspaceContentProof(root), /SPECIAL_FILE_REFUSED/);
});

function fixture(overrides = {}) {
  const calls = [], proof = {files: 13943, directories: 4166, bytes: 385383807,
    digest: 'a'.repeat(64), archiveDigest: 'b'.repeat(64), generation: '1234',
    authenticatedManifest: true, excludedDependencyCaches: true};
  let sourceReads = 0;
  const options = {sourceUrl: 'https://live.run.app', candidateUrl: 'https://candidate.run.app',
    secret: 'existing-secret-not-production', expectedFiles: 13943,
    request: async (url, request) => {
      calls.push({url: String(url), request});
      if (overrides.http) return new Response(null, {status: overrides.http});
      if (url.pathname === '/workspace/checkpoint') return Response.json({persistent: true, generation: '1234', ...overrides.saved});
      const altered = url.hostname === 'candidate.run.app' ? overrides.candidate : ++sourceReads > 1 ? overrides.after : {};
      return Response.json({exitCode: 0, stdout: JSON.stringify({...proof, ...altered})});
    }};
  return {options, calls};
}

test('nonempty live work is accepted only with authenticated identical candidate bytes and unchanged source', async () => {
  const f = fixture(), result = await verifyStudioWorkspacePreservation(f.options);
  assert.equal(result.passed, true); assert.equal(result.files, 13943);
  assert.equal(result.sourceUnchanged, true); assert.equal(result.filesDeleted, false);
  assert.equal(f.calls.length, 4);
  assert.ok(f.calls.every(c => ['/workspace/checkpoint', '/workspace/exec'].includes(new URL(c.url).pathname)));
  assert.equal(JSON.stringify(result).includes(f.options.secret), false);
  assert.match(WORKSPACE_PRESERVATION_PROBE, /decodeManifest/);
  assert.doesNotMatch(WORKSPACE_PRESERVATION_PROBE, /writeFile|\.rm\(|removeArchive|writeManifest/);
});

test('missing files, changed bytes, unauthenticated archives, and concurrent generations stop cutover', async () => {
  for (const candidate of [{files: 13942}, {digest: 'c'.repeat(64)}, {authenticatedManifest: false},
    {generation: '1235'}, {archiveDigest: 'd'.repeat(64)}, {excludedDependencyCaches: false}]) {
    const f = fixture({candidate});
    await assert.rejects(verifyStudioWorkspacePreservation(f.options), /STUDIO_WORKSPACE_PRESERVATION_/);
  }
  for (const after of [{digest: 'c'.repeat(64)}, {generation: '1235'}]) {
    await assert.rejects(verifyStudioWorkspacePreservation(fixture({after}).options), /STUDIO_WORKSPACE_PRESERVATION_/);
  }
});

test('failed durable checkpoint or inaccessible runtime never falls back to an empty workspace', async () => {
  for (const override of [{saved: {persistent: false}}, {saved: {generation: '0'}}, {http: 503}]) {
    const f = fixture(override);
    await assert.rejects(verifyStudioWorkspacePreservation(f.options), /STUDIO_WORKSPACE_/);
    assert.equal(f.calls.length, 1);
  }
});

test('unverified destinations and empty or missing inventories make no authenticated requests', async () => {
  for (const override of [{candidateUrl: 'https://example.com'}, {candidateUrl: 'https://live.run.app'},
    {expectedFiles: undefined}, {expectedFiles: 0}]) {
    const f = fixture();
    await assert.rejects(verifyStudioWorkspacePreservation({...f.options, ...override}), /STUDIO_WORKSPACE_/);
    assert.equal(f.calls.length, 0);
  }
});
