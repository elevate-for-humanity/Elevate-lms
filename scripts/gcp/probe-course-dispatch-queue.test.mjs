import test from 'node:test';
import assert from 'node:assert/strict';
import {probeCourseDispatchQueue} from './probe-course-dispatch-queue.mjs';
const env={SUPABASE_SERVICE_ROLE_KEY:'test-fixture'};
test('probe reads both projection and filtered queue without launching or claiming',async()=>{
 const calls=[];
 const result=await probeCourseDispatchQueue({env,request:async(url,options)=>{
  calls.push(new URL(url));
  assert.equal(options.method,undefined);
  const select=url.searchParams.get('select');
  if(!select.includes('owner_paused:profile->>ownerPaused')){
   // The dispatcher's pool-blocked diagnostic projects pools instead of the
   // owner-pause projection; serve its real row shape. The probe's sample
   // shape check rejects it and the dispatcher swallows that diagnostic
   // failure by design, so this is the last call the probe makes.
   assert.match(select,/active_pools:ultimate_autopilot_pools/);
   return {ok:true,json:async()=>[{id:'job',build_id:'build',build:{active_pools:{id:'pool',state:'active',created_at:'2026-01-01T00:00:00.000Z'}}}]};
  }
  return {ok:true,json:async()=>[{id:'job',build:{owner_paused:url.searchParams.has('build.profile->>ownerPaused')?'false':'true',active_pools:null}}]};
 }});
 assert.equal(calls.length,3);
 assert.equal(calls[0].searchParams.has('or'),false);
 assert.equal(calls[0].searchParams.has('build.profile->>ownerPaused'),false);
 assert.equal(calls[1].searchParams.get('build.profile->>ownerPaused'),'eq.false');
 assert.equal(calls[2].searchParams.get('limit'),'1');
 assert.equal(calls[2].searchParams.get('status'),'in.(queued,running)');
 assert.equal(result.readOnly,true);assert.equal(result.eligibleRows,1);
});
test('probe rejects invalid parent shapes and cannot accept empty sample evidence',async()=>{
 for(const rows of [[],[{build:null}],[{build:[]}],[{build:{}}]])
  await assert.rejects(probeCourseDispatchQueue({env,request:async()=>({ok:true,json:async()=>rows})}),/PROJECTION/);
});
test('probe rejects a paused row leaking through the filtered queue',async()=>{
 await assert.rejects(probeCourseDispatchQueue({env,request:async()=>({ok:true,json:async()=>[{build:{owner_paused:'true'}}]})}),/PAUSED_FILTER_FAILED/);
});
test('probe rejects unknown owner authorization in filtered rows',async()=>{
 await assert.rejects(probeCourseDispatchQueue({env,request:async()=>({ok:true,json:async()=>[{build:{owner_paused:null}}]})}),/PAUSED_FILTER_FAILED/);
});
test('probe reports an HTTP failure without exposing response bodies or credentials',async()=>{
 await assert.rejects(probeCourseDispatchQueue({env,request:async()=>({ok:false,status:400,json:async()=>{throw Error('must not read body');}})}),/COURSE_QUEUE_PROJECTION_HTTP_400/);
});

test('probe retries bounded transient timeouts and still validates both projections',async()=>{
 let requests=0;const waits=[];
 const result=await probeCourseDispatchQueue({env,wait:async ms=>{waits.push(ms);},request:async()=>{
  requests++;
  if(requests===1)throw Object.assign(new Error('network timeout'),{name:'TimeoutError'});
  return {ok:true,json:async()=>[{build:{owner_paused:requests===2?'true':'false',active_pools:null}}]};
 }});
 assert.equal(requests,5);assert.deepEqual(waits,[500]);
 assert.equal(result.projectionVerified,true);assert.equal(result.pausedFilterVerified,true);
});
test('probe never turns persistent timeouts into a passing gate',async()=>{
 let requests=0;const waits=[];
 await assert.rejects(probeCourseDispatchQueue({env,wait:async ms=>{waits.push(ms);},request:async()=>{
  requests++;
  throw Object.assign(new Error('network timeout'),{name:'TimeoutError'});
 }}),/COURSE_QUEUE_PROJECTION_TIMEOUT/);
 assert.equal(requests,3);assert.deepEqual(waits,[500,1000]);
});

for(const active_pools of [{id:'pool'},undefined,[]])test('probe requires a null one-to-one pool after the anti-join: '+JSON.stringify(active_pools),async()=>{
 await assert.rejects(probeCourseDispatchQueue({env,request:async()=>({ok:true,json:async()=>[
  {build:{owner_paused:'false',active_pools}}
 ]})}),/ACTIVE_POOL_FILTER_FAILED/);
});
