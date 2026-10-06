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
