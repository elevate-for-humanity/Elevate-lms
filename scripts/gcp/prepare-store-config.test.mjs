import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareStoreConfig, prepareStoreConfiguration } from './prepare-store-config.mjs';
const source = () => ({
  version: 1,
  component: 'marketing',
  volumes: [],
  runtimeFiles: {},
  runtimeEnvironment: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co',
    SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test',
    SUPABASE_SERVICE_ROLE_KEY: 'private-test',
    NEXTAUTH_SECRET: 'auth-test',
    QB_ENVIRONMENT: 'production',
    QB_CLIENT_ID: 'qb-test',
    QB_CLIENT_SECRET: 'qb-secret-test',
    QB_REDIRECT_URI: 'https://store.elevateforhumanity.org/api/auth/quickbooks/callback',
    QB_WEBHOOK_VERIFIER_TOKEN: 'verifier-test',
    PAYPAL_CLIENT_ID: 'paypal-test',
    PAYPAL_CLIENT_SECRET: 'paypal-secret-test',
    PAYPAL_MODE: 'live',
    PAYPAL_ENVIRONMENT: 'production',
    PAYPAL_API_BASE: 'https://api-m.paypal.com',
    PAYPAL_WEBHOOK_ID: 'checkout-hook-test',
    PAYPAL_BILLING_WEBHOOK_ID: 'billing-hook-test',
    GITHUB_TOKEN: 'unrelated-private-test',
    TAX_ENCRYPTION_KEY: 'unrelated-tax-test',
    ENVATO_API_TOKEN: 'unrelated-studio-test',
  },
});
const store = () => ({
  version: 1,
  component: 'store',
  volumes: [],
  runtimeFiles: {},
  runtimeEnvironment: { STORE_ONLY_RUNTIME: 'true' },
});
function fixture() {
  let current = store();
  const marketing = source(),
    writes = [];
  return {
    writes,
    marketing,
    run(args, input) {
      const t = args.join(' ');
      if (t.includes('versions add')) {
        writes.push({ args, input });
        current = JSON.parse(input);
        return JSON.stringify({
          name: 'projects/484736877039/secrets/elevate-store-runtime-config/versions/12',
        });
      }
      if (t.includes('elevate-marketing-runtime-config')) return JSON.stringify(marketing);
      if (t.includes('elevate-store-runtime-config')) return JSON.stringify(current);
      throw Error('Unexpected operation');
    },
  };
}
test('prepares only approved keys without removing inheritance or accepting commerce', () => {
  const s = store(),
    r = prepareStoreConfig(s, source());
  assert.equal(r.candidate.runtimeEnvironment.PAYPAL_CLIENT_ID, 'paypal-test');
  for (const k of ['GITHUB_TOKEN', 'TAX_ENCRYPTION_KEY', 'ENVATO_API_TOKEN'])
    assert.equal(r.candidate.runtimeEnvironment[k], undefined);
  assert.equal(r.candidate.storeConfigurationIndependent, undefined);
  assert.equal(r.summary.storeCallbackConfigured, true);
  assert.equal(r.summary.merchantAccepted, false);
  assert.deepEqual(s, store());
});
test('dry run makes no write and exposes no secrets', async () => {
  const f = fixture(),
    r = await prepareStoreConfiguration({ run: f.run });
  assert.equal(f.writes.length, 0);
  assert.equal(r.mode, 'validate-only');
  assert.ok(!JSON.stringify(r).includes('secret-test'));
});
test('prepares and reads back a new version without changing traffic or deleting old versions', async () => {
  const f = fixture(),
    r = await prepareStoreConfiguration({ run: f.run, apply: true });
  assert.equal(f.writes.length, 1);
  assert.equal(r.configurationChanged, true);
  assert.equal(r.previousVersionsPreserved, true);
  assert.equal(r.trafficChanged, false);
  assert.equal(JSON.parse(f.writes[0].input).storeConfigurationIndependent, undefined);
  assert.ok(f.writes[0].args.includes('--data-file=-'));
});
for (const [name, mutate, pattern] of [
  ['QuickBooks sandbox', (e) => (e.QB_ENVIRONMENT = 'sandbox'), /PRODUCTION_ENVIRONMENT/],
  ['missing QuickBooks environment', (e) => delete e.QB_ENVIRONMENT, /PRODUCTION_ENVIRONMENT/],
  ['database alias', (e) => (e.SUPABASE_URL = 'https://other.supabase.co'), /DATABASE_ALIAS/],
  ['missing auth', (e) => delete e.NEXTAUTH_SECRET, /AUTH_SECRET/],
  ['missing verifier', (e) => delete e.QB_WEBHOOK_VERIFIER_TOKEN, /VERIFIER_MISSING/],
  [
    'conflicting verifiers',
    (e) => (e.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN = 'different-test'),
    /VERIFIER_CONFLICT/,
  ],
])
  test('rejects ' + name, () => {
    const m = source();
    mutate(m.runtimeEnvironment);
    assert.throws(() => prepareStoreConfig(store(), m), pattern);
  });
test('preserves registered Marketing callback but refuses to accept it as Store cutover', () => {
  const m = source();
  m.runtimeEnvironment.QB_REDIRECT_URI =
    'https://www.elevateforhumanity.org/api/auth/quickbooks/callback';
  const r = prepareStoreConfig(store(), m);
  assert.equal(r.summary.storeCallbackConfigured, false);
  assert.equal(
    r.candidate.runtimeEnvironment.QB_REDIRECT_URI,
    m.runtimeEnvironment.QB_REDIRECT_URI,
  );
});
test('concurrent source change prevents all writes', async () => {
  const f = fixture();
  let reads = 0;
  await assert.rejects(
    prepareStoreConfiguration({
      apply: true,
      run(args, input) {
        if (args.join(' ').includes('elevate-marketing-runtime-config') && ++reads === 2) {
          const m = structuredClone(f.marketing);
          m.runtimeEnvironment.EMAIL_FROM = 'changed@example.com';
          return JSON.stringify(m);
        }
        return f.run(args, input);
      },
    }),
    /CHANGED_DURING/,
  );
  assert.equal(f.writes.length, 0);
});

test('independent Store never reads Marketing even during preparation', async () => {
  const s = { ...source(), component: 'store', storeConfigurationIndependent: true };
  const calls = [];
  const r = await prepareStoreConfiguration({
    run(args) {
      calls.push(args.join(' '));
      assert.ok(!args.join(' ').includes('elevate-marketing-runtime-config'));
      return JSON.stringify(s);
    },
  });
  assert.equal(r.mode, 'already-independent');
  assert.equal(calls.length, 1);
});
test('incorrect version readback is rejected without reporting acceptance', async () => {
  const f = fixture();
  await assert.rejects(
    prepareStoreConfiguration({
      apply: true,
      run(args, input) {
        if (args.includes('--secret=elevate-store-runtime-config') && args[3] === '12')
          return JSON.stringify(store());
        return f.run(args, input);
      },
    }),
    /READBACK_FAILED/,
  );
  assert.equal(f.writes.length, 1);
});

test('Store checkout and release work without any PayPal credentials', () => {
  const m = source();
  for (const key of Object.keys(m.runtimeEnvironment))
    if (key.startsWith('PAYPAL_')) delete m.runtimeEnvironment[key];
  const result = prepareStoreConfig(store(), m);
  assert.equal(result.summary.billingProvider, 'quickbooks');
  assert.equal(result.summary.collectionMode, 'manual_invoice');
});
