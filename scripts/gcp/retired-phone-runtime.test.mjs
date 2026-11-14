import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

function runtime(google = false) {
  const decrypted = [];
  const retiredKey = 'TELNYX_API_KEY';
  const db = {
    from: table => ({ select: () => ({ eq: () => Promise.resolve({
      data: table === 'app_secrets' ? [{ key: retiredKey, value: 'retired-only' }] :
        [{ key: retiredKey }, { key: 'TWILIO_AUTH_TOKEN' }], error: null
    }) }) }),
    rpc: async (_name, args) => { decrypted.push(args.p_key); return { data: 'canonical-twilio-test', error: null }; }
  };
  const process = { env: { SUPABASE_SERVICE_ROLE_KEY: 'test-only', TELNYX_API_KEY: 'retired-only',
    TWILIO_AUTH_TOKEN: 'injected-twilio-test',
    ...(google ? { ELEVATE_RUNTIME_CONFIG_PROVIDER: 'google-secret-manager' } : {}) } };
  const context = vm.createContext({ process, logger: { error() {} }, createClient: () => db,
    resolveServerSupabaseRawEnv: () => ({ url: 'https://test.invalid' }), Date, setTimeout, clearTimeout,
    AbortSignal, AbortController, fetch: () => { throw Error('Unexpected network request'); } });
  const source = readFileSync(new URL('../../lib/secrets.ts', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '');
  vm.runInContext(stripTypeScriptTypes(source).replace(/^export /gm, ''), context);
  return { context, process, decrypted, retiredKey };
}
test('all secret accessors reject retired keys even when injected into Google runtime', async () => {
  const { context: c, process, retiredKey } = runtime(true);
  assert.equal(await c.getSecret(retiredKey), undefined);
  assert.equal(c.getCachedSecret(retiredKey), undefined);
  assert.equal(await c.getDecryptedPlatformSecret(retiredKey), undefined);
  assert.equal((await c.getSecrets([retiredKey]))[retiredKey], undefined);
  assert.equal((await c.getSelectedRuntimeSecrets([retiredKey]))[retiredKey], undefined);
  await c.hydrateProcessEnv();
  assert.equal(process.env[retiredKey], undefined);
  assert.equal(process.env.TWILIO_AUTH_TOKEN, 'injected-twilio-test');
});
test('hydration neither decrypts nor restores archived carrier credentials', async () => {
  const { context: c, process, decrypted, retiredKey } = runtime();
  await c.hydrateProcessEnv();
  assert.equal(process.env[retiredKey], undefined);
  assert.deepEqual(decrypted, ['TWILIO_AUTH_TOKEN']);
  assert.equal(await c.getSecret(retiredKey), undefined);
  assert.equal(process.env.TWILIO_AUTH_TOKEN, 'canonical-twilio-test');
});
