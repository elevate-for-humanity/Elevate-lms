import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyActiveBilling } from './verify-active-billing.mjs';
const config = {
  runtimeEnvironment: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'private-db-key',
  },
};
function fixture({
  provider = 'quickbooks',
  health = { service: 'quickbooks', ready: true, connected: true, webhookVerifierConfigured: true },
} = {}) {
  const calls = [];
  return {
    calls,
    options: {
      readConfig: () => config,
      request: async (url, options) => {
        calls.push({ url: String(url), options });
        if (String(url).includes('/rest/v1/platform_settings'))
          return Response.json([{ key: 'billing_provider', value: provider }]);
        assert.equal(String(url), 'https://www.elevateforhumanity.org/api/health/quickbooks');
        assert.equal(options.headers?.Authorization, undefined);
        return Response.json(health, { status: health.ready ? 200 : 503 });
      },
    },
  };
}
test('QuickBooks invoice billing does not require PayPal or imply automatic collection', async () => {
  const f = fixture();
  const result = await verifyActiveBilling(f.options);
  assert.equal(result.ready, true);
  assert.equal(result.primary, 'quickbooks');
  assert.equal(result.recurring.provider, 'quickbooks');
  assert.equal(result.recurring.collectionMode, 'manual_invoice');
  assert.equal(result.recurring.automaticDebit, false);
  assert.ok(f.calls.every((c) => !c.url.includes('paypal') && !c.url.includes('stripe')));
  assert.equal(result.transactionsCreated, 0);
  assert.ok(!JSON.stringify(result).includes('private-db-key'));
});
test('retired or ambiguous provider settings fail closed', async () => {
  for (const provider of ['paypal', 'stripe', 'unknown']) {
    const f = fixture({ provider });
    assert.equal((await verifyActiveBilling(f.options)).error, 'BILLING_AUTHORITY_MISMATCH');
    assert.equal(f.calls.length, 1);
  }
});
test('invalid QuickBooks authorization or webhook configuration cannot pass', async () => {
  for (const health of [
    {
      service: 'quickbooks',
      ready: false,
      connected: false,
      reason: 'oauth_reauthorization_required',
    },
    {
      service: 'quickbooks',
      ready: false,
      connected: true,
      webhookVerifierConfigured: false,
      reason: 'webhook_verifier_missing',
    },
  ]) {
    const result = await verifyActiveBilling(fixture({ health }).options);
    assert.equal(result.ready, false);
    assert.equal(result.invoices.reason, health.reason);
  }
});
test('provider errors never expose secrets', async () => {
  const f = fixture();
  f.options.request = async () => {
    throw Error('private-db-key private-provider-payload');
  };
  const result = await verifyActiveBilling(f.options);
  assert.equal(result.ready, false);
  assert.ok(!JSON.stringify(result).includes('private'));
});
