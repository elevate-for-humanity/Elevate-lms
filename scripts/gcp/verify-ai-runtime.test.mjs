import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyOwnedModel, classifyRuntimeErrors } from './verify-ai-runtime.mjs';
const env={ELEVATE_LLM_URL:'https://elevate-model-123.us-central1.run.app',ELEVATE_LLM_SECRET:'private-fixture'};
test('requires the exact approved served model, not credentials alone',async()=>{
  for(const model of ['wrong-model','elevate-local']){
    const result=await verifyOwnedModel(env,{request:async()=>new Response(JSON.stringify({data:[{id:model}]}))});
    assert.equal(result.verified,model==='elevate-local');
    assert.ok(!JSON.stringify(result).includes(env.ELEVATE_LLM_SECRET));
  }
});
test('never sends the owned credential to legacy hosts or redirects',async()=>{
  let calls=0;
  const result=await verifyOwnedModel({...env,ELEVATE_LLM_URL:'https://retired.code.run'},{request:async()=>{calls++}});
  assert.equal(calls,0);assert.equal(result.status,'google_endpoint_required');
  const redirected=await verifyOwnedModel(env,{request:async(_url,opts)=>{assert.equal(opts.redirect,'manual');return new Response(null,{status:302,headers:{location:'https://elsewhere.test'}})}});
  assert.equal(redirected.verified,false);
});
test('runtime diagnostics contain categories instead of secret-bearing application text',()=>{
  const result=classifyRuntimeErrors([{textPayload:'Kokoro request failed with password=private-fixture',timestamp:'2026-10-08T18:00:00Z'}]);
  assert.equal(result[0].category,'owned_narration_runtime');assert.ok(!JSON.stringify(result).includes('private-fixture'));
});
