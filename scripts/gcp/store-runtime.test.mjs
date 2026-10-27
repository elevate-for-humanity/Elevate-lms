import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStoreDatabase } from './store-runtime.mjs';
const config = (component, runtimeEnvironment) => ({ version: 1, component, runtimeEnvironment, runtimeFiles: {}, volumes: [] });
const database = () => ({ NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' });
test('Store gets only its missing Google-owned database settings while retaining its own flags and billing', () => {
  const store = config('store', { STORE_ONLY_RUNTIME: 'true', STRIPE_SECRET_KEY: 'store-billing' });
  const shared = config('marketing', { ...database(), STRIPE_SECRET_KEY: 'other-billing', ADMIN_API_KEY: 'private-admin', GITHUB_TOKEN: 'private-git' });
  const resolved = resolveStoreDatabase(store, shared);
  assert.deepEqual(resolved.runtimeEnvironment, { ...database(), STORE_ONLY_RUNTIME: 'true', STRIPE_SECRET_KEY: 'store-billing' });
  assert.equal(store.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY, undefined);
});
test('existing Store database credentials remain authoritative', () => {
  const existing = { ...database(), NEXT_PUBLIC_SUPABASE_ANON_KEY: 'store-anon', SUPABASE_SERVICE_ROLE_KEY: 'store-service' };
  assert.deepEqual(resolveStoreDatabase(config('store', existing), config('marketing', database())).runtimeEnvironment, existing);
});
test('wrong tenant, missing shared credentials and unresolved configuration fail closed', () => {
  assert.throws(() => resolveStoreDatabase(config('store', { NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co' }), config('marketing', database())), /tenant/);
  assert.throws(() => resolveStoreDatabase(config('store', {}), config('marketing', { NEXT_PUBLIC_SUPABASE_URL: database().NEXT_PUBLIC_SUPABASE_URL })), /incomplete/);
  assert.throws(() => resolveStoreDatabase(config('store', { TOKEN: '${source}' }), config('marketing', database())), /runtime variable/);
});
