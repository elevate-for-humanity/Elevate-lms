import test from 'node:test';
import assert from 'node:assert/strict';
import { runtimeForGoogle, completeStoreConfig } from './stage-web.mjs';
const base = () => ({ runtimeEnvironment: { NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-public', SUPABASE_SERVICE_ROLE_KEY: 'test-private', PORT: '3000', MULTILINE: 'one\ntwo', QUOTED: 'a,b="c"' } });
test('preserves runtime values without modifying source and removes reserved port', () => {
  const source = base();
  const env = runtimeForGoogle(source, {});
  assert.equal(env.MULTILINE, 'one\ntwo');
  assert.equal(env.QUOTED, 'a,b="c"');
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, 'test-private');
  assert.equal(env.PORT, undefined);
  assert.equal(source.runtimeEnvironment.PORT, '3000');
});
test('completes routing-only Store with confined Google credentials and preserves its settings', () => {
  const store = { component: 'store', runtimeEnvironment: { SERVICE_ROLE: 'store', STORE_URL: 'https://store.example.com', QB_CLIENT_ID: 'store-client', QB_CLIENT_SECRET: 'store-secret' }, volumes: [], runtimeFiles: {} };
  const marketing = { ...base(), component: 'marketing' };
  Object.assign(marketing.runtimeEnvironment, { QB_CLIENT_ID: 'marketing-client', QB_CLIENT_SECRET: 'commerce', ENVATO_API_TOKEN: 'studio-only', NORTHFLANK_API_TOKEN: 'retired', STRIPE_SECRET_KEY: 'retired' });
  const result = completeStoreConfig(store, marketing);
  assert.equal(result.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY, 'test-private');
  assert.equal(result.runtimeEnvironment.QB_CLIENT_SECRET, 'store-secret');
  assert.equal(result.runtimeEnvironment.QB_CLIENT_ID, 'store-client');
  assert.equal(result.runtimeEnvironment.STORE_URL, 'https://store.example.com');
  for (const key of ['ENVATO_API_TOKEN', 'NORTHFLANK_API_TOKEN', 'STRIPE_SECRET_KEY']) assert.equal(result.runtimeEnvironment[key], undefined);
  assert.equal(store.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY, undefined);
  const incomplete = { ...store, runtimeEnvironment: { ...store.runtimeEnvironment } };
  delete incomplete.runtimeEnvironment.QB_CLIENT_SECRET;
  assert.throws(() => completeStoreConfig(incomplete, marketing), /matching secret/);
});
test('Store completion rejects a conflicting database or persistent state before deployment', () => {
  const store = { component: 'store', runtimeEnvironment: { NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co' }, volumes: [], runtimeFiles: {} };
  assert.throws(() => completeStoreConfig(store, { ...base(), component: 'marketing' }), /Unexpected/);
  assert.throws(() => completeStoreConfig({ ...store, runtimeEnvironment: {}, volumes: [{}] }, { ...base(), component: 'marketing' }), /volumes/);
});
test('rejects incomplete or wrong database configuration', () => {
  const source = base(); delete source.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY;
  assert.throws(() => runtimeForGoogle(source, {}), /missing/);
  source.runtimeEnvironment.NEXT_PUBLIC_SUPABASE_URL = 'https://other.supabase.co';
  assert.throws(() => runtimeForGoogle(source, {}), /Unexpected/);
});
test('does not silently lose persistent data, secret files or unresolved templates', () => {
  assert.throws(() => runtimeForGoogle(base(), { deployment: { volumes: [{}] } }), /volumes/);
  assert.throws(() => runtimeForGoogle({ ...base(), runtimeFiles: { '/secret': {} } }, {}), /files/);
  const source = base(); source.runtimeEnvironment.SECRET = '${unresolved}';
  assert.throws(() => runtimeForGoogle(source, {}), /Unresolved/);
});
