import test from 'node:test';import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createIsolatedKokoroModel} from '../../lib/video/kokoro-narration-worker.mjs';
const script=`const {parentPort}=require('node:worker_threads');parentPort.on('message',m=>{const end=Date.now()+80;while(Date.now()<end){}parentPort.postMessage({id:m.id,audio:{sampling_rate:24000,audio:new Float32Array([0.5,-0.5]),text:m.text,voice:m.options.voice,speed:m.options.speed}});});`;
test('blocking native inference cannot starve parent heartbeat timers or alter request/audio',async()=>{
 const model=createIsolatedKokoroModel({workerFactory:()=>new Worker(script,{eval:true}),timeoutMs:1000});
 let ticks=0;const timer=setInterval(()=>ticks++,5);
 try{
  const audio=await model.generate('approved words',{voice:'am_puck',speed:1});
  assert.ok(ticks>=3);assert.equal(audio.text,'approved words');assert.equal(audio.voice,'am_puck');
  assert.equal(audio.speed,1);assert.equal(audio.sampling_rate,24000);assert.deepEqual([...audio.audio],[0.5,-0.5]);
 }finally{clearInterval(timer);}
});
test('worker crash rejects the current attempt and permits a later bounded attempt',async()=>{
 let starts=0;
 const model=createIsolatedKokoroModel({workerFactory:()=>new Worker(starts++===0?'process.exit(7)':script,{eval:true}),timeoutMs:1000});
 await assert.rejects(model.generate('words',{voice:'am_puck',speed:1}),/KOKORO_INFERENCE_WORKER_EXIT:7/);
 assert.equal(starts,1,'must not automatically retry failed inference');
 assert.equal((await model.generate('words',{voice:'am_puck',speed:1})).sampling_rate,24000);
 assert.equal(starts,2);
});
test('hung inference has a finite deadline and cannot retain the worker',async()=>{
 const model=createIsolatedKokoroModel({workerFactory:()=>new Worker('setInterval(()=>{},1000)',{eval:true}),timeoutMs:50});
 await assert.rejects(model.generate('words',{}),/KOKORO_INFERENCE_WORKER_TIMEOUT/);
});
