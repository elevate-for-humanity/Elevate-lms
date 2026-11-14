import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ databaseCalls: 0, phoneFixture: false }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => {
  state.databaseCalls += 1;
  return { from: () => ({ select: () => ({ eq: async () => ({ data: [{ key: 'TEST_SCOPED_KEY', value: 'database-value', scope: 'runtime' }, ...(state.phoneFixture ? [{key:'PBX_PROVISIONING_TOKEN',value:'database-phone-token',scope:'runtime'},{key:'PBX_UNBOUND_TEST_KEY',value:'must-not-load',scope:'runtime'},{key:'PBX_RUNTIME_CONFIG_PROVIDER',value:'google-secret-manager',scope:'runtime'}] : [])] }) }) }), rpc: async () => ({ data: 'database-value' }) };
} }));
import { getSecret, getSecrets, getCachedSecret, getDecryptedPlatformSecret, hydrateProcessEnv, refreshSecrets } from '@/lib/secrets';
beforeEach(() => {
  vi.stubEnv('PBX_PROVISIONING_TOKEN', undefined); vi.stubEnv('PBX_UNBOUND_TEST_KEY', undefined);
  vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', ''); state.phoneFixture = false;
  vi.stubEnv('K_SERVICE', ''); vi.stubEnv('CLOUD_RUN_JOB', ''); vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.test'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-database-bootstrap');
  vi.stubEnv('TEST_SCOPED_KEY', 'google-bound-value'); state.databaseCalls = 0;
});
afterEach(() => { vi.unstubAllEnvs(); });
describe('Google service credential boundaries', () => {
  for (const [flag, value] of [['K_SERVICE', 'elevate-store-migration'], ['CLOUD_RUN_JOB', 'elevate-course-builder'], ['ELEVATE_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager']]) {
    it(`${flag} cannot replace bound values with the shared database inventory`, async () => {
      vi.stubEnv(flag, value); vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager');
      await refreshSecrets(); await hydrateProcessEnv();
      expect(await getSecret('TEST_SCOPED_KEY')).toBe('google-bound-value');
      expect(await getSecrets(['TEST_SCOPED_KEY'])).toEqual({ TEST_SCOPED_KEY: 'google-bound-value' });
      expect(getCachedSecret('TEST_SCOPED_KEY')).toBe('google-bound-value');
      expect(await getDecryptedPlatformSecret('TEST_SCOPED_KEY')).toBe('google-bound-value');
      expect(state.databaseCalls).toBe(0);
    });
  }
  it('does not fetch an unbound credential belonging to another service', async () => {
    vi.stubEnv('K_SERVICE', 'elevate-store-migration'); vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager'); vi.stubEnv('TEST_OTHER_SERVICE_KEY', undefined);
    expect(await getSecret('TEST_OTHER_SERVICE_KEY')).toBeUndefined();
    expect(await getDecryptedPlatformSecret('TEST_OTHER_SERVICE_KEY')).toBeUndefined();
    expect(state.databaseCalls).toBe(0);
  });
  it('preserves the existing database-backed source runtime during the migration', async () => {
    await refreshSecrets(); expect(await getSecret('TEST_SCOPED_KEY')).toBe('database-value'); expect(state.databaseCalls).toBeGreaterThan(0);
  });
  it('does not cut off the source inventory merely because the container is on Cloud Run', async () => {
    vi.stubEnv('K_SERVICE', 'elevate-store-migration'); vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', '');
    await refreshSecrets(); expect(await getSecret('TEST_SCOPED_KEY')).toBe('database-value');
  });
  it('does not reuse a database credential cache in a Google runtime', async () => {
    await refreshSecrets(); vi.stubEnv('K_SERVICE', 'elevate-store-migration'); vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager'); vi.stubEnv('TEST_SCOPED_KEY', 'google-bound-value'); state.databaseCalls = 0;
    expect(getCachedSecret('TEST_SCOPED_KEY')).toBe('google-bound-value'); expect(await getSecret('TEST_SCOPED_KEY')).toBe('google-bound-value'); expect(state.databaseCalls).toBe(0);
  });
});


describe('PBX-only Google binding migration', () => {
  it('keeps Google phone credentials authoritative while other integrations retain their source', async () => {
    state.phoneFixture = true;
    vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager');
    vi.stubEnv('PBX_PROVISIONING_TOKEN', 'google-phone-token');
    vi.stubEnv('PBX_UNBOUND_TEST_KEY', undefined);
    await refreshSecrets();
    expect(await getSecret('PBX_PROVISIONING_TOKEN')).toBe('google-phone-token');
    expect(getCachedSecret('PBX_PROVISIONING_TOKEN')).toBe('google-phone-token');
    expect(await getDecryptedPlatformSecret('PBX_PROVISIONING_TOKEN')).toBe('google-phone-token');
    expect(await getSecret('PBX_UNBOUND_TEST_KEY')).toBeUndefined();
    expect(await getSecrets(['PBX_PROVISIONING_TOKEN','TEST_SCOPED_KEY'])).toEqual({PBX_PROVISIONING_TOKEN:'google-phone-token',TEST_SCOPED_KEY:'database-value'});
    expect(process.env.PBX_PROVISIONING_TOKEN).toBe('google-phone-token');
    expect(state.databaseCalls).toBeGreaterThan(0);
  });
});


it('does not promote database values into the Google phone authority marker', async () => {
  state.phoneFixture = true;
  vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', undefined);
  await refreshSecrets();
  expect(process.env.PBX_RUNTIME_CONFIG_PROVIDER).toBeUndefined();
  expect(await getDecryptedPlatformSecret('PBX_RUNTIME_CONFIG_PROVIDER')).toBeUndefined();
});

it('reads only scoped phone bindings without querying another credential store', async () => {
  vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER','google-secret-manager');
  vi.stubEnv('PBX_PROVISIONING_TOKEN','google-phone-token');
  expect(await getSecrets(['PBX_PROVISIONING_TOKEN'])).toEqual({PBX_PROVISIONING_TOKEN:'google-phone-token'});
  expect(state.databaseCalls).toBe(0);
});
