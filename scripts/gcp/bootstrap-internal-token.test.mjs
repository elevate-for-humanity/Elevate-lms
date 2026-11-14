import test from 'node:test';
import assert from 'node:assert/strict';
import {planTokenBootstrap, bootstrap} from './bootstrap-internal-token.mjs';

test('dry-run makes no external calls', () => {
  const plan=planTokenBootstrap({component:'admin',key:'STUDIO_BROWSER_SECRET'});
  assert.equal(plan.apply,false);
  assert.deepEqual(bootstrap(plan),{...plan,status:'dry-run',changed:false});
});
test('approved service-specific internal keys only',()=>{
  assert.throws(()=>planTokenBootstrap({component:'store',key:'STUDIO_BROWSER_SECRET'}));
  assert.throws(()=>planTokenBootstrap({component:'admin',key:'PAYPAL_CLIENT_SECRET'}));
  assert.throws(()=>planTokenBootstrap({component:'admin',key:'TWILIO_AUTH_TOKEN'}));
  assert.throws(()=>planTokenBootstrap({component:'admin',key:'ELEVATE_LLM_CPU_URL'}));
  assert.throws(()=>planTokenBootstrap({component:'none',key:'CRON_SECRET'}));
});
test('secret resource names are predictable without leaking token',()=>{
  const p=planTokenBootstrap({component:'admin',key:'CRON_SECRET'});
  assert.equal(p.secretName,'elevate-admin-cron-secret');
});
