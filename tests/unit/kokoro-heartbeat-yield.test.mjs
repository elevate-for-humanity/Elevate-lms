import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const source=await readFile(new URL('../../lib/video/edge-tts.ts',import.meta.url),'utf8');
const start=source.indexOf('async function generateKokoroNarration(');
const end=source.indexOf('\nasync function generateLocalNarration(',start);
assert.ok(start>=0&&end>start);
// Exercise the production inference loop. Stub only the native model/codec so
// CPU-heavy resolved promises reproduce starvation without downloading a model.
const body=stripTypeScriptTypes(source.slice(start,end),{mode:'transform'});
const generate=Function('getKokoroModel','kokoroNarrationChunks','kokoroVoice','kokoroSpeed','pcm16MonoToMp3',body+';return generateKokoroNarration;');
test('Kokoro yields between native inference chunks so lease timers remain live',async()=>{
 let heartbeats=0,calls=0;
 const model={generate:async()=>{
  const end=performance.now()+20;while(performance.now()<end){}
  calls++;return {sampling_rate:24000,audio:new Float32Array([0.5,-0.5])};
 }};
 const run=generate(async()=>model,()=>Array(8).fill('approved words'),v=>v,()=>1,async pcm=>pcm);
 const timer=setInterval(()=>heartbeats++,2);
 let output;
 try{output=await run('approved script','en-US-DavisNeural','0%');}
 finally{clearInterval(timer);}
 assert.equal(calls,8);assert.equal(output.length,32);
 assert.equal(output.readInt16LE(0),16384);assert.equal(output.readInt16LE(2),-16384);
 assert.ok(heartbeats>=2,'CPU inference prevented lease timers from running');
});
test('cooperative scheduling retains sample-rate and empty-audio rejection',async()=>{
 for(const audio of [{sampling_rate:16000,audio:new Float32Array([1])},{sampling_rate:24000,audio:new Float32Array()}]){
  const run=generate(async()=>({generate:async()=>audio}),()=>['words'],v=>v,()=>1,async pcm=>pcm);
  await assert.rejects(run('script','voice','0%'),/unsupported sample rate|empty audio segment/);
 }
});
