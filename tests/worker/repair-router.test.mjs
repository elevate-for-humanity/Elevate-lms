import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';

const source = stripTypeScriptTypes(
  readFileSync(new URL('../../lib/ultimate-course-builder/core/repair-router.ts', import.meta.url), 'utf8'),
  { mode: 'transform' },
).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm, '').replaceAll('export ', '');
const { isDurableExternalBlocker, routeSelectiveRepairs } =
  new Function(source + '\nreturn { isDurableExternalBlocker, routeSelectiveRepairs };')();

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


test('picture mismatch from render routes to upstream synchronization', () => {
 const findings=[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'ULTIMATE_VIDEO_RENDER_FAILED:PICTURE_CUE_NOT_ALIGNED_TO_SPEECH'}];
 assert.deepEqual(routeSelectiveRepairs(findings),[{step:'synchronization',codes:['ULTIMATE_VIDEO_RENDER_FAILED'],rebuildOnlyThisStage:true}]);
});

test('repeated encoded timeline and insufficient shots repair upstream visual assignment', () => {
 const findings=[{code:'Media quality gate failed',message:'insufficient visual changes: detected 6, expected at least 12; rendered video repeats 8 earlier moving sequences'}];
 assert.equal(routeSelectiveRepairs(findings)[0].step,'visual_assignment');
});

test('ffmpeg assembly failures stay at render stage', () => {
 const findings=[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'FFmpeg output missing'}];
 assert.equal(routeSelectiveRepairs(findings)[0].step,'lesson_film_render');
});
