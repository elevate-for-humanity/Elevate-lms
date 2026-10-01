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
    await store.save(scope, { storageState: async () => ({
      cookies: [{ name: 'session', value: 'private-provider-token', domain: '.envato.com' }, { name: 'sb-auth', value: 'lms-secret', domain: '.elevateforhumanity.org' }],
      origins: [{ origin: 'https://app.envato.com', localStorage: [] }, { origin: 'https://admin.elevateforhumanity.org', localStorage: [] }],
    }) });
    const serialized = await fs.readFile(store.file(scope), 'utf8');
    assert.equal(serialized.includes('private-provider-token'), false);
    const restored = new ProviderSessionStore({ secret: 'test-secret', directory });
    const state = await restored.load(scope);
    assert.equal(state.cookies.length, 1);
    assert.equal(state.origins.length, 1);
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
