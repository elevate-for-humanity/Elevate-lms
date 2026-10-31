import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyOwnedModel, classifyRuntimeErrors, isReadyStudioCloudRun, inspectModelServicePermissions, consumerModelBindings } from './verify-ai-runtime.mjs';
const env={ELEVATE_LLM_URL:'https://elevate-model-123.us-central1.run.app',ELEVATE_LLM_SECRET:'private-fixture'};
const studio={metadata:{name:'elevate-studio-browser'},status:{url:'https://elevate-studio-browser-aabnh2y32a-uc.a.run.app',conditions:[{type:'Ready',status:'True'}]}};
test('consumer readback detects inline and Secret Manager bindings without exposing either value',()=>{
 const result=consumerModelBindings({spec:{template:{spec:{containers:[{env:[
  {name:'ELEVATE_LLM_CPU_URL',value:'https://private-endpoint.run.app'},
  {name:'ELEVATE_LLM_CPU_SECRET',valueFrom:{secretKeyRef:{name:'private-model-key',key:'latest'}}},
  {name:'ELEVATE_LLM_GOOGLE_IAM',value:'true'},
 ]}]}}}});
 assert.equal(result.cpuEndpointPresent,true);assert.equal(result.cpuTokenPresent,true);assert.equal(result.privateGoogleInvocation,true);
 assert.ok(!JSON.stringify(result).includes('private-'));
 assert.deepEqual(consumerModelBindings(undefined),{endpointPresent:false,cpuEndpointPresent:false,applicationTokenPresent:false,cpuTokenPresent:false,privateGoogleInvocation:false});
});
test('recognizes the ready canonical Cloud Run Studio without requiring a VM',()=>{
  assert.equal(isReadyStudioCloudRun(studio),true);
});
test('an unready or unrelated Cloud Run service cannot certify Studio',()=>{
  assert.equal(isReadyStudioCloudRun({...studio,status:{...studio.status,conditions:[{type:'Ready',status:'False'}]}}),false);
  assert.equal(isReadyStudioCloudRun({...studio,metadata:{name:'other-service'}}),false);
});
test('untrusted or malformed Studio delivery URLs cannot certify the Google runtime',()=>{
  for(const url of ['http://studio.run.app','https://studio.run.app.example.com','https://user:secret@studio.run.app','invalid'])
    assert.equal(isReadyStudioCloudRun({...studio,status:{...studio.status,url}}),false);
});
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

test('prefers the authoritative CPU endpoint over a stale legacy endpoint', async () => {
  const result = await verifyOwnedModel({...env,ELEVATE_LLM_URL:'https://retired.code.run',ELEVATE_LLM_CPU_URL:'https://elevate-owned-cpu-llm-123.run.app'}, {
    request: async (url) => { assert.equal(url, 'https://elevate-owned-cpu-llm-123.run.app/v1/models'); return Response.json({data:[{id:'elevate-local'}]}); }
  });
  assert.equal(result.verified, true);
});
test('uses the private Google invocation adapter for model health', async () => {
  const {probeOwnedModel} = await import('../../lib/ai/providers/owned-model-health.mjs');
  let calls = 0;
  const result = await probeOwnedModel({env:{...env,ELEVATE_LLM_GOOGLE_IAM:'true'},
    headersFor: async (_base, token, {env: config}) => { assert.equal(config.ELEVATE_LLM_GOOGLE_IAM,'true'); return {Authorization:'Bearer '+token,'X-Serverless-Authorization':'Bearer private-identity'}; },
    request: async (_url, options) => { calls++; assert.equal(options.headers['X-Serverless-Authorization'],'Bearer private-identity'); return Response.json({data:[{id:'elevate-local'}]}); }
  });
  assert.equal(result.verified,true); assert.equal(calls,1);
  assert.ok(!JSON.stringify(result).includes('private-identity'));
});

test('model startup diagnostics retain categories without printing model keys or arbitrary logs',()=>{
 const entries=['MODEL_BOUNDED_EIGHT_GIB_MEMORY_REQUIRED','MODEL_CHECKSUM_FAILED','MODEL_AUTHENTICATION_CONFIGURATION_REQUIRED'].map(code=>({textPayload:code+' private-value'}));
 const result=classifyRuntimeErrors(entries);
 assert.deepEqual(result.map(x=>x.category),['model_memory_boundary','model_checksum','model_authentication_configuration']);
 assert.ok(!JSON.stringify(result).includes('private-value'));
});

test('checks only service-scoped permissions and never includes the access credential in diagnostics',async()=>{
 const result=await inspectModelServicePermissions('fixture-access',{request:async(url,options)=>{
   assert.equal(url,'https://run.googleapis.com/v2/projects/elegant-racer-299721/locations/us-east1/services/elevate-owned-cpu-llm:testIamPermissions');
   assert.deepEqual(JSON.parse(options.body),{permissions:['run.services.setIamPolicy','run.routes.invoke']});
   return Response.json({permissions:[]});
 }});
 assert.deepEqual(result,{verified:true,canManageInvocation:false,canInvoke:false,httpStatus:200});
 assert.ok(!JSON.stringify(result).includes('fixture-access'));
});
