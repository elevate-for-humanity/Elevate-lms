import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { retryCourseMediaTransfer, transientCourseMediaError } from './course-media-transfer-retry.mjs';
test('a failed streaming upload recreates its body and transfers all original bytes', async () => {
 const streams=[], waits=[], bytes=Buffer.from('complete verified video fixture');
 const result=await retryCourseMediaTransfer(async attempt=>{
  const body=Readable.from([bytes.subarray(0,5),bytes.subarray(5)]);streams.push(body);
  try{
   if(attempt===1){for await(const chunk of body){assert.equal(chunk.length,5);break;}throw Object.assign(Error('socket reset'),{code:'ECONNRESET'});}
   const chunks=[];for await(const chunk of body)chunks.push(chunk);return Buffer.concat(chunks);
  }finally{body.destroy();}
 },{wait:async ms=>{waits.push(ms);}});
 assert.deepEqual(result,bytes);assert.equal(streams.length,2);assert.notEqual(streams[0],streams[1]);assert.ok(streams.every(s=>s.destroyed));assert.deepEqual(waits,[1000]);
});
test('transient transfer failures stop at the configured retry bound',async()=>{
 let calls=0;const waits=[];
 await assert.rejects(retryCourseMediaTransfer(async()=>{calls++;throw Object.assign(Error('unavailable'),{$metadata:{httpStatusCode:503}});},{wait:async ms=>{waits.push(ms);}}),/unavailable/);
 assert.equal(calls,3);assert.deepEqual(waits,[1000,2000]);
});
test('authorization, missing objects, cancellation and integrity failures are never hidden',async()=>{
 for(const error of [Object.assign(Error('unauthorized'),{$metadata:{httpStatusCode:401}}),Object.assign(Error('forbidden'),{$metadata:{httpStatusCode:403}}),Object.assign(Error('missing'),{$metadata:{httpStatusCode:404}}),Object.assign(Error('cancelled'),{name:'AbortError'}),Error('DESTINATION_CHECKSUM_MISMATCH')]){
  let calls=0;await assert.rejects(retryCourseMediaTransfer(async()=>{calls++;throw error;},{wait:async()=>assert.fail('permanent failures must not retry')}),e=>e===error);assert.equal(calls,1);
 }
});
test('provider rate limits and nested connection errors are retryable',()=>{
 assert.equal(transientCourseMediaError({$metadata:{httpStatusCode:429}}),true);
 assert.equal(transientCourseMediaError({cause:{code:'EPIPE'}}),true);
 assert.equal(transientCourseMediaError({$metadata:{httpStatusCode:501}}),false);
});
