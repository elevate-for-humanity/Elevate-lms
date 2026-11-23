import test from 'node:test';
import assert from 'node:assert/strict';
import {smokeProbe} from './smoke-probe.mjs';
import {fetchSmoke} from './smoke-fetch.mjs';
const url='http://127.0.0.1:4000/api/ready';
const sleep=async()=>{};
test('recovers from transient local-container HTTP stall without accepting a wrong SHA', async()=>{
 let calls=0;
 const got=await smokeProbe(url,{headers:{host:'customer.example'}},10000,'json',{pause:sleep,request:async()=>{
  calls++;
  if(calls===1){ const error=new Error('Smoke HTTP response timed out after 10000 ms'); error.headersReceived=false; throw error; }
  return {status:200,body:{commit:'a'.repeat(40)}};
 }});
 assert.equal(calls,2);
 assert.equal(got.body.commit,'a'.repeat(40));
});
test('fails closed after three transport stalls',async()=>{
 let calls=0;
 await assert.rejects(smokeProbe(url,{},10000,'json',{pause:sleep,request:async()=>{
  calls++;
  { const error=new Error('Smoke HTTP response timed out after 10000 ms'); error.headersReceived=false; throw error; }
 }}),/attempt 3\/3: local_transport_timeout/);
 assert.equal(calls,3);
});
test('retries a path-specific timeout before response headers', async () => {
  let calls = 0;
  const actualFetch = async () => {
    calls++;
    if (calls === 1) return new Promise(() => {});
    return new Response('{"ready":true}');
  };
  const result = await smokeProbe(url, {}, 20, 'json', {
    request: (u, options, timeout, type) => fetchSmoke(u, options, timeout, type, actualFetch),
    pause: sleep,
  });
  assert.equal(calls, 2);
  assert.deepEqual(result, { status: 200, body: { ready: true } });
});
test('does not retry application HTTP failures or invalid response bodies',async()=>{
 let calls=0;
 const status=await smokeProbe(url,{},10000,'json',{pause:sleep,request:async()=>{calls++;return {status:503,body:{ready:false}};}});
 assert.equal(status.status,503);
 assert.equal(calls,1);
 await assert.rejects(smokeProbe(url,{},10000,'json',{pause:sleep,request:async()=>{throw new Error('Unexpected token in JSON');}}),/response_unreadable/);
});
test('rejects non-loopback probes and invalid budgets',async()=>{
 await assert.rejects(smokeProbe('https://www.elevateforhumanity.org/api/ready'),/local container/);
 await assert.rejects(smokeProbe(url,{},10000,'json',{attempts:10}),/retry budget/);
});

test('failed response headers cannot be hidden by a later successful retry', async()=>{
 let attempts=0;
 const actualFetch=async()=>{
  attempts++;
  return new Response(JSON.stringify({service:'marketing',ready:false}),{status:503,headers:{'content-type':'application/json'}});
 };
 const got=await smokeProbe(url,{},30,'json',{
  request:(u,o,t,r)=>fetchSmoke(u,o,t,r,actualFetch),
  pause:sleep,
 });
 assert.equal(attempts,1);
 assert.equal(got.status,503);
});

test('200 headers followed by a stalled body never get retried', async()=>{
 let attempts=0;
 const actualFetch=async()=>{
  attempts++;
  return {ok:true,status:200,json:()=>new Promise(()=>{})};
 };
 await assert.rejects(smokeProbe(url,{},20,'json',{
  request:(u,o,t,r)=>fetchSmoke(u,o,t,r,actualFetch),pause:sleep,
 }),/http_200_post_header_body_unreadable/);
 assert.equal(attempts,1);
});

test('HTTP 500 response headers with an unreadable body cannot be retried', async()=>{
 let attempts=0;
 const actualFetch=async()=>{
  attempts++;
  return {status:500,ok:false,json:async()=>new Promise(()=>{})};
 };
 await assert.rejects(smokeProbe(url,{},20,'json',{
  request:(u,o,t,r)=>fetchSmoke(u,o,t,r,actualFetch),pause:sleep,
 }),/http_500_post_header_body_unreadable/);
 assert.equal(attempts,1);
});
