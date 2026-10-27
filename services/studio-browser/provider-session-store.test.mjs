import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ProviderSessionStore } from './provider-session-store.mjs';

test('account-scoped encrypted connection excludes LMS and other provider state', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'provider-state-test-'));
  try {
    const store = new ProviderSessionStore({ secret: 'test-secret', directory });
    const scope = store.scope('admin-a', 'https://app.envato.com/');
    assert.equal(store.scope('admin-a', 'https://envato.com.attacker.example/'), null);
    assert.equal(store.scope('../admin-a', 'https://app.envato.com/'), null);
    await store.save(scope, { storageState: async (options) => {
      assert.deepEqual(options, { indexedDB: true });
      return {
      cookies: [{ name: 'session', value: 'private-provider-token', domain: '.envato.com' }, { name: 'sb-auth', value: 'lms-secret', domain: '.elevateforhumanity.org' }],
      origins: [{ origin: 'https://app.envato.com', localStorage: [], indexedDB: [{ name: 'auth', version: 1, stores: [{ name: 'tokens', records: [{ key: 'session', value: 'private-indexeddb-token' }] }] }] }, { origin: 'https://admin.elevateforhumanity.org', localStorage: [], indexedDB: [{ name: 'lms-private' }] }],
      };
    } });
    const serialized = await fs.readFile(store.file(scope), 'utf8');
    assert.equal(serialized.includes('private-provider-token'), false);
    assert.equal(serialized.includes('private-indexeddb-token'), false);
    const restored = new ProviderSessionStore({ secret: 'test-secret', directory });
    const state = await restored.load(scope);
    assert.equal(state.cookies.length, 1);
    assert.equal(state.origins.length, 1);
    assert.equal(state.origins[0].indexedDB[0].stores[0].records[0].value, 'private-indexeddb-token');
    assert.equal(await restored.load('envato:admin-b'), undefined);
    assert.equal((await fs.stat(store.file(scope))).mode & 0o777, 0o600);
    const wrongKey = new ProviderSessionStore({ secret: 'different-secret', directory });
    await assert.rejects(() => wrongKey.load(scope), /RESTORE_FAILED/);
    const payload = JSON.parse(serialized);
    payload.data = Buffer.from('tampered').toString('base64');
    await fs.writeFile(store.file(scope), JSON.stringify(payload));
    await assert.rejects(() => new ProviderSessionStore({ secret: 'test-secret', directory }).load(scope), /RESTORE_FAILED/);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('persistent readiness writes and removes a private probe in the configured directory', async () => {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'provider-ready-'));
  const directory = path.join(parent, 'auth');
  try {
    const store = new ProviderSessionStore({ secret: 'fixture-only', directory });
    const results = await Promise.all([store.checkReadiness(), store.checkReadiness()]);
    assert.deepEqual(results[0], { ready: true, persistent: true, mode: 'encrypted-disk' });
    assert.deepEqual(results[1], results[0]);
    assert.deepEqual(await fs.readdir(directory), []);
    assert.equal((await fs.stat(directory)).mode & 0o777, 0o700);
  } finally { await fs.rm(parent, { recursive: true, force: true }); }
});

test('configured unwritable persistence reports failure without leaking the directory', { skip: process.platform !== 'linux' }, async () => {
  // procfs cannot create arbitrary files even when this test executes as root.
  const store = new ProviderSessionStore({ secret: 'fixture-only', directory: '/proc' });
  assert.deepEqual(await store.checkReadiness(), {
    ready: false, persistent: true, mode: 'encrypted-disk', error: 'provider_auth_storage_unavailable',
  });
});

test('readiness permits deliberate memory mode but rejects unencrypted persistence', async () => {
  assert.deepEqual(await new ProviderSessionStore().checkReadiness(), { ready: true, persistent: false, mode: 'memory' });
  assert.deepEqual(await new ProviderSessionStore({ directory: '/unused' }).checkReadiness(), {
    ready: false, persistent: true, mode: 'encrypted-disk', error: 'provider_auth_encryption_unavailable',
  });
});

test('configured persistence without encryption fails closed when saving', async () => {
  const store = new ProviderSessionStore({ directory: '/unused' });
  await assert.rejects(() => store.save('envato:admin-a', {
    storageState: async () => ({ cookies: [], origins: [] }),
  }), /ENCRYPTION_UNAVAILABLE/);
  assert.equal(await store.load('envato:admin-a'), undefined);
});

test('failed checkpoint preserves the last durable state in memory and on disk', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'provider-durable-'));
  const state = value => ({ storageState: async () => ({
    cookies: [{ name: 'session', value, domain: '.envato.com' }], origins: [],
  }) });
  try {
    const store = new ProviderSessionStore({ secret: 'test-only', directory });
    const scope = 'envato:admin-a';
    await store.save(scope, state('saved'));
    // A file at the directory path deterministically prevents a new checkpoint.
    await fs.rename(directory, directory + '-saved');
    await fs.writeFile(directory, 'unavailable');
    await assert.rejects(() => store.save(scope, state('unsaved')));
    assert.equal((await store.load(scope)).cookies[0].value, 'saved');
    const restored = new ProviderSessionStore({ secret: 'test-only', directory: directory + '-saved' });
    assert.equal((await restored.load(scope)).cookies[0].value, 'saved');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
    await fs.rm(directory + '-saved', { recursive: true, force: true });
  }
});
