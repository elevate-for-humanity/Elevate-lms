import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPhoneExercise, dispatchPhoneBindings } from './phone-runtime-handoff.mjs';

const repository = 'elevate-for-humanity/Elevate-lms';
const env = { GITHUB_REPOSITORY: repository, PHONE_EXERCISE_RUN_ID: '123', GH_TOKEN: 'test-only-token' };
function fixture(overrides = {}, jobsOverride) {
  const calls = [];
  const source = {
    repository: { full_name: repository }, head_branch: 'main', event: 'workflow_dispatch',
    path: '.github/workflows/exercise-owned-pbx-device.yml', head_sha: 'a'.repeat(40),
    updated_at: new Date().toISOString(), status: 'completed', conclusion: 'success', ...overrides,
  };
  const jobs = jobsOverride || [{ name:'exercise',run_id:123,status:'completed',conclusion:'success',steps:[{
    name:'Create and revoke one temporary device for the approved operator',status:'completed',conclusion:'success',
  }] }];
  const request = async (url, options) => {
    calls.push({ url, options });
    return { ok:true,status:options.method==='POST'?204:200,json:async () => url.includes('/jobs?')?{jobs}:source };
  };
  return { source, jobs, calls, request };
}

test('dispatch carries real operator exercise evidence to the one binding workflow', async () => {
  const f = fixture({status:'in_progress',conclusion:null});
  const result = await dispatchPhoneBindings(env,f.request);
  assert.equal(result.bindingsVerified,false);
  assert.equal(result.carrierRoutingChanged,false);
  const post = f.calls.find(c=>c.options.method==='POST');
  assert.ok(post.url.endsWith('/actions/workflows/bind-owned-phone-runtime.yml/dispatches'));
  assert.deepEqual(JSON.parse(post.options.body),{ref:'main',inputs:{acceptance_run_id:'123'}});
});
test('receiver waits for the entire source workflow to finish before binding', async () => {
  const f = fixture({status:'in_progress',conclusion:null});
  let waits = 0;
  const result = await verifyPhoneExercise(env,f.request,{delay:async()=>{waits++;f.source.status='completed';f.source.conclusion='success';}});
  assert.equal(waits,1);
  assert.equal(result.sourceCompleted,true);
});
test('missing identity cannot make any request', async () => {
  const f = fixture();
  await assert.rejects(verifyPhoneExercise({...env,GH_TOKEN:''},f.request),/IDENTITY_REQUIRED/);
  assert.equal(f.calls.length,0);
});
for (const [label,override] of [
  ['wrong repository',{repository:{full_name:'someone/else'}}],
  ['wrong branch',{head_branch:'repair'}],
  ['push dispatcher',{event:'push'}],
  ['unrelated workflow',{path:'.github/workflows/deploy-admin.yml'}],
  ['stale evidence',{updated_at:'2020-01-01T00:00:00Z'}],
]) test('rejects '+label+' before dispatch',async()=>{
  const f=fixture(override);
  await assert.rejects(dispatchPhoneBindings(env,f.request),/SOURCE_UNVERIFIED/);
  assert.equal(f.calls.some(c=>c.options.method==='POST'),false);
});
test('failed and cancelled sources cannot be accepted',async()=>{
  for(const conclusion of ['failure','cancelled','skipped']) {
    const f=fixture({conclusion});
    await assert.rejects(verifyPhoneExercise(env,f.request),/EXERCISE_NOT_SUCCESSFUL/);
  }
});
test('a green dispatcher or skipped temporary-device step is not live acceptance',async()=>{
  for(const jobs of [
    [{name:'dispatch',run_id:123,status:'completed',conclusion:'success'}],
    [{name:'exercise',run_id:123,status:'completed',conclusion:'success',steps:[{name:'Create and revoke one temporary device for the approved operator',status:'completed',conclusion:'skipped'}]}],
  ]) {
    const f=fixture({},jobs);
    await assert.rejects(dispatchPhoneBindings(env,f.request),/EXERCISE_NOT_SUCCESSFUL/);
    assert.equal(f.calls.some(c=>c.options.method==='POST'),false);
  }
});
test('completion wait is bounded and never applies a binding itself',async()=>{
  const f=fixture({status:'in_progress',conclusion:null});
  await assert.rejects(verifyPhoneExercise(env,f.request,{attempts:2,delay:async()=>{}}),/COMPLETION_TIMEOUT/);
  assert.equal(f.calls.length,2);
  assert.equal(f.calls.some(c=>c.options.method==='POST'),false);
});
test('provider errors are not bypassed or retried as successful requests',async()=>{
  await assert.rejects(dispatchPhoneBindings(env,async()=>({ok:false,status:403})),/GITHUB_HTTP_403/);
});
