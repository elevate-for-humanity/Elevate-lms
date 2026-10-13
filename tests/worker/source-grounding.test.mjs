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
