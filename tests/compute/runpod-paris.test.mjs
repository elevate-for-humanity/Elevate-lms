import test from 'node:test';
import assert from 'node:assert/strict';
import {probeOwnedModel} from '../../lib/ai/providers/owned-model-health.mjs';
import {ownedModelHeaders} from '../../lib/ai/providers/google-runtime-auth.mjs';
import {converse} from '../../infra/pbx/paris/turn-adapter.mjs';
const base='https://pilot-8080.proxy.runpod.net';
const env={PARIS_GPU_ENABLED:'true',PARIS_INFERENCE_TIER:'gpu',ELEVATE_LLM_GPU_URL:base,ELEVATE_LLM_GPU_SECRET:'test-token',ELEVATE_LLM_GOOGLE_IAM:'true',ELEVATE_LLM_GPU_GOOGLE_IAM:'false'};
test('GPU probe accepts authenticated Runpod model readback without Google metadata',async()=>{
 let calls=0;
 const result=await probeOwnedModel({env,request:async(url,options)=>{calls++;assert.equal(url,base+'/v1/models');assert.equal(options.headers.Authorization,'Bearer test-token');assert.equal(options.headers['X-Serverless-Authorization'],undefined);return Response.json({data:[{id:'elevate-local'}]});}});
 assert.equal(result.verified,true);assert.equal(calls,1);
});
test('CPU Google IAM remains required when GPU override is configured but not selected',async()=>{
 await assert.rejects(ownedModelHeaders('https://invalid.example','token',{env:{...env,PARIS_GPU_ENABLED:'false'}}),/IDENTITY_UNAVAILABLE/);
});
test('GPU health rejects hostname lookalikes without sending credentials',async()=>{
 const result=await probeOwnedModel({env:{...env,ELEVATE_LLM_GPU_URL:base+'.attacker.example'},request:async()=>assert.fail('must not send')});assert.equal(result.verified,false);
});
test('telephone owned inference maps conversation roles and preserves bounded replies',async()=>{
 let calls=0;
 const answer=await converse([{role:'user',text:'Hello'},{role:'model',text:'Welcome'}],async()=>assert.fail('must not call Vertex'),{env:{PARIS_PHONE_INFERENCE_PROVIDER:'owned',PARIS_PHONE_LLM_URL:base,PARIS_PHONE_LLM_SECRET:'phone-token'},request:async(url,options)=>{
 calls++;assert.equal(url,base+'/v1/chat/completions');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer phone-token');const body=JSON.parse(options.body);assert.equal(body.model,'elevate-local');assert.equal(body.max_tokens,240);assert.equal(body.messages[0].role,'system');assert.equal(body.messages[2].role,'assistant');return Response.json({choices:[{message:{content:'Hello from PARIS'}}]});
 }});assert.equal(answer,'Hello from PARIS');assert.equal(calls,1);
});
test('telephone owned inference refuses invalid endpoint and never falls back on failure',async()=>{
 for(const url of ['http://pilot-8080.proxy.runpod.net',base+'.evil.example',base+'?token=x'])await assert.rejects(converse([],async()=>assert.fail('no fallback'),{env:{PARIS_PHONE_INFERENCE_PROVIDER:'owned',PARIS_PHONE_LLM_URL:url,PARIS_PHONE_LLM_SECRET:'token'},request:async()=>assert.fail('no request')}),/ENDPOINT/);
 await assert.rejects(converse([],async()=>assert.fail('no fallback'),{env:{PARIS_PHONE_INFERENCE_PROVIDER:'owned',PARIS_PHONE_LLM_URL:base,PARIS_PHONE_LLM_SECRET:'token'},request:async()=>new Response(null,{status:503})}),/503/);
});
test('default telephone routing stays on the existing Google conversation contract',async()=>{
 let calls=0;
 const answer=await converse([{role:'user',text:'Hello'}],async(url,body)=>{calls++;assert.match(url,/aiplatform\.googleapis\.com/);assert.equal(body.contents[0].role,'user');return {candidates:[{content:{parts:[{text:'Welcome'}]}}]};},{env:{},request:async()=>assert.fail('no owned request')});
 assert.equal(answer,'Welcome');assert.equal(calls,1);
});
test('an unauthorized or wrong-model GPU response is not readiness',async()=>{
 for(const response of [new Response(null,{status:401}),Response.json({data:[{id:'different-model'}]})]){
 const result=await probeOwnedModel({env,request:async()=>response});assert.equal(result.verified,false);
 }
});
