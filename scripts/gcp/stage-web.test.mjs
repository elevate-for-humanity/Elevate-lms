import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runtimeForGoogle,
  completeStoreConfig,
  verifyExistingStage,
  loadStageConfig,
} from './stage-web.mjs';
const base = () => ({
  runtimeEnvironment: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-public',
    SUPABASE_SERVICE_ROLE_KEY: 'test-private',
    PORT: '3000',
    MULTILINE: 'one\ntwo',
    QUOTED: 'a,b="c"',
  },
});
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
  const store = {
    component: 'store',
    runtimeEnvironment: {
      SERVICE_ROLE: 'store',
      STORE_URL: 'https://store.example.com',
      QB_CLIENT_ID: 'store-client',
      QB_CLIENT_SECRET: 'store-secret',
    },
    volumes: [],
    runtimeFiles: {},
  };
  const marketing = { ...base(), component: 'marketing' };
  Object.assign(marketing.runtimeEnvironment, {
    QB_CLIENT_ID: 'marketing-client',
    QB_CLIENT_SECRET: 'commerce',
    ENVATO_API_TOKEN: 'studio-only',
    NORTHFLANK_API_TOKEN: 'retired',
    STRIPE_SECRET_KEY: 'retired',
  });
  const result = completeStoreConfig(store, marketing);
  assert.equal(result.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY, 'test-private');
  assert.equal(result.runtimeEnvironment.QB_CLIENT_SECRET, 'store-secret');
  assert.equal(result.runtimeEnvironment.QB_CLIENT_ID, 'store-client');
  assert.equal(result.runtimeEnvironment.STORE_URL, 'https://store.example.com');
  for (const key of ['ENVATO_API_TOKEN', 'NORTHFLANK_API_TOKEN', 'STRIPE_SECRET_KEY'])
    assert.equal(result.runtimeEnvironment[key], undefined);
  assert.equal(store.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY, undefined);
  const incomplete = { ...store, runtimeEnvironment: { ...store.runtimeEnvironment } };
  delete incomplete.runtimeEnvironment.QB_CLIENT_SECRET;
  assert.throws(() => completeStoreConfig(incomplete, marketing), /matching secret/);
});
test('Store completion rejects a conflicting database or persistent state before deployment', () => {
  const store = {
    component: 'store',
    runtimeEnvironment: { NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co' },
    volumes: [],
    runtimeFiles: {},
  };
  assert.throws(
    () => completeStoreConfig(store, { ...base(), component: 'marketing' }),
    /Unexpected/,
  );
  assert.throws(
    () =>
      completeStoreConfig(
        { ...store, runtimeEnvironment: {}, volumes: [{}] },
        { ...base(), component: 'marketing' },
      ),
    /volumes/,
  );
});
test('rejects incomplete or wrong database configuration', () => {
  const source = base();
  delete source.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY;
  assert.throws(() => runtimeForGoogle(source, {}), /missing/);
  source.runtimeEnvironment.NEXT_PUBLIC_SUPABASE_URL = 'https://other.supabase.co';
  assert.throws(() => runtimeForGoogle(source, {}), /Unexpected/);
});
test('does not silently lose persistent data, secret files or unresolved templates', () => {
  assert.throws(() => runtimeForGoogle(base(), { deployment: { volumes: [{}] } }), /volumes/);
  assert.throws(
    () => runtimeForGoogle({ ...base(), runtimeFiles: { '/secret': {} } }, {}),
    /files/,
  );
  const source = base();
  source.runtimeEnvironment.SECRET = '${unresolved}';
  assert.throws(() => runtimeForGoogle(source, {}), /Unresolved/);
});
function existing() {
  return {
    metadata: { annotations: {} },
    spec: {
      template: {
        spec: {
          serviceAccountName: 'runtime',
          containers: [
            {
              image: 'image@sha256:approved',
              env: [{ name: 'KEY', value: 'value' }],
              ports: [{ containerPort: 3000 }],
              startupProbe: { httpGet: { path: '/api/ping' } },
              livenessProbe: { httpGet: { path: '/api/ping' } },
            },
          ],
        },
      },
    },
  };
}
test('a failed verification can retry the exact existing runtime without redeployment', () => {
  assert.equal(
    verifyExistingStage(existing(), 'image@sha256:approved', 'runtime', { KEY: 'value' }),
    true,
  );
});
for (const field of ['image', 'identity', 'credential', 'probe', 'public'])
  test('retry refuses an unexpected ' + field + ' instead of overwriting production', () => {
    const resource = existing(),
      container = resource.spec.template.spec.containers[0];
    if (field === 'image') container.image = 'different';
    if (field === 'identity') resource.spec.template.spec.serviceAccountName = 'different';
    if (field === 'credential') container.env[0].value = 'different';
    if (field === 'probe') container.startupProbe.httpGet.path = '/';
    if (field === 'public')
      resource.metadata.annotations['run.googleapis.com/invoker-iam-disabled'] = 'true';
    assert.throws(() =>
      verifyExistingStage(resource, 'image@sha256:approved', 'runtime', { KEY: 'value' }),
    );
  });

// A tenant-owned client must never inherit another tenant's OAuth grant.
test('Store OAuth grant is not assembled from Marketing tokens', () => {
  const store = {
    component: 'store',
    runtimeEnvironment: { QB_CLIENT_ID: 'store-client', QB_CLIENT_SECRET: 'store-secret' },
    volumes: [],
    runtimeFiles: {},
  };
  const marketing = { ...base(), component: 'marketing' };
  Object.assign(marketing.runtimeEnvironment, {
    QB_CLIENT_ID: 'marketing-client',
    QB_CLIENT_SECRET: 'marketing-secret',
    QB_ACCESS_TOKEN: 'marketing-token',
    QB_REFRESH_TOKEN: 'marketing-refresh',
    QB_REALM_ID: 'marketing-company',
  });
  const result = completeStoreConfig(store, marketing);
  for (const key of ['QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID'])
    assert.equal(result.runtimeEnvironment[key], undefined);
});
test('Store partial OAuth credentials fail closed even for the same client ID', () => {
  const store = {
    component: 'store',
    runtimeEnvironment: { QB_CLIENT_ID: 'shared-client' },
    volumes: [],
    runtimeFiles: {},
  };
  const marketing = { ...base(), component: 'marketing' };
  Object.assign(marketing.runtimeEnvironment, {
    QB_CLIENT_ID: 'shared-client',
    QB_CLIENT_SECRET: 'marketing-secret',
  });
  assert.throws(() => completeStoreConfig(store, marketing), /matching secret/);
});

test('verified independent Store never reads Marketing configuration', () => {
  const store = { ...base(), component: 'store', storeConfigurationIndependent: true };
  Object.assign(store.runtimeEnvironment, {
    QB_CLIENT_ID: 'qb',
    QB_CLIENT_SECRET: 'qb-secret',
    PAYPAL_CLIENT_ID: 'paypal',
    PAYPAL_CLIENT_SECRET: 'paypal-secret',
  });
  const calls = [];
  assert.equal(
    loadStageConfig('store', (component) => {
      calls.push(component);
      if (component !== 'store') throw Error('Marketing unavailable');
      return store;
    }),
    store,
  );
  assert.deepEqual(calls, ['store']);
  delete store.runtimeEnvironment.PAYPAL_CLIENT_SECRET;
  assert.equal(
    loadStageConfig('store', () => store),
    store,
  );
  delete store.runtimeEnvironment.QB_CLIENT_SECRET;
  assert.throws(() => loadStageConfig('store', () => store), /incomplete/);
});
test('unmigrated Store retains the approved bootstrap dependency', () => {
  const calls = [];
  const config = loadStageConfig('store', (component) => {
    calls.push(component);
    return component === 'store'
      ? { component, runtimeEnvironment: {}, volumes: [], runtimeFiles: {} }
      : { ...base(), component };
  });
  assert.deepEqual(calls, ['store', 'marketing']);
  assert.equal(config.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY, 'test-private');
});

test('Store bootstrap retains the PayPal settings actually consumed by billing', () => {
  const store = { component: 'store', runtimeEnvironment: {}, volumes: [], runtimeFiles: {} };
  const marketing = { ...base(), component: 'marketing' };
  Object.assign(marketing.runtimeEnvironment, {
    PAYPAL_CLIENT_ID: 'approved-client',
    PAYPAL_CLIENT_SECRET: 'approved-secret',
    PAYPAL_ENVIRONMENT: 'production',
    PAYPAL_BILLING_WEBHOOK_ID: 'approved-billing-webhook',
    PAYPAL_PAYOUT_WEBHOOK_ID: 'payout-webhook',
  });
  const result = completeStoreConfig(store, marketing);
  assert.equal(result.runtimeEnvironment.PAYPAL_ENVIRONMENT, 'production');
  assert.equal(result.runtimeEnvironment.PAYPAL_BILLING_WEBHOOK_ID, 'approved-billing-webhook');
  assert.equal(result.runtimeEnvironment.PAYPAL_PAYOUT_WEBHOOK_ID, 'payout-webhook');
});
test('Store-owned PayPal identity cannot inherit Marketing environment or webhook', () => {
  const store = {
    component: 'store',
    runtimeEnvironment: { PAYPAL_CLIENT_ID: 'store-client', PAYPAL_CLIENT_SECRET: 'store-secret' },
    volumes: [],
    runtimeFiles: {},
  };
  const marketing = { ...base(), component: 'marketing' };
  Object.assign(marketing.runtimeEnvironment, {
    PAYPAL_ENVIRONMENT: 'production',
    PAYPAL_BILLING_WEBHOOK_ID: 'marketing-webhook',
  });
  const result = completeStoreConfig(store, marketing);
  assert.equal(result.runtimeEnvironment.PAYPAL_ENVIRONMENT, undefined);
  assert.equal(result.runtimeEnvironment.PAYPAL_BILLING_WEBHOOK_ID, undefined);
});

test('Store bootstrap retains QuickBooks environment as part of its identity family', () => {
  const store = { component: 'store', runtimeEnvironment: {}, volumes: [], runtimeFiles: {} };
  const marketing = { ...base(), component: 'marketing' };
  Object.assign(marketing.runtimeEnvironment, {
    QB_CLIENT_ID: 'marketing-client',
    QB_CLIENT_SECRET: 'marketing-secret',
    QB_ENVIRONMENT: 'sandbox',
  });
  assert.equal(completeStoreConfig(store, marketing).runtimeEnvironment.QB_ENVIRONMENT, 'sandbox');
  Object.assign(store.runtimeEnvironment, {
    QB_CLIENT_ID: 'store-client',
    QB_CLIENT_SECRET: 'store-secret',
  });
  assert.equal(completeStoreConfig(store, marketing).runtimeEnvironment.QB_ENVIRONMENT, undefined);
});
