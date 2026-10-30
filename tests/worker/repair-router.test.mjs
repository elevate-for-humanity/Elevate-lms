import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';

const source = stripTypeScriptTypes(
  readFileSync(new URL('../../lib/ultimate-course-builder/core/repair-router.ts', import.meta.url), 'utf8'),
  { mode: 'transform' },
).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm, '').replaceAll('export ', '');
const { isDurableExternalBlocker, routeSelectiveRepairs, requiresIndependentMediaDelivery, COURSE_RECOVERY_CONTRACT_VERSION } =
  new Function(source + '\nreturn { isDurableExternalBlocker, routeSelectiveRepairs, requiresIndependentMediaDelivery, COURSE_RECOVERY_CONTRACT_VERSION };')();

test('unchanged producer output is an internal repair failure, not an external blocker', () => {
  assert.equal(isDurableExternalBlocker({ code: 'REPAIR_PRODUCER_UNCHANGED' }), false);
  assert.equal(routeSelectiveRepairs([{ code: 'REPAIR_PRODUCER_UNCHANGED', message: 'unchanged' }]).length, 0);
});

test('license and authorization evidence remains an external blocker', () => {
  assert.equal(isDurableExternalBlocker({ code: 'MEDIA_LICENSE_REQUIRED' }), true);
  assert.equal(isDurableExternalBlocker({ code: 'PAID_INFERENCE_AUTHORIZATION_REQUIRED' }), true);
});

test('phone-size unreadable text routes to the scene producer', () => {
  assert.deepEqual(
    routeSelectiveRepairs([{ code: 'MEDIA_TEXT_UNREADABLE', message: 'MEDIA_TEXT_UNREADABLE:3:390' }]),
    [{ step: 'scene_construction', codes: ['MEDIA_TEXT_UNREADABLE'], rebuildOnlyThisStage: true }],
  );
});

test('encoded caption OCR retries QA on the durable film instead of rerendering it', () => {
  assert.deepEqual(
    routeSelectiveRepairs([{code:'APPROVED_ENCODED_BOTTOM_CAPTIONS_REQUIRED',message:'APPROVED_ENCODED_BOTTOM_CAPTIONS_REQUIRED:scene:seg-check:390'}]),
    [{step:'finished_media_qa',codes:['APPROVED_ENCODED_BOTTOM_CAPTIONS_REQUIRED'],rebuildOnlyThisStage:true}],
  );
});


test('picture mismatch from render routes to its storyboard cue producer', () => {
 const findings=[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'ULTIMATE_VIDEO_RENDER_FAILED:PICTURE_CUE_NOT_ALIGNED_TO_SPEECH'}];
 assert.deepEqual(routeSelectiveRepairs(findings),[{step:'storyboard',codes:['ULTIMATE_VIDEO_RENDER_FAILED'],rebuildOnlyThisStage:true}]);
});

test('repeated encoded timeline and insufficient shots repair upstream visual assignment', () => {
 const findings=[{code:'Media quality gate failed',message:'insufficient visual changes: detected 6, expected at least 12; rendered video repeats 8 earlier moving sequences'}];
 assert.equal(routeSelectiveRepairs(findings)[0].step,'visual_assignment');
});

test('ffmpeg assembly failures stay at render stage', () => {
 const findings=[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'FFmpeg output missing'}];
 assert.equal(routeSelectiveRepairs(findings)[0].step,'lesson_film_render');
});


test('combined freeze and backward replay repair both media assembly and visuals', () => {
 const findings=[{code:'Media quality gate failed',message:'Media quality gate failed: frozen interval 5.40s exceeds 4s; rendered video repeats 6 earlier moving sequence(s), indicating a backward timeline jump or replay'}];
 assert.deepEqual(routeSelectiveRepairs(findings),[
  {step:'visual_assignment',codes:['Media quality gate failed'],rebuildOnlyThisStage:true},
  {step:'lesson_film_render',codes:['Media quality gate failed'],rebuildOnlyThisStage:true},
 ]);
});

test('freeze-only routes to render while replay-only routes to visual assignment', () => {
 assert.deepEqual(routeSelectiveRepairs([{code:'Media quality gate failed',message:'frozen interval 5.4s'}]).map(x=>x.step),['lesson_film_render']);
 assert.deepEqual(routeSelectiveRepairs([{code:'Media quality gate failed',message:'repeats 6 earlier moving sequence(s)'}]).map(x=>x.step),['visual_assignment']);
});

test('storage capacity failures are operational blockers and never trigger unchanged rerenders', () => {
 const finding={code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'ULTIMATE_VIDEO_RENDER_FAILED:Cannot upload files, storage cap exceeded. See the Caps & Alerts page to increase your cap.'};
 assert.equal(isDurableExternalBlocker(finding),true);
 assert.deepEqual(routeSelectiveRepairs([finding]),[]);
 assert.equal(isDurableExternalBlocker({code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'ffmpeg failed'}),false);
});

test('recovery v2 classifies VTT storage failure as delivery-only, never rerender', () => {
  assert.equal(COURSE_RECOVERY_CONTRACT_VERSION, 'course-recovery-v2');
  const failedVtt = {code:'ULTIMATE_VIDEO_RENDER_FAILED', message:'ULTIMATE_VIDEO_RENDER_FAILED:COURSE_OBJECT_STORAGE_UPLOAD_FAILED:lesson-3.vtt'};
  assert.equal(requiresIndependentMediaDelivery(failedVtt), true);
  assert.equal(isDurableExternalBlocker(failedVtt), true);
  assert.deepEqual(routeSelectiveRepairs([failedVtt]), []);
  assert.equal(requiresIndependentMediaDelivery({code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'ffmpeg failed'}), false);
});
test('per-scene ASR mismatch reinspects existing encoded audio without restarting a deterministic timeline',()=>{
 assert.deepEqual(routeSelectiveRepairs([{code:'MEDIA_SCENE_NARRATION_MISMATCH',message:'MEDIA_SCENE_NARRATION_MISMATCH:scene:0.734'}]),[{step:'finished_media_qa',codes:['MEDIA_SCENE_NARRATION_MISMATCH'],rebuildOnlyThisStage:true}]);
});

test('stale approved speech repairs narration before attempting another render',()=>{
 for(const code of ['ULTIMATE_VIDEO_RENDER_FAILED','ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED']){
  assert.deepEqual(routeSelectiveRepairs([{code,message:'ULTIMATE_VIDEO_RENDER_FAILED:ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED'}]),[{step:'natural_narration',codes:[code],rebuildOnlyThisStage:true}]);
 }
});
