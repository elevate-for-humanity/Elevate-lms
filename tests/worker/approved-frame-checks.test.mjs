import test from 'node:test';
import assert from 'node:assert/strict';
import {captionSampleGroups,captionWordCoverage,charcoalPixelsMatch} from '../../lib/ultimate-course-builder/instructional/approved-frame-checks.mjs';
test('caption samples follow measured teaching and recap words',()=>{
 const words=Array.from({length:24},(_,i)=>({word:'word'+i,start:i,end:i+.8}));
 const groups=captionSampleGroups(words,16);
 assert.equal(groups.length,2);assert.equal(groups[1].startSeconds,16);assert.equal(groups[0].endSeconds,7.8);
});
test('caption OCR coverage derives from decoded words, never supplied metadata',()=>{
 assert.equal(captionWordCoverage('Never immerse electrical clippers.','Never immerse electrical clippers'),1);
 assert.equal(captionWordCoverage('Never immerse electrical clippers.',''),0);
 assert.equal(captionWordCoverage('Never immerse electrical clippers.','immerse electrical clippers'),.75);
});
test('charcoal pixel check rejects blue, blank and missing samples',()=>{
 assert.equal(charcoalPixelsMatch(Buffer.alloc(12,23)),true);
 assert.equal(charcoalPixelsMatch(Buffer.from([11,19,43,11,19,43,11,19,43,11,19,43])),false);
 assert.equal(charcoalPixelsMatch(Buffer.alloc(12,255)),false);
 assert.equal(charcoalPixelsMatch(Buffer.alloc(0)),false);
});
