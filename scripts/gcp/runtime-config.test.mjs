import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGoogleConfig, validateConfig } from './runtime-config.mjs';
import { importRuntimeConfig } from './import-runtime-config.mjs';
const config = () => ({ version: 1, component: 'store', runtimeEnvironment: { MULTILINE: 'one\ntwo', TOKEN: 'a,b="c"' }, runtimeFiles: {}, volumes: [] });
test('deployment loads only Google-owned configuration and preserves exact values', () => {
  let calls = 0;
  const result = loadGoogleConfig('store', args => { calls++; assert.equal(args[0], 'secrets'); return JSON.stringify(config()); });
  assert.equal(calls, 1); assert.deepEqual(result, config());
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
      request: async url => ({ ok: true, json: async () => ({ data: String(url).includes('runtime-environment') ? (incomplete ? { runtimeEnvironment: {} } : config()) : {} }) }),
      run: args => { if (args[1] !== 'list') mutations++; return 'existing'; } }));
    assert.equal(mutations, 0);
  }
});

test('rejects configuration larger than Secret Manager capacity before import', () => {
  const c = config(); c.runtimeEnvironment.LARGE = 'x'.repeat(65536);
  assert.throws(() => validateConfig(c, 'store'), /payload limit/);
});
