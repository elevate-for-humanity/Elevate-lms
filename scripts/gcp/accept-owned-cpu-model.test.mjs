import test from 'node:test';import assert from 'node:assert/strict';
import {acceptOwnedCpuModel} from './accept-owned-cpu-model.mjs';
const token='test-token-that-is-long-enough-for-authentication';
function fixture({auth=401,answer='4',toolName='add_numbers',complete=true}={}) {
 const calls=[];
 const request=async(url,options)=>{
  calls.push({url:String(url),options});
  if(!options.headers.Authorization)return Response.json({error:'unauthorized'},{status:auth});
  if(url.pathname==='/v1/models')return Response.json({data:[{id:'elevate-local'}]});
  const body=JSON.parse(options.body);
  if(body.stream)return new Response('data: '+JSON.stringify({choices:[{delta:{content:'Hello'}}]})+'\n\n'+(complete?'data: [DONE]\n\n':''),{headers:{'Content-Type':'text/event-stream'}});
  if(body.tools)return Response.json({choices:[{message:{tool_calls:[{function:{name:toolName,arguments:'{"a":2,"b":2}'}}]}}]});
  return Response.json({choices:[{message:{content:answer}}]});
 };return {request,calls};
}
test('requires authentication, actual answer, structured tool call and completed stream',async()=>{
 const f=fixture();const r=await acceptOwnedCpuModel({base:'http://127.0.0.1:8080',token,loopback:true,...f});assert.equal(r.passed,true);assert.equal(r.productionActivated,false);assert.equal(f.calls.length,5);
});
test('a health response alone or malformed capabilities cannot pass',async()=>{
 for(const options of [{auth:200},{answer:'5'},{toolName:'other'},{complete:false}])await assert.rejects(acceptOwnedCpuModel({base:'http://127.0.0.1:8080',token,loopback:true,...fixture(options)}),/OWNED_CPU_MODEL_/);
});
test('loopback requires explicit test mode and foreign origins receive no credentials',async()=>{
 for(const base of ['http://127.0.0.1:8080','https://example.com','https://user:pass@elevate-owned-cpu-llm-test.a.run.app','https://elevate-owned-cpu-llm-test.a.run.app/?secret=x']){
  let called=false;await assert.rejects(acceptOwnedCpuModel({base,token,request:async()=>{called=true;}}),/ORIGIN_NOT_AUTHORIZED/);assert.equal(called,false);
 }
});
