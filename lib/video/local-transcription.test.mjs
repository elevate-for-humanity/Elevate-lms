import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeFloatPcm,recognizedWords} from './local-transcription.mjs';
test('PCM decoding uses actual finite mono samples',()=>{
 const buffer=Buffer.alloc(8);buffer.writeFloatLE(0.25,0);buffer.writeFloatLE(-0.5,4);
 assert.deepEqual(Array.from(decodeFloatPcm(buffer)),[0.25,-0.5]);
 buffer.writeFloatLE(NaN,4);assert.throws(()=>decodeFloatPcm(buffer),/PCM_INVALID/);
 assert.throws(()=>decodeFloatPcm(Buffer.alloc(3)),/PCM_INVALID/);
});
test('missing or invalid decoded timings fail closed',()=>{
 for(const result of [{text:'heard speech'},{text:'heard speech',chunks:[{text:'heard',timestamp:[0,null]}]},{text:'heard speech',chunks:[{text:'heard',timestamp:[1,1]}]}])
  assert.throws(()=>recognizedWords(result),/WORD_TIMINGS_REQUIRED/);
});
test('recognized words preserve measured times and decoded speech',()=>{
 assert.deepEqual(recognizedWords({text:'clean tools',chunks:[{text:' clean',timestamp:[0.2,0.5]},{text:' tools',timestamp:[0.6,1]}]}),
 [{word:'clean',start:0.2,end:0.5},{word:'tools',start:0.6,end:1}]);
});
test('collapsed words remain in phrases with measured outer bounds',()=>{
 const chunks=[{text:'ergonomics',timestamp:[24.96,25.64]},{text:'lesson',timestamp:[25.64,25.64]},{text:'clippers',timestamp:[26.26,26.78]}];
 assert.deepEqual(recognizedWords({text:'ergonomics lesson clippers',chunks}),[{word:'ergonomics lesson clippers',start:24.96,end:26.78}]);
});
test('collapsed opening words use the decoded boundary and next measured end',()=>{
 assert.deepEqual(recognizedWords({text:'clean tools',chunks:[{text:'clean',timestamp:[0,0]},{text:'tools',timestamp:[0.2,0.7]}]}),[{word:'clean tools',start:0,end:0.7}]);
});
test('unbounded, long or non-monotonic alignments still fail closed',()=>{
 const cases=[
  [{text:'clean',timestamp:[0,0.4]},{text:'tools',timestamp:[0.5,0.5]}],
  [{text:'clean',timestamp:[0,0]},{text:'tools',timestamp:[0.5,8]}],
  [{text:'clean',timestamp:[1,2]},{text:'tools',timestamp:[0.5,1]}],
  Array.from({length:4},()=>({text:'word',timestamp:[0,0]})).concat({text:'tools',timestamp:[0.5,1]}),
 ];
 for(const chunks of cases)assert.throws(()=>recognizedWords({text:'heard speech',chunks}),/WORD_TIMINGS_REQUIRED/);
});

test('collapsed final words retain the previous measured phrase without extending its bounds',()=>{
 assert.deepEqual(recognizedWords({text:'clean tools',chunks:[{text:'clean',timestamp:[0.2,0.7]},{text:'tools',timestamp:[0.7,0.7]}]}),[{word:'clean tools',start:0.2,end:0.7}]);
 assert.throws(()=>recognizedWords({text:'clean tools',chunks:[{text:'clean',timestamp:[0,6]},{text:'tools',timestamp:[6,6]}]}),/WORD_TIMINGS_REQUIRED/);
});
