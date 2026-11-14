import test from 'node:test';
import assert from 'node:assert/strict';
import {motionExcerptWindow} from '../../lib/ultimate-course-builder/instructional/motion-excerpt.mjs';
const pictures=[{narrationQuote:'Shampoo the client hair',startSeconds:5,endSeconds:14},{narrationQuote:'Inspect the clean towel',startSeconds:14,endSeconds:30}];
const evidence={contentSha256:'a'.repeat(64),visibleActions:['Shampooing client hair at a basin']};
test('short licensed motion is bounded by speech and actual source duration without looping',()=>{
 const window=motionExcerptWindow(pictures,evidence,6,30);
 assert.equal(window.startSeconds,5);
 assert.equal(window.endSeconds,11);
 assert.equal(window.contentSha256,evidence.contentSha256);
});
test('unrelated or contradictory footage cannot satisfy a demonstration',()=>{
 assert.throws(()=>motionExcerptWindow(pictures,{...evidence,visibleActions:['Organizing scissors on a workstation']},6,30),/NOT_AVAILABLE/);
 assert.throws(()=>motionExcerptWindow([{narrationQuote:'Never immerse the electrical clipper',startSeconds:0,endSeconds:10}],{...evidence,visibleActions:['Clipper placed in a basin']},6,10),/NOT_AVAILABLE/);
});
