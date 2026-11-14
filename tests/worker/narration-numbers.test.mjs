import test from 'node:test';
import assert from 'node:assert/strict';
import {narrationSpeechText,narrationTokens} from '../../lib/ultimate-course-builder/instructional/narration-numbers.mjs';
import {quoteStartSeconds} from '../../lib/ultimate-course-builder/instructional/picture-timeline.mjs';
test('financial speech preserves dollars, cents, signs and decimal precision',()=>{
  assert.equal(narrationSpeechText('$4,700; $900; $5,400.'),'four thousand seven hundred dollars; nine hundred dollars; five thousand four hundred dollars.');
  assert.equal(narrationSpeechText('$1.05 and -$0.50; 0.08'),'one dollar and five cents and minus zero dollars and fifty cents; zero point zero eight');
  assert.equal(narrationSpeechText('R410A and 1.2.3'),'R410A and 1.2.3');
});
test('written monetary cues match the measured explicit speech, never a different amount',()=>{
  assert.equal(quoteStartSeconds('Credit $900.',[{text:'Credit nine hundred dollars.',startSeconds:4}]),4);
  assert.throws(()=>quoteStartSeconds('Credit $900.',[{text:'Credit one thousand nine hundred dollars.',startSeconds:4}]),/PICTURE_CUE_NOT_ALIGNED/);
});

test('numeric and spoken forms retain complete values instead of matching a numeric prefix',()=>{
 assert.deepEqual(narrationTokens('$1,200.50'),narrationTokens('one thousand two hundred dollars and fifty cents'));
 assert.deepEqual(narrationTokens('20 hours and 100 to 125 weeks'),narrationTokens('twenty hours and one hundred to one hundred twenty five weeks'));
 assert.notDeepEqual(narrationTokens('2000'),narrationTokens('two thousand five hundred'));
 assert.deepEqual(narrationTokens('one two'),['1','2']);
});
