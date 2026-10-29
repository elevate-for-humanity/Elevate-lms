import test from 'node:test';
import assert from 'node:assert/strict';
import {pictureTimeline,activePictureCue,pictureSceneTiming,quoteStartSeconds} from '../../lib/ultimate-course-builder/instructional/picture-timeline.mjs';
const cues=[{text:'Inspect the clean cape.',startSeconds:0,endSeconds:4},{text:'Check the neck strip.',startSeconds:4,endSeconds:8},{text:'Recap: prepare the station safely.',startSeconds:8,endSeconds:12}];
const photos=[{imageUrl:'a',sha256:'a',narrationQuote:'Inspect the clean cape'},{imageUrl:'b',sha256:'b',narrationQuote:'Check the neck strip'},{imageUrl:'c',sha256:'c',narrationQuote:'Recap prepare the station safely'}];
test('spoken recovery percentage resolves the identical ASR numeral and percent sign',()=>{
 const spoken=[{text:'80 % when it does not',startSeconds:17}];
 assert.equal(quoteStartSeconds('eighty percent when it does not',spoken),17);
 assert.equal(quoteStartSeconds('recover eighty percent now',[{text:'recover 80 % now',startSeconds:9}]),9);
 assert.throws(()=>quoteStartSeconds('recover eighty percent now',[{text:'recover 90 % now',startSeconds:9}]),/NOT_ALIGNED/);
 assert.throws(()=>quoteStartSeconds('do not vent refrigerant',[{text:'do vent refrigerant',startSeconds:9}]),/NOT_ALIGNED/);
});
test('single frame quantization prevents the extra frame that exhausted the picture timeline',()=>{
 const timing=pictureSceneTiming(31/30-Number.EPSILON,30);
 assert.equal(Math.ceil(timing.durationSeconds*30),32); // Reproduce the previous double-rounding defect.
 assert.equal(timing.durationFrames,31);
 for(let frame=0;frame<timing.durationFrames;frame++)assert.equal(activePictureCue([{startSeconds:0,endSeconds:timing.durationSeconds,imageUrl:'recap'}],frame/30).imageUrl,'recap');
 assert.throws(()=>activePictureCue([{startSeconds:0,endSeconds:timing.durationSeconds}],timing.durationSeconds),/TIMELINE_GAP/);
});
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

test('saved speech tokenization can spell slash and split a compound word',()=>{
 const spoken=[{text:'Current platform limits are 40 OJL hours and 50 combined OJL slash RTI hours weekly.',startSeconds:3,endSeconds:10}];
 assert.equal(quoteStartSeconds('Current platform limits are 40 OJL hours and 50 combined OJL/RTI hours weekly',spoken),3);
 assert.equal(quoteStartSeconds('Completion timeframes shift with weekly hours taking roughly 50 to 125 weeks before licensing applications',[{text:'Completion time frames shift with weekly hours taking roughly 50 to 125 weeks before licensing applications',startSeconds:12,endSeconds:20}]),12);
});
test('speech recognition function-word variation requires a long otherwise identical quote',()=>{
 assert.equal(quoteStartSeconds('notify the supervisor and Elevate immediately with the date actual times and error',[{text:'notify the supervisor and elevate immediately with the date actual times an error',startSeconds:7,endSeconds:13}]),7);
 for(const text of ['do not disinfect tools','complete 2000 hours','notify another supervisor immediately'])
  assert.throws(()=>quoteStartSeconds(text,[{text:'do disinfect tools complete 2500 hours notify the supervisor immediately',startSeconds:0,endSeconds:10}]),/NOT_ALIGNED/);
});

test('unique ordered speech cue survives a single ASR insertion without inventing timing',()=>{
 const spoken=[{text:'Prepare the clean and safe station before serving clients',startSeconds:2,endSeconds:8}];
 assert.equal(quoteStartSeconds('Prepare the clean safe station',spoken),2);
 assert.throws(()=>quoteStartSeconds('Unrelated legal safety language',spoken),/PICTURE_CUE_NOT_ALIGNED_TO_SPEECH/);
});

test('unique interior speech phrase anchors a paraphrased cue opening',()=>{
 const spoken=[{text:'Welcome participants. Explain respectful consultation and client communication before every service.',startSeconds:2,endSeconds:10}];
 assert.equal(quoteStartSeconds('Introduce the topic then explain respectful consultation and client communication before every service',spoken),2);
 assert.throws(()=>quoteStartSeconds('Invent requirements then explain unknown unsupported procedures with no transcript',spoken),/NOT_ALIGNED/);
});


test('registered cosmetology scene 9 plural transcription aligns with authored picture cue',()=>{
 const recorded=[{text:'At 20 OJL hours per week the same hour ranges 100 to 125 weeks after completion',startSeconds:12.74,endSeconds:21}];
 assert.equal(quoteStartSeconds('At 20 OJL hours per week the same hour range is 100 to 125 weeks',recorded),12.74);
 assert.throws(()=>quoteStartSeconds('',recorded),/NOT_ALIGNED/);
});


test('saved cosmetology recap resolves an exact ASR-split compound without fuzzy word substitution',()=>{
 const recorded=[{text:'auto',startSeconds:14.36},{text:'-claving',startSeconds:14.48},
  {text:'disinfecting',startSeconds:15.02},{text:'solutions',startSeconds:15.82},
  {text:'and',startSeconds:16.12},{text:'ultrasonic',startSeconds:16.34},
  {text:'cleanersers',startSeconds:16.86}];
 assert.equal(quoteStartSeconds('autoclaving, disinfecting solutions, and ultrasonic cleaners',recorded),14.36);
 assert.throws(()=>quoteStartSeconds('disinfect tools for 10 minutes',[{text:'disinfect tools for 20 minutes',startSeconds:0}]),/NOT_ALIGNED/);
 assert.throws(()=>quoteStartSeconds('do not disinfect tools',[{text:'do disinfect tools',startSeconds:0}]),/NOT_ALIGNED/);
});

test('barber consultation teaching pictures use primary speech rather than a closer recap phrase',()=>{
 const recorded=[
  {text:'Conduct a 5-10-minute consultation before service.',startSeconds:0.52,endSeconds:3.8},
  {text:'Greet warmly inspect scalp and hair, confirm agreement and document findings.',startSeconds:4.2,endSeconds:9},
  {text:'Complete a five to ten minute consultation by greeting evaluating hair and scalp securing consent and logging notes.',startSeconds:9.908,endSeconds:17.148},
 ];
 const pictures=[
  {imageUrl:'primary-a',sha256:'a',narrationQuote:'Conduct a 5 to 10 minute consultation before service.'},
  {imageUrl:'primary-b',sha256:'b',narrationQuote:'Greet warmly inspect scalp and hair'},
  {imageUrl:'recap',sha256:'c',isRecap:true,narrationQuote:'Complete a five-to-ten minute consultation'},
 ];
 const timeline=pictureTimeline(pictures,recorded,17.976,9.648);
 assert.deepEqual(timeline.map(p=>p.startSeconds),[0,4.2,9.648]);
 assert.equal(activePictureCue(timeline,10).imageUrl,'recap');
 const unsupported=pictures.map((p,i)=>i===0?{...p,narrationQuote:'securing consent and logging notes'}:p);
 assert.throws(()=>pictureTimeline(unsupported,recorded,17.976,9.648),/NOT_ALIGNED/);
});
