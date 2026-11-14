import test from 'node:test';
import assert from 'node:assert/strict';
import {createLeaseDeadline,createWorkerSupabaseFetch} from '../lib/ultimate-course-builder/worker/runtime-guards.mjs';
const url='https://example.supabase.co/rest/v1/rpc/';
test('heartbeat TLS resets retry within bounded requests without replaying claims',async()=>{
 let calls=0;
 const request=async()=>{if(++calls<3)throw new TypeError('fetch failed: ECONNRESET');return new Response('true');};
 const fetch=createWorkerSupabaseFetch({request,delay:async()=>{}});
 assert.equal(await (await fetch(url+'heartbeat_ultimate_build_job',{method:'POST',body:'{}'})).json(),true);
 assert.equal(calls,3);calls=0;
 await assert.rejects(fetch(url+'claim_ultimate_build_job',{method:'POST',body:'{}'}),/ECONNRESET/);
 assert.equal(calls,1);
});
test('ordinary writes, permission failures and caller cancellation are not replayed',async()=>{
 let calls=0;
 const fetch=createWorkerSupabaseFetch({request:async()=>{calls++;return new Response('{}',{status:403});},delay:async()=>{}});
 assert.equal((await fetch(url+'heartbeat_ultimate_build_job',{method:'POST'})).status,403);assert.equal(calls,1);
 calls=0;const control=new AbortController();control.abort();
 const cancelled=createWorkerSupabaseFetch({request:async()=>{calls++;throw control.signal.reason;},delay:async()=>{}});
 await assert.rejects(cancelled(url+'heartbeat_ultimate_build_job',{method:'POST',signal:control.signal}));assert.equal(calls,1);
});
test('a stalled heartbeat is aborted and a later bounded attempt can renew',async()=>{
 let calls=0;
 const fetch=createWorkerSupabaseFetch({timeoutMs:5,delay:async()=>{},request:async(_input,init)=>{
  if(++calls===1)return new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(init.signal.reason),{once:true}));
  return new Response('true');
 }});
 assert.equal(await (await fetch(url+'heartbeat_ultimate_build_job',{method:'POST'})).json(),true);assert.equal(calls,2);
});
test('lease expiry terminates a hanging media task and rejects stale work',async()=>{
 let clock=0,callback,lost=0;
 const deadline=createLeaseDeadline('job',{leaseMs:100,now:()=>clock,schedule:fn=>{callback=fn;return 1;},cancel:()=>{},onLost:()=>lost++});
 const work=deadline.race(new Promise(()=>{}));clock=100;callback();
 await assert.rejects(work,/ULTIMATE_JOB_LEASE_LOST/);assert.equal(lost,1);
 assert.equal(deadline.renew(),false);assert.throws(()=>deadline.assertActive(),/LEASE_LOST/);
});
test('acknowledged heartbeats rearm the deadline while failed requests cannot extend it',async()=>{
 let clock=0,callback,delay;
 const deadline=createLeaseDeadline('job',{leaseMs:100,now:()=>clock,schedule:(fn,ms)=>{callback=fn;delay=ms;return 1;},cancel:()=>{}});
 clock=70;assert.equal(deadline.renew(),true);assert.equal(delay,100);
 clock=110;deadline.assertActive();
 clock=170;callback();assert.throws(()=>deadline.assertActive(),/LEASE_LOST/);
 deadline.dispose();
});
