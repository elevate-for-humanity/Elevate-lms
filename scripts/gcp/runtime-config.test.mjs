import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGoogleConfig, validateConfig, googleFailureCode } from './runtime-config.mjs';
import { importRuntimeConfig } from './import-runtime-config.mjs';
const config = () => ({ version: 1, component: 'store', runtimeEnvironment: { MULTILINE: 'one\ntwo', TOKEN: 'a,b="c"' }, runtimeFiles: {}, volumes: [] });
test('deployment loads only Google-owned configuration and preserves exact values', () => {
  let calls = 0;
  const result = loadGoogleConfig('store', args => { calls++; assert.equal(args[0], 'secrets'); return JSON.stringify(config()); });
  assert.equal(calls, 1); assert.deepEqual(result, config());
});
test('Course Builder cannot redeploy a retired Northflank learner endpoint', () => {
  const c = config(); c.component = 'ultimate-worker';
  c.runtimeEnvironment.ULTIMATE_LEARNER_RUNTHROUGH_URL = 'https://browser--retired.code.run/learner/runthrough';
  assert.throws(() => loadGoogleConfig('ultimate-worker', () => JSON.stringify(c)), /retired Northflank learner endpoint/);
});
test('rejects wrong component, unresolved templates and incomplete persistence inventory', () => {
  assert.throws(() => validateConfig(config(), 'admin'));
  const c = config(); c.runtimeEnvironment.TOKEN = '${unresolved}'; assert.throws(() => validateConfig(c, 'store'));
  delete c.volumes; assert.throws(() => validateConfig(c, 'store'));
});
test('one-time import verifies exact bytes through Secret Manager without logging values', async () => {
  const calls = []; let payload;
  const result = await importRuntimeConfig('store', { env: { NORTHFLANK_API_TOKEN: 'source-test' },
    request: async url => ({ ok: true, json: async () => ({ data: String(url).includes('runtime-environment') ? config() : { volumes: [] } }) }),
    run: (args, input) => { calls.push(args); if (input) payload = input; return args[1] === 'versions' && args[2] === 'access' ? payload : ''; } });
  assert.equal(result.configurationOwner, 'Google Secret Manager');
  assert.equal(JSON.parse(payload).runtimeEnvironment.TOKEN, 'a,b="c"');
  assert.equal(JSON.stringify(result).includes('a,b='), false);
  assert.equal(calls.some(args => args.includes('a,b="c"')), false);
});
test('refuses overwrite and incomplete inventory before any mutation', async () => {
  for (const incomplete of [false, true]) {
    let mutations = 0;
    await assert.rejects(importRuntimeConfig('store', { env: { NORTHFLANK_API_TOKEN: 'test' },
      request: async url => ({ ok: true, json: async () => ({ data: String(url).includes('runtime-environment') ? (incomplete ? { runtimeEnvironment: {} } : config()) : { volumes: [] } }) }),
      run: args => { if (['create', 'add'].includes(args[1]) || args[2] === 'add') mutations++; return 'existing'; } }));
    assert.equal(mutations, 0);
  }
});

test('rejects configuration larger than Secret Manager capacity before import', () => {
  const c = config(); c.runtimeEnvironment.LARGE = 'x'.repeat(65536);
  assert.throws(() => validateConfig(c, 'store'), /payload limit/);
});

test('standalone attached Studio volume is recorded even when service has no volume declarations', async () => {
  let payload;
  const c = config(); c.component = 'studio-browser';
  const result = await importRuntimeConfig('studio-browser', {
    env: { NORTHFLANK_API_TOKEN: 'test' },
    request: async url => ({ ok: true, json: async () => ({ data:
      url.endsWith('/volumes') ? { volumes: [{ id: 'auth' }] } :
      url.endsWith('/volumes/auth') ? { id: 'auth', spec: { storageSize: 6144 }, attachedObjects: [{ type: 'service', id: 'elevate-studio-browser' }] } :
      url.includes('runtime-environment') ? c : {} }) }),
    run: (args, input) => { if (input) payload = input; return args[2] === 'access' ? payload : ''; },
  });
  assert.equal(result.volumes, 1);
  assert.equal(JSON.parse(payload).volumes[0].mountInventoryVerified, false);
});
test('unavailable volume attachment inventory prevents secret creation', async () => {
  let mutations = 0;
  await assert.rejects(importRuntimeConfig('store', {
    env: { NORTHFLANK_API_TOKEN: 'test' },
    request: async url => ({ ok: true, json: async () => ({ data: url.includes('runtime-environment') ? config() : {} }) }),
    run: () => { mutations++; return ''; },
  }), /persistence inventory/);
  assert.equal(mutations, 0);
});
test('Google failures expose only a fixed diagnosis, never raw credentials', () => {
  assert.equal(googleFailureCode('API [secretmanager.googleapis.com] not enabled; TOKEN=private'), 'api_disabled');
  assert.equal(googleFailureCode('PERMISSION_DENIED: TOKEN=private'), 'permission_denied');
  assert.equal(googleFailureCode('arbitrary credential output'), 'command_failed');
});

test('owner-preprovisioned empty secret can be initialized without project-wide create or list permissions', async () => {
  let payload; const calls = [];
  await importRuntimeConfig('store', {
    env: { NORTHFLANK_API_TOKEN: 'test' },
    request: async url => ({ ok: true, json: async () => ({ data: url.includes('runtime-environment') ? config() : { volumes: [] } }) }),
    run: (args, input) => {
      calls.push(args);
      if (args[1] === 'list' || args[1] === 'create') throw new Error('project-wide operation forbidden');
      if (input) payload = input;
      return args[1] === 'describe' ? 'existing-empty' : args[2] === 'access' ? payload : '';
    },
  });
  assert.equal(calls.some(a => a[1] === 'create' || a[1] === 'list'), false);
  assert.ok(payload);
});

for (const changed of [false, true]) {
  test('existing Google ownership verification ' + (changed ? 'rejects changed credentials without writes' : 'accepts exact credentials without writes'), async () => {
    const current = config();
    if (changed) current.runtimeEnvironment.TOKEN = 'different';
    let mutations = 0;
    const operation = importRuntimeConfig('store', {
      env: { NORTHFLANK_API_TOKEN: 'test', VERIFY_EXISTING_GOOGLE_CONFIG: 'true' },
      request: async url => ({ ok: true, json: async () => ({data: url.includes('runtime-environment') ? config() : {volumes: []}}) }),
      run: args => {
        if (args[1] === 'create' || args[2] === 'add') mutations++;
        return args[2] === 'access' ? JSON.stringify(current) : 'existing';
      },
    });
    if (changed) await assert.rejects(operation, /does not match complete source inventory/);
    else assert.equal((await operation).existingConfigurationVerified, true);
    assert.equal(mutations, 0);
  });
}
