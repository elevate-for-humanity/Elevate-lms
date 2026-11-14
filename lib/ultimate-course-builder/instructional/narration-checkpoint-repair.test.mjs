import {test} from 'node:test';
import assert from 'node:assert/strict';
import {measuredNarrationRepair} from './narration-checkpoint-repair.mjs';
import {narrationRateForRepair} from './narration-pace.mjs';
test('saved delivered pace failure supplies real synthesis correction after handoff',()=>{
  const previous={narration:{rate:'0%',audioUrl:'saved-audio'}};
  const qa={source:'delivered-mp4',mediaSha256:'saved-film-hash',pass:false,
    failures:['PACE_OUT_OF_RANGE'],metrics:{wordsPerMinute:{measured:true,value:107.98816568047337}},unknown:[]};
  const directive=measuredNarrationRepair(qa,previous);
  assert.equal(narrationRateForRepair(directive),'+15%');
  assert.equal(directive.previous,previous);
  assert.equal(directive.failedStep,'narration_qa');
  assert.equal(qa.pass,false);
});
test('missing measurement or delivered-media identity cannot authorize a correction',()=>{
  const qa={source:'delivered-mp4',pass:false,failures:['PACE_OUT_OF_RANGE'],metrics:{wordsPerMinute:{measured:false,value:108}}};
  assert.equal(measuredNarrationRepair(qa,{narration:{rate:'0%'}}),null);
});
test('accepted narration never requests regeneration',()=>{
  assert.equal(measuredNarrationRepair({source:'delivered-mp4',mediaSha256:'hash',pass:true,failures:[]},{narration:{rate:'0%'}}),null);
});
