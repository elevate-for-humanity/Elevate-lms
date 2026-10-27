import test from 'node:test';
import assert from 'node:assert/strict';
import {independentSpeechWindows} from '../../lib/video/independent-speech-windows.mjs';
import {narrationCoverageSeverity} from '../../lib/ultimate-course-builder/instructional/approved-delivery.mjs';
test('failed lexical coverage re-decodes the same audio with independent windows and unchanged threshold',async()=>{
 const calls=[];const result=await independentSpeechWindows({read:async profile=>{calls.push(profile);return profile==='default'?'first decode':'independent decode';},coverage:text=>text==='first decode'?.734:.94,minimumCoverage:.75});
 assert.deepEqual(calls,['default','wide']);assert.equal(result.transcript,'independent decode');assert.equal(result.coverage,.94);
 assert.equal(narrationCoverageSeverity(.734,true),'error');
});
test('recognition disagreement never fabricates a passing transcript',async()=>{
 const calls=[];const result=await independentSpeechWindows({read:async profile=>{calls.push(profile);return profile;},coverage:text=>({default:.734,wide:.74,nonoverlap:.6})[text],minimumCoverage:.75});
 assert.deepEqual(calls,['default','wide','nonoverlap']);assert.equal(result.transcript,'wide');assert.equal(narrationCoverageSeverity(result.coverage,true),'error');
});
test('already passing actual speech does not spend additional decode attempts',async()=>{
 let calls=0;const result=await independentSpeechWindows({read:async()=>{calls++;return 'actual speech';},coverage:()=>.95,minimumCoverage:.9});
 assert.equal(calls,1);assert.equal(result.transcript,'actual speech');
});
test('missing actual speech cannot be replaced with expected teaching',async()=>{
 await assert.rejects(independentSpeechWindows({read:async()=>'',coverage:()=>0,minimumCoverage:.75}),/INDEPENDENT_DECODE_REQUIRED/);
});
