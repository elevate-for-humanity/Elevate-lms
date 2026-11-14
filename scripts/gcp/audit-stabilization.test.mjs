import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseQuickBooks, servingEnvironment } from './audit-stabilization.mjs';
const env = { NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'private-service-key', ELEVATE_RUNTIME_CONFIG_PROVIDER: 'google-secret-manager', QB_CLIENT_ID: 'private-client', QB_CLIENT_SECRET: 'private-secret', QB_ACCESS_TOKEN: 'private-access', QB_REFRESH_TOKEN: 'private-refresh', QB_REALM_ID: 'private-company', QB_WEBHOOK_VERIFIER_TOKEN: 'private-verifier' };
test('read-only QuickBooks diagnostics expose statuses without credentials or provider bodies', async () => {
  const calls = [];
  const result = await diagnoseQuickBooks(env, async (url, init) => {
    calls.push({ url, init });
    return url.includes('/app_settings?') ? Response.json([]) : new Response('private-provider-body', { status: 401 });
  });
  assert.equal(result.companyStatus, 401);
  assert.equal(result.reason, 'access_token_rejected_refresh_path_requires_verification');
  assert.ok(!JSON.stringify(result).includes('private-'));
  assert.ok(calls.every(call => !call.init.method || call.init.method === 'GET'));
  assert.ok(calls.every(call => !call.url.includes('tokens/bearer')));
});
test('database read failures remain explicit and safe', async () => {
  const result = await diagnoseQuickBooks(env, async () => new Response('private-database-body', { status: 403 }));
  assert.equal(result.reason, 'settings_lookup_failed'); assert.equal(result.status, 403);
  assert.ok(!JSON.stringify(result).includes('private-'));
});
test('serving environment refuses an ambiguous traffic split', () => {
  assert.throws(() => servingEnvironment('store', () => JSON.stringify({ status: { traffic: [{ percent: 50 }, { percent: 50 }] } })), /ambiguous/);
});
