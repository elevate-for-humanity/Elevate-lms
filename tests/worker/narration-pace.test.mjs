import test from 'node:test';
import assert from 'node:assert/strict';
import {narrationRateForRepair} from '../../lib/ultimate-course-builder/instructional/narration-pace.mjs';
function directive(value,rate='0%',measured=true){return {target:'natural_narration',previous:{narration:{rate}},requirements:[{code:'PACE_OUT_OF_RANGE',message:'Delivered narration failed PACE_OUT_OF_RANGE: '+JSON.stringify({metrics:{wordsPerMinute:{value,measured}}})}]};}
test('normal generation and unrelated repairs retain native pace',()=>{
 assert.equal(narrationRateForRepair(), '0%');
 assert.equal(narrationRateForRepair({target:'natural_narration',requirements:[{code:'CLIPPED_WORDS'}]}),'0%');
 assert.equal(narrationRateForRepair({target:'natural_narration',previous:{narration:{rate:'+15%'}},requirements:[{code:'CLIPPED_WORDS'}]}),'+15%');
});
test('measured pacing feedback is bounded per correction and overall',()=>{
 assert.equal(narrationRateForRepair(directive(107.988)), '+15%');
 assert.equal(narrationRateForRepair(directive(170)), '-15%');
 assert.equal(narrationRateForRepair(directive(110,'+15%')), '+20%');
 assert.throws(()=>narrationRateForRepair(directive(110,'+20%')),/REPAIR_LIMIT/);
});
test('unmeasured and malformed feedback cannot change speech speed',()=>{
 for(const value of [0,null,'108']) assert.throws(()=>narrationRateForRepair(directive(value)),/MEASUREMENT_REQUIRED/);
 assert.throws(()=>narrationRateForRepair(directive(108,'0%',false)),/MEASUREMENT_REQUIRED/);
 assert.throws(()=>narrationRateForRepair({target:'natural_narration',requirements:[{code:'PACE_OUT_OF_RANGE',message:'too slow'}]}),/MEASUREMENT_REQUIRED/);
});
