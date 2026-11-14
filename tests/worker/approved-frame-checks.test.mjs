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
test('encoded inspection respects the recap caption boundary instead of regrouping words',()=>{
 const alignment=Array.from({length:19},(_,i)=>({word:'word'+i,start:i,end:i+.8}));
 const cues=[{startSeconds:0,endSeconds:7.8,text:alignment.slice(0,8).map(w=>w.word).join(' ')},
  {startSeconds:8,endSeconds:10.8,text:alignment.slice(8,11).map(w=>w.word).join(' ')},
  {startSeconds:11,endSeconds:18.8,text:alignment.slice(11).map(w=>w.word).join(' ')}];
 assert.deepEqual(captionSampleGroups(alignment,11,cues),[cues[0],cues[2]]);
});
test('caption inspection refuses phrases unsupported by timed narration',()=>{
 assert.throws(()=>captionSampleGroups([{word:'actual',start:0,end:1}],0,[{text:'invented caption',startSeconds:0,endSeconds:1}]),/ALIGNMENT_MISMATCH/);
 assert.throws(()=>captionSampleGroups([],0,[{text:'caption',startSeconds:2,endSeconds:1}]),/TIMING_INVALID/);
});
