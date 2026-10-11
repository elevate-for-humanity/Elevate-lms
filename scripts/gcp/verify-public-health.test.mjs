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

test('Store is monitored independently with its own runtime identity', async () => {
  const seen = [];
  const request = async url => {
    seen.push(url);
    return { status: 200, json: async () => ({ service: 'store', ok: true, ready: true, healthy: true, dependencies: { supabase: { ok: true } } }) };
  };
  const result = await verifySite('store', request);
  assert.equal(result.length, 3);
  assert.equal(result.every(x => x.component === 'store' && x.passed), true);
  assert.equal(seen.every(url => url.startsWith('https://store.elevateforhumanity.org/')), true);
  const failed = await verifySite('store', async () => ({ status: 503, json: async () => ({}) }));
  assert.equal(failed.some(x => x.passed), false);
});

test('Store rejects a healthy response from Marketing', async () => {
 const result = await verifySite('store', async () => ({status:200,json:async () => ({service:'marketing',ok:true,ready:true,healthy:true,dependencies:{supabase:{ok:true}}})}));
 assert.equal(result.some(x=>x.passed),false);
});
