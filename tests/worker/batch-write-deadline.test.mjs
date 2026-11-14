import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkerSupabaseFetch} from '../../lib/ultimate-course-builder/worker/runtime-guards.mjs';
const url='https://example.supabase.co/rest/v1/rpc/ultimate_fenced_write';
test('slow fenced write gets its own deadline and is performed once',async()=>{
 let calls=0;
 const request=async(_input,{signal})=>{calls++;await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,40);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason);},{once:true});});return new Response('{}');};
 const fetch=createWorkerSupabaseFetch({request,timeoutMs:10,writeTimeoutMs:200});
 assert.equal((await fetch(url,{method:'POST'})).status,200);
 assert.equal(calls,1);
});
test('failed fenced write is never blindly replayed',async()=>{
 let calls=0;
 const fetch=createWorkerSupabaseFetch({request:async()=>{calls++;throw new Error('unknown committed outcome');},delay:async()=>{}});
 await assert.rejects(fetch(url,{method:'POST'}),/unknown committed outcome/);
 assert.equal(calls,1);
});
test('external cancellation still stops a write',async()=>{
 const controller=new AbortController();controller.abort();
 const fetch=createWorkerSupabaseFetch({request:async(_input,{signal})=>{signal.throwIfAborted();}});
 await assert.rejects(fetch(url,{method:'POST',signal:controller.signal}),/abort/i);
});
