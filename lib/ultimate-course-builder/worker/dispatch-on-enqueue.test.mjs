import test from 'node:test';
import assert from 'node:assert/strict';
import {requestCourseDispatch,notifyCourseDispatcher} from './dispatch-on-enqueue.mjs';

test('new queued course requests trusted immediate workflow dispatch',async()=>{
 let calls=0;
 const result=await requestCourseDispatch({env:{COURSE_DISPATCH_GITHUB_TOKEN:'test-token'},request:async(url,opts)=>{
   calls++;
   assert.match(url,/dispatch-google-course-job.yml\/dispatches$/);
   assert.equal(opts.method,'POST');
   assert.equal(opts.headers.Authorization,'Bearer test-token');
   assert.deepEqual(JSON.parse(opts.body),{ref:'main'});
   return {status:204};
 }});
 assert.deepEqual(result,{requested:true});
 assert.equal(calls,1);
});
test('missing credential never fabricates a successful dispatch',async()=>{
 const result=await requestCourseDispatch({env:{},request:async()=>{throw Error('must not call')}});
 assert.deepEqual(result,{requested:false,reason:'token_not_configured'});
});
test('non-204 responses fail closed',async()=>{
 await assert.rejects(requestCourseDispatch({env:{COURSE_DISPATCH_GITHUB_TOKEN:'test'},request:async()=>({status:403})}),/COURSE_DISPATCH_REQUEST_HTTP_403/);
});
test('failed wakeup preserves durable job for scheduled recovery',async()=>{
 const original=console.error;console.error=()=>{};
 try{
 const result=await notifyCourseDispatcher({env:{COURSE_DISPATCH_GITHUB_TOKEN:'test'},request:async()=>{throw Error('timeout')}});
 assert.deepEqual(result,{requested:false,reason:'request_failed'});
 }finally{console.error=original;}
});
