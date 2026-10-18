import test from 'node:test';
import assert from 'node:assert/strict';
import {measuredTeachingStep} from '../../lib/ultimate-course-builder/instructional/approved-presentation.mjs';
import {approvedPresentationForCourse,narrationSceneSeconds,presentationBookendFrames,assertNarratedScenes,assertPremiumSpeechSignal} from '../../lib/ultimate-course-builder/instructional/approved-presentation.mjs';
test('course identity alone never substitutes for an explicit owner presentation selection',()=>{
  for(const id of ['2c723bfa-8c40-4acc-b961-98d917710ffc','9ca9fb50-7119-46ea-ab81-9b0193c29c31','unrelated'])
    assert.equal(approvedPresentationForCourse(id),undefined);
});
test('short and fractional speech receives only frame quantization, no added dead time',()=>{
  for(const seconds of [.2,3.2,10.051,60.01]) {
    const duration=narrationSceneSeconds(seconds,true);
    assert.ok(duration>=seconds && duration-seconds<1/30);
    assert.ok(Math.abs(duration*30-Math.round(duration*30))<1e-8);
  }
  assert.throws(()=>narrationSceneSeconds(0,true));
  assert.throws(()=>narrationSceneSeconds(NaN,true));
  assert.deepEqual(presentationBookendFrames(true),{intro:0,outro:0});
  assert.deepEqual(presentationBookendFrames(false),{intro:90,outro:60});
});
test('reject a teaching scene with missing speech or missing visible media',()=>{
  const scene={scene_number:1,narration:'Inspect the guard.',audioSrc:'audio.mp3',imageUrl:'guard.png'};
  assert.doesNotThrow(()=>assertNarratedScenes([scene]));
  assert.throws(()=>assertNarratedScenes([{...scene,audioSrc:null}]),/NARRATION_MISSING/);
  assert.throws(()=>assertNarratedScenes([{...scene,narration:' '}]),/NARRATION_MISSING/);
  assert.throws(()=>assertNarratedScenes([{...scene,imageUrl:null}]),/VISUAL_MISSING/);
});
test('audible duration metadata cannot disguise a silent track or dropout',()=>{
  assert.doesNotThrow(()=>assertPremiumSpeechSignal('max_volume: -6.0 dB'));
  assert.throws(()=>assertPremiumSpeechSignal('max_volume: -91.0 dB'),/INAUDIBLE/);
  assert.throws(()=>assertPremiumSpeechSignal('max_volume: -6.0 dB\nsilence_start: 4.2'),/SILENT_GAP/);
  assert.throws(()=>assertPremiumSpeechSignal(''),/INAUDIBLE/);
});
test('instructions follow spoken cue timing rather than equal divisions of the scene',()=>{
  const steps=[{narrationQuote:'Inspect the blade'},{narrationQuote:'Attach the guard'}];
  const cues=[{text:'Inspect the blade.',startSeconds:0},{text:'After checking it, attach',startSeconds:8},{text:'the guard.',startSeconds:9}];
  assert.equal(measuredTeachingStep(steps,cues,7),0);
  assert.equal(measuredTeachingStep(steps,cues,8),1);
  assert.throws(()=>measuredTeachingStep([{narrationQuote:'Cut without a guard'}],cues,2),/NOT_ALIGNED/);
});

test('the premium scene and picture timeline use the same measured speech alignment', async () => {
  const {quoteStartSeconds}=await import('../../lib/ultimate-course-builder/instructional/picture-timeline.mjs');
  const steps=[{narrationQuote:'Prepare the station safely'},{narrationQuote:'Current platform limits are 40 OJL hours and 50 combined OJL/RTI hours weekly'}];
  const cues=[{text:'Prepare the station safely',startSeconds:0,endSeconds:5},{text:'Current platform limits are 40 OJL hours and 50 combined OJL slash RTI hours weekly',startSeconds:5,endSeconds:14}];
  assert.equal(quoteStartSeconds(steps[1].narrationQuote,cues),5);
  assert.equal(measuredTeachingStep(steps,cues,4.9),0);
  assert.equal(measuredTeachingStep(steps,cues,5),1);
});
