import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSourceGrounding} from '../../lib/ultimate-course-builder/instructional/source-grounding.mjs';
const segments=[{id:'terms'}];
const sources=[{id:'authorized',text:'Inspect the clean cape before placing it on the client.'}];
const valid=[{segmentId:'terms',sourceId:'authorized',excerpt:sources[0].text}];
test('exact authorized passage accepts whitespace normalization',()=>{
 assertSourceGrounding(segments,sources,valid);
 assertSourceGrounding(segments,sources,[{...valid[0],excerpt:valid[0].excerpt.replaceAll(' ','  ')}]);
});
for(const [name,patch] of [['fabricated quote',{excerpt:'An invented statement with enough words must never pass source review.'}],['wrong source',{sourceId:'invented'}],['short excerpt',{excerpt:'Inspect the clean cape'}]])test(name+' cannot pass',()=>assert.throws(()=>assertSourceGrounding(segments,sources,[{...valid[0],...patch}]),/ULTIMATE_SOURCE_CITATION_INVALID:terms/));
test('missing and malformed grounding cannot pass',()=>{
 for(const citations of [undefined,[],[null]])assert.throws(()=>assertSourceGrounding(segments,sources,citations),/ULTIMATE_/);
});

test('authorized HTML and typographic formatting cannot cause a false citation failure',()=>{
 const source={id:'authorized',text:'Authorized course content: {"html":"<p>Apprentices record <strong>2,000</strong> verified hours — never count lunch as training time.</p>"}'};
 assertSourceGrounding(segments,[source],[{segmentId:'terms',sourceId:'authorized',excerpt:'Apprentices record 2000 verified hours; NEVER count lunch as training time.'}]);
});
test('format normalization cannot erase a safety negation or change the hours',()=>{
 const source={id:'authorized',text:'Apprentices must not count lunch as training time during the 2000 hour program.'};
 for(const excerpt of ['Apprentices must count lunch as training time during the 2000 hour program.','Apprentices must not count lunch as training time during the 2500 hour program.'])
  assert.throws(()=>assertSourceGrounding(segments,[source],[{segmentId:'terms',sourceId:'authorized',excerpt}]),/ULTIMATE_SOURCE_CITATION_INVALID/);
});
