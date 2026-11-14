import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyRuntimeReadiness } from './verify-runtime-readiness.mjs';
const base = 'https://elevate-marketing-migration-example.run.app';
const good = { service: 'marketing', healthy: true, ready: true, dependencies: { supabase: { ok: true } } };
test('bounded cold-start retry still checks both health and readiness', async () => {
  let calls = 0; let pauses = 0;
  const r = await verifyRuntimeReadiness('marketing', base, 'test', { request: async () => { calls++; if (calls === 1) throw new Error('timeout'); return { status: 200, json: async () => good }; }, pause: async () => { pauses++; } });
  assert.equal(r.passed, true); assert.equal(calls, 3); assert.equal(pauses, 1);
});
test('persistent disconnected dependency never passes on HTTP 200', async () => {
  let calls = 0;
  await assert.rejects(verifyRuntimeReadiness('marketing', base, 'test', { attempts: 2, pause: async () => {}, request: async () => { calls++; return { status: 200, json: async () => ({ ...good, dependencies: { supabase: { ok: false } } }) }; } }), /budget exhausted/);
  assert.equal(calls, 2);
});
test('authentication and routing failures fail immediately', async () => {
  for (const status of [401, 403, 404]) {
    let calls = 0;
    await assert.rejects(verifyRuntimeReadiness('marketing', base, 'test', { pause: async () => { throw new Error('unexpected retry'); }, request: async () => { calls++; return { status, json: async () => ({}) }; } }), /rejected/);
    assert.equal(calls, 1);
  }
});
test('Admin must still demonstrate executor readiness', async () => {
  await assert.rejects(verifyRuntimeReadiness('admin', base, 'test', { attempts: 1, request: async () => ({ status: 200, json: async () => ({ ...good, service: 'admin' }) }) }), /budget exhausted/);
});

test('Store accepts its own identity and rejects Marketing', async () => {
 const request=service=>async()=>({status:200,json:async()=>({...good,service})});
 assert.equal((await verifyRuntimeReadiness('store',base,'test',{attempts:1,request:request('store')})).passed,true);
 await assert.rejects(verifyRuntimeReadiness('store',base,'test',{attempts:1,request:request('marketing')}),/budget exhausted/);
});


test('DNS, timeout and dependency failures report safe, actionable classes', async () => {
  const failure = (code, message = 'private-token-must-not-appear') => Object.assign(new Error(message), {cause: {code}});
  for (const [code, reason] of [['ENOTFOUND', 'dns_unavailable'], ['EAI_AGAIN', 'dns_unavailable'], ['ECONNREFUSED', 'connection_unavailable'], ['ETIMEDOUT', 'timeout']]) {
    await assert.rejects(verifyRuntimeReadiness('marketing', base, 'secret-token', {
      attempts: 1, request: async () => { throw failure(code); },
    }), error => error.message.includes(reason) && !error.message.includes('private-token') && !error.message.includes('secret-token'));
  }
  await assert.rejects(verifyRuntimeReadiness('marketing', base, 'secret-token', {
    attempts: 1, request: async () => ({status:503, json:async()=>({})}),
  }), /marketing \/api\/health http_503/);
  await assert.rejects(verifyRuntimeReadiness('marketing', base, 'secret-token', {
    attempts: 1, request: async () => ({status:200, json:async()=>({...good, dependencies:{supabase:{ok:false}}})}),
  }), /supabase_unready/);
});

test('Admin executor failure and wrong backend identity are distinct', async () => {
  await assert.rejects(verifyRuntimeReadiness('admin', base, 'token', {
    attempts:1, request:async()=>({status:200,json:async()=>({...good,service:'admin'})}),
  }), /agentic_executor_unready|supabase_unready|health_contract_unmet/);
  await assert.rejects(verifyRuntimeReadiness('admin', base, 'token', {
    attempts:1, request:async()=>({status:200,json:async()=>good}),
  }), /service_mismatch/);
});

test('actual 503 health payloads identify Supabase failures without changing the retry budget', async () => {
  for (const service of ['admin', 'marketing', 'lms']) {
    let calls = 0, pauses = 0;
    await assert.rejects(verifyRuntimeReadiness(service, base, 'private-token', {
      attempts: 2, pause: async ms => { assert.equal(ms, 5000); pauses++; },
      request: async () => {
        calls++;
        return new Response(JSON.stringify({ service, status: 'degraded', healthy: false, ready: true,
          configuration: { ok: true, missing: [] }, dependencies: { supabase: { ok: false } },
          privateDetail: 'do-not-emit' }), { status: 503 });
      },
    }), error => error.message.includes(service + ' /api/health supabase_unready') && !error.message.includes('do-not-emit'));
    assert.equal(calls, 2); assert.equal(pauses, 1);
  }
});

test('actual Admin 503 readiness payload identifies the stopped executor', async () => {
  let healthCalls = 0, readyCalls = 0;
  await assert.rejects(verifyRuntimeReadiness('admin', base, 'token', {
    attempts: 2, pause: async () => {}, request: async url => {
      if (url.pathname === '/api/health') {
        healthCalls++;
        return new Response(JSON.stringify({ ...good, service: 'admin' }));
      }
      readyCalls++;
      return new Response(JSON.stringify({ service: 'admin', ready: false, status: 'not_ready',
        missing: ['AGENTIC_EXECUTOR'], agenticExecutorReady: false }), { status: 503 });
    },
  }), /admin \/api\/ready agentic_executor_unready/);
  assert.equal(healthCalls, 1); assert.equal(readyCalls, 2);
});

test('malformed, unknown and wrong-service 503 bodies retain the HTTP fallback', async () => {
  for (const payload of ['not-json', 'null', '{}', JSON.stringify({ service: 'admin', dependencies: { supabase: { ok: false } } }), JSON.stringify(good)]) {
    await assert.rejects(verifyRuntimeReadiness('marketing', base, 'token', {
      attempts: 1, request: async () => new Response(payload, { status: 503 }),
    }), /marketing \/api\/health http_503/);
  }
});
