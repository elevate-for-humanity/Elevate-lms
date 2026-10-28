import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseApprovedWeb, releaseCurrentWorkflow, resolveReleaseCredential } from './release-approved-web.mjs';
const sha = 'a'.repeat(40);
function setup({ green = true, current = sha, active = false, readback = 'false' } = {}) {
  const calls = []; let holdReads = 0;
  const request = async (url, init) => {
    const path = new URL(url).pathname;
    calls.push({ path, method: init.method, body: init.body && JSON.parse(init.body) });
    if (path.endsWith('git/ref/heads/main')) return Response.json({ object: { sha: current } });
    if (path.endsWith('ci.yml/runs')) return Response.json({ workflow_runs: [{ id: 1, head_sha: sha }] });
    if (path.endsWith('/jobs')) return Response.json({ jobs: [{ name: 'CI Required Gate', status: 'completed', conclusion: green ? 'success' : 'failure' }] });
    if (path.endsWith('GOOGLE_RELEASE_HOLD')) {
      if (init.method === 'PATCH') return new Response(null, { status: 204 });
      return Response.json({ value: ++holdReads === 1 ? 'true' : readback });
    }
    if (path.endsWith('/runs')) return Response.json({ workflow_runs: active ? [{ head_sha: sha, status: 'in_progress' }] : [] });
    if (path.endsWith('/dispatches')) return new Response(null, { status: 204 });
    throw Error('Unexpected request');
  };
  return { calls, request };
}
test('changes the hold setting, verifies it and dispatches only the four web services', async () => {
  const s = setup(); const result = await releaseApprovedWeb({ sha, token: 'private-test-token', request: s.request });
  assert.equal(result.releaseHold, false); assert.equal(result.deploymentVerified, false);
  assert.equal(s.calls.filter(c => c.method === 'PATCH').length, 1);
  assert.equal(s.calls.filter(c => c.path.endsWith('/dispatches')).length, 4);
  assert.ok(!JSON.stringify(result).includes('private-test-token'));
});
test('failed CI and changed main prevent all mutations', async () => {
  for (const options of [{ green: false }, { current: 'b'.repeat(40) }]) {
    const s = setup(options); await assert.rejects(releaseApprovedWeb({ sha, token: 'test', request: s.request }));
    assert.ok(s.calls.every(c => c.method === 'GET'));
  }
});
test('failed hold readback prevents deployment dispatch', async () => {
  const s = setup({ readback: 'true' }); await assert.rejects(releaseApprovedWeb({ sha, token: 'test', request: s.request }), /READBACK/);
  assert.equal(s.calls.filter(c => c.path.endsWith('/dispatches')).length, 0);
});
test('an existing active release is not dispatched again', async () => {
  const s = setup({ active: true }); const result = await releaseApprovedWeb({ sha, token: 'test', request: s.request });
  assert.ok(result.workflows.every(w => w.status === 'already_active'));
  assert.equal(s.calls.filter(c => c.path.endsWith('/dispatches')).length, 0);
});

const workflowEnv = { GITHUB_REPOSITORY: 'elevate-for-humanity/Elevate-lms', GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_SHA: sha, GH_TOKEN: 'scoped-job-token', GOOGLE_RELEASE_HOLD: 'false' };
test('trusted main dispatch uses only its scoped job token and never edits repository variables', async () => {
  const s = setup();
  const result = await releaseCurrentWorkflow(workflowEnv, async (url, init) => {
    assert.equal(init.headers.Authorization, 'Bearer scoped-job-token');
    assert.ok(!url.includes('/variables/'));
    return s.request(url, init);
  });
  assert.equal(result.workflows.length, 4);
  assert.equal(s.calls.filter(c => c.path.endsWith('/dispatches')).length, 4);
  assert.ok(s.calls.every(c => c.method !== 'PATCH'));
});
test('a held, absent, or untrusted workflow cannot dispatch or seek another credential', async () => {
  for (const change of [{ GOOGLE_RELEASE_HOLD: 'true' }, { GOOGLE_RELEASE_HOLD: '' }, { GOOGLE_RELEASE_HOLD: undefined }, { GH_TOKEN: '' }, { GITHUB_REF: 'refs/heads/repair' }, { GITHUB_EVENT_NAME: 'pull_request' }, { GITHUB_REPOSITORY: 'other/repo' }]) {
    let calls = 0;
    await assert.rejects(releaseCurrentWorkflow({ ...workflowEnv, ...change }, async () => { calls++; throw Error('unexpected request'); }));
    assert.equal(calls, 0);
  }
});
test('workflow permission denial remains a failure without a runtime-token fallback', async () => {
  let calls = 0;
  await assert.rejects(releaseCurrentWorkflow({ ...workflowEnv, GITHUB_TOKEN: 'legacy-token' }, async () => { calls++; return new Response('{}', { status: 403 }); }), /HTTP_403/);
  assert.equal(calls, 1);
});

const legacyEnv = { GITHUB_TOKEN: 'expired-token', NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'private-database-key' };
test('an expired legacy copy can use the existing canonical credential', async () => {
  const calls = [];
  const credential = await resolveReleaseCredential(legacyEnv, async (url, init) => {
    calls.push({url,method:init.method});
    if (url.includes('/rpc/')) return Response.json('current-canonical-token');
    return new Response('{}', { status: init.headers.Authorization === 'Bearer expired-token' ? 401 : 200 });
  });
  assert.equal(credential.source, 'canonical-platform');
  assert.equal(calls.filter(c=>c.method==='POST').length, 1);
  assert.ok(calls.every(c=>!c.url.includes('/variables/')&&!c.url.includes('/dispatches')));
});
test('permission denial never triggers a different credential lookup', async () => {
  let calls=0;
  await assert.rejects(resolveReleaseCredential(legacyEnv, async()=>{calls++;return new Response('{}',{status:403});}), /CHECK_HTTP_403/);
  assert.equal(calls,1);
});
test('Google-only authority never falls back to the legacy secret store', async () => {
  let calls=0;
  await assert.rejects(resolveReleaseCredential({...legacyEnv,ELEVATE_RUNTIME_CONFIG_PROVIDER:'google-secret-manager'},async()=>{calls++;return new Response('{}',{status:401});}), /GOOGLE_CREDENTIAL_EXPIRED/);
  assert.equal(calls,1);
});
