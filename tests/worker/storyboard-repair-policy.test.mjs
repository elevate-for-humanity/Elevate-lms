import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreRecordedStoryboardSource} from '../../lib/ultimate-course-builder/instructional/storyboard-repair-policy.mjs';
const directive=message=>({target:'storyboard',requirements:[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message}]});
test('indexed and scene-specific cue failures retain the approved recording source',()=>{
  for(const message of ['ULTIMATE_VIDEO_RENDER_FAILED:PREMIUM_TEACHING_CUE_NOT_ALIGNED:2','ULTIMATE_VIDEO_RENDER_FAILED:PICTURE_CUE_NOT_ALIGNED_TO_SPEECH:scene:seg-01:0','ULTIMATE_VIDEO_RENDER_FAILED:ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED'])
    assert.equal(restoreRecordedStoryboardSource(directive(message)),true);
});
test('unrelated producer failures still receive their own repair directive',()=>{
  assert.equal(restoreRecordedStoryboardSource(directive('ULTIMATE_VIDEO_RENDER_FAILED:OTHER_DEFECT')),false);
  assert.equal(restoreRecordedStoryboardSource({...directive('PREMIUM_TEACHING_CUE_NOT_ALIGNED:2'),target:'instructor_script'}),false);
  assert.equal(restoreRecordedStoryboardSource({target:'storyboard',requirements:[]}),false);
});
