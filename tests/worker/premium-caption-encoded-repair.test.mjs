import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {premiumCaptionFontSize} from '../../remotion-src/premium-caption-layout.mjs';

test('short approved caption stays readable at full size',()=>{
 assert.equal(premiumCaptionFontSize('during guided practice complete one step at a'),60);
});
test('recap-length approved cue fits the fixed native caption bar',()=>{
 assert.equal(premiumCaptionFontSize('explain each planning step aloud invite reviewer feedback'),52);
 assert.equal(premiumCaptionFontSize('a '.repeat(50)),44);
});
test('premium caption text remains unmodified in the player',()=>{
 const scene=readFileSync(new URL('../../remotion-src/compositions/PremiumTeachingScene.tsx',import.meta.url),'utf8');
 assert.match(scene,/premiumCaptionFontSize\(caption\)/);
 assert.match(scene,/>\{caption\}<\/div>/);
});
test('encoded QA still requires 85 percent real rendered caption coverage',()=>{
 const gate=readFileSync(new URL('../../lib/video/media-quality-gate.ts',import.meta.url),'utf8');
 assert.match(gate,/if\(wordCoverage<0\.85\)throw new Error\(`APPROVED_ENCODED_BOTTOM_CAPTIONS_REQUIRED/);
});
