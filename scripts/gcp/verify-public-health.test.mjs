import test from 'node:test';
import assert from 'node:assert/strict';
import { verifySite } from './verify-public-health.mjs';

test('dependency failure is reported while process liveness remains healthy', async () => {
  const request = async url => ({ status: url.endsWith('/api/health') ? 503 : 200,
    json: async () => ({ service: 'lms', ok: true, ready: true, healthy: false }) });
  const result = await verifySite('lms', request);
  assert.equal(result.find(x => x.path === '/api/ping').passed, true);
  assert.equal(result.find(x => x.path === '/api/health').passed, false);
  assert.equal(result.find(x => x.path === '/api/ready').passed, true);
});
test('HTTP success cannot conceal a disconnected billing provider', async () => {
  const request = async url => ({ status: 200, json: async () => url.endsWith('/quickbooks')
    ? { ready: true, connected: false, configured: true, webhookVerifierConfigured: true, private: 'secret' }
    : { service: 'marketing', ok: true, ready: true, healthy: true, dependencies: { supabase: { ok: true } } } });
  const result = await verifySite('marketing', request);
  assert.equal(result.filter(x => x.passed).length, 3);
  assert.equal(result.find(x => x.path.endsWith('/quickbooks')).passed, false);
  assert.equal(JSON.stringify(result).includes('secret'), false);
});
