import test from 'node:test';import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createIsolatedKokoroModel,kokoroNarrationWorkerUrl} from '../../lib/video/kokoro-narration-worker.mjs';
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
test('worker path uses the module file when it exists (unbundled worker image)',()=>{
 const url=kokoroNarrationWorkerUrl();
 assert.match(url.href,/\/lib\/video\/kokoro-narration-worker\.mjs$/);
});
test('bundled Admin falls back from the baked build path to the standalone traced file',()=>{
 const seen=[];
 const url=kokoroNarrationWorkerUrl({moduleUrl:'file:///workspace/lib/video/kokoro-narration-worker.mjs',cwd:'/app/apps/admin',
  exists:path=>{seen.push(path);return path==='/app/lib/video/kokoro-narration-worker.mjs';}});
 assert.equal(url.href,'file:///app/lib/video/kokoro-narration-worker.mjs');
 assert.deepEqual(seen,['/workspace/lib/video/kokoro-narration-worker.mjs','/app/lib/video/kokoro-narration-worker.mjs']);
});
test('missing worker file fails with a named error instead of an anonymous module error',()=>{
 assert.throws(()=>kokoroNarrationWorkerUrl({moduleUrl:'file:///workspace/lib/video/kokoro-narration-worker.mjs',cwd:'/app/apps/admin',exists:()=>false}),
  /KOKORO_NARRATION_WORKER_MISSING:\/workspace\/lib\/video\/kokoro-narration-worker\.mjs,\/app\/lib\/video\/kokoro-narration-worker\.mjs/);
});
