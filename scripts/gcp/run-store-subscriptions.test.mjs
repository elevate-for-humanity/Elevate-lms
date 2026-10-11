import test from 'node:test';
import assert from 'node:assert/strict';
import { runStoreSubscriptions, ADMIN_URL } from './run-store-subscriptions.mjs';
const env = { CRON_SECRET: 'test-cron', CLOUD_RUN_EXECUTION: 'current', EXPECTED_ADMIN_COMMIT: 'a'.repeat(40) };
function fixture(options = {}) {
  const calls = [];
  const request = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/token')) return Response.json({ access_token: 'google-access' });
    if (url.includes('/executions?')) return Response.json({ executions: options.executions || [{ name: 'jobs/job/executions/current' }] });
    if (url.includes('/identity?')) return new Response('google-identity');
    if (url.endsWith('/api/ready')) return Response.json({ service: 'admin', commit: options.wrongCommit ? 'b'.repeat(40) : env.EXPECTED_ADMIN_COMMIT, ready: options.ready !== false, agenticExecutorReady: true });
    if (url.endsWith('/api/health')) return Response.json({ service: 'admin', commit: env.EXPECTED_ADMIN_COMMIT, ready: true, healthy: true, dependencies: { supabase: { ok: options.database !== false } } });
    return Response.json({ ok: !options.failed, processed: 1, completed: 1 }, { status: options.failed ? 207 : 200 });
  };
  return { calls, request };
}
test('authenticates to Google and Admin separately without provider credentials', async () => {
  const f = fixture(); const result = await runStoreSubscriptions(env, f.request);
  assert.equal(result.skipped, false);
  const calls = f.calls.filter((c) => c.init.method === 'POST');
  assert.deepEqual(calls.map((c) => c.url), [ADMIN_URL + '/api/cron/process-billing-fulfillment', ADMIN_URL + '/api/cron/generate-billing-invoices']);
  for (const { init } of calls) { assert.equal(init.headers['X-Serverless-Authorization'], 'Bearer google-identity'); assert.equal(init.headers.Authorization, 'Bearer test-cron'); }
});
test('skips overlapping executions before requesting Admin or reading any payments', async () => {
  const f = fixture({ executions: [{ name: 'jobs/job/executions/other' }] });
  assert.equal((await runStoreSubscriptions(env, f.request)).skipped, true);
  assert.equal(f.calls.length, 2);
});
for (const options of [{ ready: false }, { database: false }, { failed: true }, { wrongCommit: true }]) test('never treats unavailable delivery or a failed batch as success ' + JSON.stringify(options), async () => {
  const f = fixture(options); await assert.rejects(runStoreSubscriptions(env, f.request));
});
test('requires scoped runtime configuration and execution identity', async () => {
  await assert.rejects(runStoreSubscriptions({}));
});
