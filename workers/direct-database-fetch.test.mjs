import test from 'node:test';import assert from 'node:assert/strict';
import {createDirectDatabaseFetch} from './direct-database-fetch.mjs';
test('database and storage calls have bounded deadlines without replaying writes',async()=>{
 const budgets=[],calls=[];
 const request=createDirectDatabaseFetch({timeout:ms=>{budgets.push(ms);return new AbortController().signal;},progress:()=>undefined,request:async(input,init)=>{calls.push({input,init});return new Response('ok');}});
 await request('https://project.supabase.co/rest/v1/course_lessons',{method:'PATCH',body:'same body'});
 await request('https://project.supabase.co/storage/v1/object/bucket/file');
 assert.deepEqual(budgets,[30000,120000]);assert.equal(calls.length,2);
 assert.equal(calls[0].init.body,'same body');assert.ok(calls.every(c=>c.init.signal instanceof AbortSignal));
});
test('a stalled write stops once and a progress cancellation keeps its original cause',async()=>{
 const deadline=new AbortController();deadline.abort();let calls=0;
 const request=createDirectDatabaseFetch({timeout:()=>deadline.signal,progress:()=>undefined,request:async()=>{calls++;throw new DOMException('timeout','TimeoutError');}});
 await assert.rejects(request('https://project.supabase.co/rest/v1/course_lessons',{method:'PATCH'}),/DIRECT_DATABASE_HTTP_TIMEOUT/);assert.equal(calls,1);
 const progress=new AbortController();progress.abort(Error('ULTIMATE_PROGRESS_STALLED:photo'));
 const cancelled=createDirectDatabaseFetch({timeout:()=>deadline.signal,progress:()=>progress.signal,request:async()=>{throw Error('aborted');}});
 await assert.rejects(cancelled('https://project.supabase.co/storage/v1/object/bucket/file'),/ULTIMATE_PROGRESS_STALLED/);
});
