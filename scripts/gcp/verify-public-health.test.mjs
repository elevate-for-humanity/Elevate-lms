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

test('failed dependency diagnostics preserve only safe status, timing and error classes', async () => {
 const request=async()=>({status:503,json:async()=>({service:'lms',ready:true,healthy:false,dependencies:{supabase:{ok:false,status:503,latencyMs:2501,error:'TimeoutError',secret:'do-not-print',checks:{auth:{ok:true,status:200,latencyMs:10},database:{ok:false,status:503,latencyMs:2501,error:'TimeoutError',body:'do-not-print'}}}}})});
 const result=await verifySite('lms',request),health=result.find(x=>x.path==='/api/health');
 assert.equal(health.supabase.error,'TimeoutError');assert.equal(health.database.status,503);assert.equal(health.database.latencyMs,2501);assert.equal(JSON.stringify(result).includes('do-not-print'),false);
});
test('network and malformed JSON failures remain distinguishable',async()=>{
 for(const name of ['TimeoutError','SyntaxError']) {
  const result=await verifySite('store',async()=>{const e=new Error('private-message');e.name=name;throw e;});
  assert.equal(result[0].error,name);assert.equal(JSON.stringify(result).includes('private-message'),false);
 }
});

test('one transient Admin ping timeout recovers without weakening service identity checks', async () => {
  const attempts = new Map();
  const request = async url => {
    attempts.set(url, (attempts.get(url) ?? 0) + 1);
    if (url.endsWith('/api/ping') && attempts.get(url) === 1) {
      const error = new Error('private-upstream-message');
      error.name = 'TimeoutError';
      throw error;
    }
    return { status: 200, json: async () => ({
      service: 'admin', ok: true, ready: true, healthy: true, agenticExecutorReady: true,
      dependencies: { supabase: { ok: true } },
    }) };
  };
  const results = await verifySite('admin', request);
  assert.equal(results.every(row => row.passed), true);
  assert.equal(attempts.get('https://admin.elevateforhumanity.org/api/ping'), 2);
  assert.equal(attempts.get('https://admin.elevateforhumanity.org/api/health'), 1);
  assert.equal(JSON.stringify(results).includes('private-upstream-message'), false);
});

test('persistent network timeouts fail after precisely one bounded retry', async () => {
  let calls = 0;
  const results = await verifySite('admin', async url => {
    if (url.endsWith('/api/ping')) {
      calls++;
      const error = new Error('private-upstream-message');
      error.name = 'TimeoutError';
      throw error;
    }
    return { status: 200, json: async () => ({
      service: 'admin', ok: true, ready: true, healthy: true, agenticExecutorReady: true,
      dependencies: { supabase: { ok: true } },
    }) };
  });
  assert.equal(calls, 2);
  assert.deepEqual(
    { passed: results[0].passed, error: results[0].error },
    { passed: false, error: 'TimeoutError' },
  );
  assert.equal(JSON.stringify(results).includes('private-upstream-message'), false);
});

test('HTTP errors and incorrect service identities are never retried', async () => {
  for (const badResponse of [
    { status: 503, body: { service: 'admin', ok: true } },
    { status: 200, body: { service: 'marketing', ok: true } },
  ]) {
    let pingAttempts = 0;
    const results = await verifySite('admin', async url => {
      if (url.endsWith('/api/ping')) {
        pingAttempts++;
        return { status: badResponse.status, json: async () => badResponse.body };
      }
      return { status: 200, json: async () => ({
        service: 'admin', healthy: true, ready: true, dependencies: { supabase: { ok: true } },
      }) };
    });
    assert.equal(results[0].passed, false);
    assert.equal(pingAttempts, 1);
  }
});

test('malformed health JSON is not retried and remains a failure', async () => {
  let attempts = 0;
  const results = await verifySite('admin', async url => {
    if (url.endsWith('/api/ping')) {
      attempts++;
      return { status: 200, json: async () => { throw new SyntaxError('secret-invalid-body'); } };
    }
    return { status: 200, json: async () => ({
      service: 'admin', healthy: true, ready: true, dependencies: { supabase: { ok: true } },
    }) };
  });
  assert.equal(attempts, 1);
  assert.equal(results[0].passed, false);
  assert.equal(results[0].error, 'SyntaxError');
  assert.equal(JSON.stringify(results).includes('secret-invalid-body'), false);
});

 test('a responsive Admin still fails readiness without its agentic executor', async () => {
  const results = await verifySite('admin', async () => ({ status: 200, json: async () => ({
    service: 'admin', ok: true, ready: true, healthy: true,
    dependencies: { supabase: { ok: true } },
  }) }));
  assert.equal(results.find(row => row.path === '/api/ready').passed, false);
});
