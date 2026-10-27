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
