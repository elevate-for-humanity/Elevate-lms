import test from 'node:test';
import assert from 'node:assert/strict';
import {pictureTimeline,activePictureCue} from '../../lib/ultimate-course-builder/instructional/picture-timeline.mjs';
const cues=[{text:'Inspect the clean cape.',startSeconds:0,endSeconds:4},{text:'Check the neck strip.',startSeconds:4,endSeconds:8},{text:'Recap: prepare the station safely.',startSeconds:8,endSeconds:12}];
const photos=[{imageUrl:'a',sha256:'a',narrationQuote:'Inspect the clean cape'},{imageUrl:'b',sha256:'b',narrationQuote:'Check the neck strip'},{imageUrl:'c',sha256:'c',narrationQuote:'Recap prepare the station safely'}];
test('pictures change with spoken cues and recap without extending narration',()=>{
 const timeline=pictureTimeline(photos,cues,12,8);
 assert.deepEqual(timeline.map(c=>[c.startSeconds,c.endSeconds]),[[0,4],[4,8],[8,12]]);
 assert.equal(activePictureCue(timeline,5).imageUrl,'b');
 assert.equal(activePictureCue(timeline,9).imageUrl,'c');
});
test('two views of one teaching point share its spoken interval',()=>{
 const timeline=pictureTimeline([{...photos[0]},{...photos[0],imageUrl:'b',sha256:'b'},photos[2]],cues,12,8);
 assert.deepEqual(timeline.map(c=>c.startSeconds),[0,4,8]);
});
test('missing reference pictures, spoken cue or fresh recap cannot pass',()=>{
 assert.throws(()=>pictureTimeline([photos[0]],cues,12,8),/MULTIPLE_DISTINCT/);
 assert.throws(()=>pictureTimeline(photos,cues,12,0),/RECAP_TIMING/);
 assert.throws(()=>pictureTimeline([{...photos[0],narrationQuote:'Invent a guard length'},photos[1]],cues,12,8),/NOT_ALIGNED/);
});

test('recap picture starts at audio part boundary even when its first word starts later',()=>{
 const delayed=cues.map((c,i)=>i===2?{...c,startSeconds:8.32}:c);
 const timeline=pictureTimeline(photos.map((p,i)=>({...p,isRecap:i===2})),delayed,12,8);
 assert.equal(timeline[2].startSeconds,8);
 assert.equal(timeline[1].endSeconds,8);
 assert.equal(activePictureCue(timeline,8.1).imageUrl,'c');
});
test('explicit recap identity survives reordered photo input',()=>{
 const timeline=pictureTimeline([{...photos[2],isRecap:true},photos[0],photos[1]],cues,12,8);
 assert.equal(timeline.at(-1).imageUrl,'c');
 assert.equal(timeline.at(-1).startSeconds,8);
});
