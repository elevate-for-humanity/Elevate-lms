import test from 'node:test';
import assert from 'node:assert/strict';
import {transcribeDecodedAudio} from './local-transcription-worker.mjs';
test('invalid word bounds trigger one new decode of the same audio',async()=>{
 const samples=new Float32Array(16000);
 const profiles=[];
 const result=await transcribeDecodedAudio(samples,async(audio,profile)=>{
  assert.equal(audio,samples);profiles.push(profile);
  return profiles.length===1 ? {text:'tools',chunks:[{text:'tools',timestamp:[0.8,0.7]}]} : {text:'tools',chunks:[{text:'tools',timestamp:[0.4,0.7]}]};
 });
 assert.equal(profiles.length,2);
 assert.equal(profiles[0].chunk_length_s,20);
 assert.equal(profiles[1].chunk_length_s,29);
 assert.deepEqual(result.words,[{word:'tools',start:0.4,end:0.7}]);
});
test('three invalid decodes fail without fabricating speech evidence',async()=>{
 let calls=0;
 await assert.rejects(transcribeDecodedAudio(new Float32Array(16000),async()=>{
  calls++;return {text:'tools',chunks:[{text:'tools',timestamp:[0.8,0.7]}]};
 }),/WORD_TIMINGS_REQUIRED/);
 assert.equal(calls,3);
});
test('valid decoding and runtime failures are not retried',async()=>{
 let calls=0;
 await transcribeDecodedAudio(new Float32Array(16000),async()=>{calls++;return {text:'tools',chunks:[{text:'tools',timestamp:[0.1,0.7]}]};});
 assert.equal(calls,1);
 await assert.rejects(transcribeDecodedAudio(new Float32Array(16000),async()=>{throw Error('runtime failure');}),/runtime failure/);
});

test('short-clip retry changes segmentation instead of decoding the same single window', async()=>{
 const samples=new Float32Array(141696); // observed 8.856-second production clip
 const profiles=[];
 const result=await transcribeDecodedAudio(samples,async(audio,profile)=>{
  assert.equal(audio,samples);profiles.push(profile);
  return profiles.length===1
   ? {text:'review',chunks:[{text:'review',timestamp:[8.14,11.58]}]}
   : {text:'review',chunks:[{text:'review',timestamp:[8.14,8.8]}]};
 });
 assert.equal(profiles.length,2);
 assert.ok(profiles[0].chunk_length_s > samples.length/16000);
 assert.ok(profiles[1].chunk_length_s < samples.length/16000);
 assert.ok(profiles[1].stride_length_s*2 < profiles[1].chunk_length_s);
 assert.equal(result.words[0].end,8.8);
});

test('non-monotonic overlap retries without overlap and retains every measured word',async()=>{
 const samples=new Float32Array(16000*40);const profiles=[];
 const result=await transcribeDecodedAudio(samples,async(audio,profile)=>{
  assert.equal(audio,samples);profiles.push(profile);
  return profiles.length<3 ? {text:'clean tools',chunks:[{text:'clean',timestamp:[1,1.2]},{text:'tools',timestamp:[0.9,1.3]}]} : {text:'clean tools',chunks:[{text:'clean',timestamp:[1,1.2]},{text:'tools',timestamp:[1.2,1.5]}]};
 });
 assert.equal(profiles.length,3);assert.equal(profiles[2].stride_length_s,0);
 assert.deepEqual(result.words,[{word:'clean',start:1,end:1.2},{word:'tools',start:1.2,end:1.5}]);
});

test('text-only rendered speech QA decodes independently without requiring caption timestamps',async()=>{
 const result=await transcribeDecodedAudio(new Float32Array(16000),async(_samples,options)=>{
  assert.equal(options.return_timestamps,false);return {text:'Actual decoded speech'};
 },{wordTimings:false});
 assert.equal(result.text,'Actual decoded speech');
 assert.equal(result.words,undefined);
});
test('text-only mode still rejects empty decoded audio',async()=>{
 await assert.rejects(()=>transcribeDecodedAudio(new Float32Array(16000),async()=>({text:''}),{wordTimings:false}),/LOCAL_TRANSCRIPTION_EMPTY/);
});
test('text-only inspection profiles decode the same PCM without an expected-text prompt',async()=>{
 const samples=new Float32Array(16000);
 for(const [profile,chunk,stride] of [['default',20,3],['wide',29,5],['nonoverlap',20,0]]){
  await transcribeDecodedAudio(samples,async(audio,options)=>{
   assert.equal(audio,samples);assert.equal(options.chunk_length_s,chunk);assert.equal(options.stride_length_s,stride);
   assert.equal(options.return_timestamps,false);assert.equal(options.initial_prompt,undefined);assert.equal(options.prompt,undefined);
   return {text:'Independently recognized speech'};
  },{wordTimings:false,textProfile:profile});
 }
});
