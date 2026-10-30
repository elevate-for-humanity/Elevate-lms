import test from 'node:test';import assert from 'node:assert/strict';
import {TeachingPhotoBatch} from './teaching-photo-batch.mjs';
test('photo preparation overlaps only two requests and retains cue order despite out-of-order completion',async()=>{
 const batch=new TeachingPhotoBatch(),pictures=[];let active=0,peak=0;
 for(let index=0;index<7;index++)await batch.add(async()=>{
  peak=Math.max(peak,++active);
  await new Promise(resolve=>setTimeout(resolve,index%2?1:10));
  pictures[index]='cue-'+index;active--;
 });
 await batch.flush();assert.equal(peak,2);assert.equal(active,0);
 assert.deepEqual(pictures,Array.from({length:7},(_,i)=>'cue-'+i));
});
test('a failed cue waits for its companion to persist and never starts another request',async()=>{
 const batch=new TeachingPhotoBatch();let companionSaved=false;
 await batch.add(async()=>{throw Error('PROVIDER_UNAVAILABLE');});
 await assert.rejects(batch.add(async()=>{await new Promise(resolve=>setTimeout(resolve,5));companionSaved=true;}),/PROVIDER_UNAVAILABLE/);
 assert.equal(companionSaved,true);assert.equal(batch.pending.length,0);
});
