import test from 'node:test';
import assert from 'node:assert/strict';
import {modelCredential,deploymentArguments,acceptOwnedModel} from './deploy-owned-llm.mjs';

test('preserve one verified existing model token and reject conflicting archives',()=>{
  const token='a'.repeat(32);
  assert.equal(modelCredential({runtimeEnvironment:{ELEVATE_LLM_SECRET:token}}),token);
  assert.throws(()=>modelCredential({runtimeEnvironment:{ELEVATE_LLM_SECRET:token},sourceSecretGroupArchive:{groups:[{project:'elevate-media-gpu',sourceGroup:'elevate-llm-worker-env',secrets:{variables:{LLM_WORKER_SECRET:'b'.repeat(32)}}}]}}),/unverified/);
  assert.throws(()=>modelCredential({runtimeEnvironment:{}}),/unverified/);
});
test('GPU capacity is bounded and credentials use a scoped secret reference',()=>{
  const args=deploymentArguments('sha256:'+'a'.repeat(64));
  assert.equal(args[args.indexOf('--min-instances')+1],'0');
  assert.equal(args[args.indexOf('--max-instances')+1],'1');
  assert.equal(args[args.indexOf('--gpu')+1],'1');
  assert.equal(args[args.indexOf('--set-secrets')+1],'LLM_WORKER_SECRET=elevate-owned-llm-token:latest');
  assert.throws(()=>deploymentArguments('latest'),/immutable/);
});
test('a catalog response cannot substitute for inference and tool verification',async()=>{
  let calls=0;
  await assert.rejects(acceptOwnedModel('https://owned.run.app','secret',{request:async()=>{
    calls++;
    return Response.json(calls===2?{data:[{id:'elevate-local'}]}:{},{status:calls===1?401:200});
  }}),/inference_unverified/);
  assert.equal(calls,3);
});
test('anonymous access and redirects fail acceptance before routing clients',async()=>{
  await assert.rejects(acceptOwnedModel('https://owned.run.app','secret',{request:async()=>Response.json({},{status:200})}),/authentication_not_enforced/);
  let called=false;
  await assert.rejects(acceptOwnedModel('https://old.code.run','secret',{request:async()=>{called=true;}}),/google_model_endpoint/);
  assert.equal(called,false);
});
test('real response contract includes streamed deltas, terminal marker and tools',async()=>{
  let call=0;
  const result=await acceptOwnedModel('https://owned.run.app','secret',{request:async()=>{
    call++;
    if(call===1)return Response.json({},{status:401});
    if(call===2)return Response.json({data:[{id:'elevate-local'}]});
    if(call===3)return Response.json({choices:[{message:{content:'4'}}]});
    if(call===4)return Response.json({choices:[{message:{tool_calls:[{function:{name:'add_numbers',arguments:'{"a":2,"b":2}'}}]}}]});
    return new Response('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
  }});
  assert.equal(result.streamingVerified,true);
  assert.equal(result.toolCallsVerified,true);
  assert.equal(call,5);
});
