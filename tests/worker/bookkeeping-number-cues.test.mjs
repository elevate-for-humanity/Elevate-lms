import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteStartSeconds} from '../../lib/ultimate-course-builder/instructional/picture-timeline.mjs';
import {narrationSpeechText,narrationTokens} from '../../lib/ultimate-course-builder/instructional/narration-numbers.mjs';

const timed=text=>narrationSpeechText(text).toLowerCase().match(/[a-z0-9]+/g).map((text,i)=>({text,startSeconds:i/2,endSeconds:(i+1)/2}));
test('financial teaching quotes bind to quantities split across measured word cues',()=>{
 for(const quote of ['The owner contributes $12,000.','Record wages of $3,600 and deductions of $720.','Debit supplies $250 and credit supplies inventory $250.','Interest is 4.5 percent.']){
  const cues=timed('First review the evidence. '+quote);
  assert.equal(quoteStartSeconds(quote,cues),2);
 }
});
test('a numeric match retains the measured onset after an earlier multiword quantity',()=>{
 const cues=timed('The owner contributes $12,000. Then pay $900 rent.');
 const expected=cues.find(c=>c.text==='then').startSeconds;
 assert.equal(quoteStartSeconds('Then pay $900 rent.',cues),expected);
});
test('different amounts and ambiguous repeated financial quotations remain blocked',()=>{
 assert.throws(()=>quoteStartSeconds('The owner contributes $12,000.',timed('The owner contributes $13,000.')),/NOT_ALIGNED/);
 assert.throws(()=>quoteStartSeconds('It remits a six-hundred-eighty-dollar loan installment.',timed('It remits a six-hundred-ninety-dollar loan installment.')),/NOT_ALIGNED/);
 assert.throws(()=>quoteStartSeconds('Pay $900 rent.',timed('Pay $900 rent. Pay $900 rent.')),/NOT_ALIGNED/);
});
test('existing numeric token callers keep their string-array contract',()=>{
 assert.deepEqual(narrationTokens('twelve thousand dollars'),['12000','dollars']);
});
