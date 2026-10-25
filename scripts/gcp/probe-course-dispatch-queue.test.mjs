import test from 'node:test';
import assert from 'node:assert/strict';
import {probeCourseDispatchQueue} from './probe-course-dispatch-queue.mjs';
const env={SUPABASE_SERVICE_ROLE_KEY:'test-fixture'};
test('probe reads both projection and filtered queue without launching or claiming',async()=>{
 const calls=[];
 const result=await probeCourseDispatchQueue({env,request:async(url,options)=>{
  calls.push(new URL(url));
  assert.equal(options.method,undefined);
  assert.match(url.searchParams.get('select'),/owner_paused:profile->>ownerPaused/);
  return {ok:true,json:async()=>[{id:'job',build:{owner_paused:url.searchParams.has('build.or')?null:'true'}}]};
 }});
 assert.equal(calls.length,2);
 assert.equal(calls[0].searchParams.has('or'),false);
 assert.equal(calls[0].searchParams.has('build.or'),false);
 assert.ok(calls[1].searchParams.has('build.or'));
 assert.equal(result.readOnly,true);assert.equal(result.eligibleRows,1);
});
test('probe rejects invalid parent shapes and cannot accept empty sample evidence',async()=>{
 for(const rows of [[],[{build:null}],[{build:[]}],[{build:{}}]])
  await assert.rejects(probeCourseDispatchQueue({env,request:async()=>({ok:true,json:async()=>rows})}),/PROJECTION/);
});
test('probe rejects a paused row leaking through the filtered queue',async()=>{
 await assert.rejects(probeCourseDispatchQueue({env,request:async()=>({ok:true,json:async()=>[{build:{owner_paused:'true'}}]})}),/PAUSED_FILTER_FAILED/);
});
test('probe reports an HTTP failure without exposing response bodies or credentials',async()=>{
 await assert.rejects(probeCourseDispatchQueue({env,request:async()=>({ok:false,status:400,json:async()=>{throw Error('must not read body');}})}),/COURSE_QUEUE_PROJECTION_HTTP_400/);
});
