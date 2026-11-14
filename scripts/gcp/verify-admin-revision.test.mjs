import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyAdminRevision } from './verify-admin-revision.mjs';
const commit = 'a'.repeat(40);
const url = 'https://elevate-admin-migration-123.us-central1.run.app';
const healthy = extra => new Response(JSON.stringify({ service:'admin', commit, healthy:true, dependencies:{supabase:{ok:true}}, ...extra }), {status:200});
test('cold-start timeout retries and still verifies the exact revision and database', async () => {
  let calls = 0, pauses = 0;
  const result = await verifyAdminRevision(url, commit, { attempts:2, pause:async () => {pauses++}, request:async () => {
    if (++calls === 1) throw new DOMException('Timed out','TimeoutError');
    return healthy();
  } });
  assert.equal(result.verified,true); assert.equal(calls,2); assert.equal(pauses,1);
});
test('wrong revision and unhealthy database cannot pass acceptance', async () => {
  for (const body of [{commit:'b'.repeat(40)}, {dependencies:{supabase:{ok:false}}}, {healthy:false}]) {
    let calls=0;
    await assert.rejects(verifyAdminRevision(url,commit,{attempts:2,pause:async()=>{},request:async()=>{calls++;return healthy(body)}}),/verification budget/);
    assert.equal(calls,2);
  }
});
test('no credentials are sent to a non-Google URL', async () => {
  let calls=0;
  await assert.rejects(verifyAdminRevision('https://old-runtime.code.run',commit,{request:async()=>{calls++}}),/Invalid Google/);
  assert.equal(calls,0);
});


test('Admin revision verification reports sanitized root-cause categories', async () => {
  await assert.rejects(verifyAdminRevision(url, commit, {
    attempts:1, request:async()=>{throw Object.assign(new Error('private-provider-message'), {cause:{code:'ENOTFOUND'}});},
  }), error => error.message.includes('dns_unavailable') && !error.message.includes('private-provider-message'));
  await assert.rejects(verifyAdminRevision(url, commit, {
    attempts:1, request:async()=>healthy({commit:'b'.repeat(40)}),
  }), /revision_mismatch/);
  await assert.rejects(verifyAdminRevision(url, commit, {
    attempts:1, request:async()=>healthy({dependencies:{supabase:{ok:false}}}),
  }), /supabase_unready/);
});

test('actual 503 Admin health payload gives Supabase failure precedence over unhealthy', async () => {
  let calls = 0, pauses = 0;
  await assert.rejects(verifyAdminRevision(url, commit, {
    attempts: 2, pause: async ms => { assert.equal(ms, 5000); pauses++; }, request: async () => {
      calls++;
      return new Response(JSON.stringify({ service: 'admin', commit, status: 'degraded', healthy: false, ready: true,
        configuration: { ok: true, missing: [] }, dependencies: { supabase: { ok: false } },
        privateDetail: 'do-not-emit' }), { status: 503 });
    },
  }), error => error.message.includes('supabase_unready') && !error.message.includes('do-not-emit'));
  assert.equal(calls, 2); assert.equal(pauses, 1);
});

test('HTTP 200 dependency failure also takes precedence over generic unhealthy status', async () => {
  await assert.rejects(verifyAdminRevision(url, commit, {
    attempts: 1, request: async () => healthy({ healthy: false, dependencies: { supabase: { ok: false } } }),
  }), /supabase_unready/);
});

test('unrecognized or malformed 503 Admin responses retain HTTP failure and never verify', async () => {
  for (const payload of ['not-json', 'null', '{}', JSON.stringify({ service: 'admin', commit, healthy: true, dependencies: { supabase: { ok: true } } }),
    JSON.stringify({ service: 'marketing', commit, healthy: false, dependencies: { supabase: { ok: false } } })]) {
    await assert.rejects(verifyAdminRevision(url, commit, {
      attempts: 1, request: async () => new Response(payload, { status: 503 }),
    }), /http_503/);
  }
});
