import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
// Exercise the actual adapter without loading rendering/upload dependencies.
let source = await readFile(new URL('../../lib/ultimate-course-builder/adapters/platform-renderer.ts', import.meta.url), 'utf8');
const mediaDirector = await readFile(new URL('../../lib/video/media-director.ts', import.meta.url), 'utf8');
const minimum = Number(mediaDirector.match(/export const MIN_LESSON_VIDEO_SCENES = (\d+);/)[1]);
source = source.replace(/^import .*materializeInstructionalVisualAssets.*;$/m, '');
source = source.replace(/^import .*MIN_LESSON_VIDEO_SCENES.*;$/m, `const MIN_LESSON_VIDEO_SCENES = ${minimum};`);
const { prepareUltimateStoryboardInput, requireResolvedVisualEvidence } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source, { mode: 'transform' })).toString('base64'));
test('saved assignments survive other asset records referencing the same licensed files', () => {
  const scenes = Array.from({ length: minimum }, (_, i) => ({ id: `scene-${i}`, dialogue: `Teach ${i}` }));
  const asset = (i, id) => ({ id, public_url: `https://media.example/shot-${i}.mp4`, mime_type: 'video/mp4', entitlement_id: `license-${i}` });
  const prepared = prepareUltimateStoryboardInput({ artifacts: {
    storyboard: { storyboard: { scenes } },
    visual_assignment: { media: {
      assignments: scenes.map((s, i) => ({ sceneId: s.id, assetId: `approved-${i}` })),
      readyAssets: [...scenes.map((_, i) => asset(i, `other-lesson-${i}`)), ...scenes.map((_, i) => asset(i, `approved-${i}`))],
    } },
  } });
  assert.equal(prepared.sceneData.scenes.length, minimum);
  prepared.sceneData.scenes.forEach((scene, i) => assert.equal(scene.source_video_url, `https://media.example/shot-${i}.mp4`));
});
test('preserving record IDs does not certify repeated shots as distinct visuals', () => {
  assert.throws(() => requireResolvedVisualEvidence({ scenes: Array.from({ length: minimum }, () => ({ sourceVideoUrl: 'https://media.example/same.mp4' })) }), /DISTINCT_VISUALS_REQUIRED/);
});
