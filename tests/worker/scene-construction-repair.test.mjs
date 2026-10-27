import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { applySceneTitleReadabilityRepair } from '../../lib/ultimate-course-builder/core/repair-policy.mjs';

function loadTypeScript(path, exportName, injectedNames = [], injectedValues = []) {
  const source = stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8'), { mode: 'transform' })
    .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm, '')
    .replace(/^import ['"][^'"]+['"];?\n/gm, '')
    .replaceAll('export ', '');
  return new Function(...injectedNames, source + '\nreturn ' + exportName + ';')(...injectedValues);
}

const createProductionHandlers = loadTypeScript(
  '../../lib/ultimate-course-builder/core/production-handlers.ts',
  'createProductionHandlers',
  ['instructionView', 'applySceneTitleReadabilityRepair'],
  [value => value, applySceneTitleReadabilityRepair],
);
const prepareUltimateStoryboardInput = loadTypeScript(
  '../../lib/ultimate-course-builder/adapters/platform-renderer.ts',
  'prepareUltimateStoryboardInput',
  ['MIN_LESSON_VIDEO_SCENES'],
  [13],
);
const directMedia = loadTypeScript(
  '../../lib/video/media-director.ts',
  'directMedia',
  ['crypto'],
  [{ createHash }],
);

function storyboard(title = 'Cosmetology') {
  return {
    title,
    scenes: Array.from({ length: 13 }, (_, index) => ({
      id: 'scene:seg-' + String(index + 1).padStart(2, '0'),
      title: index === 2 ? 'terminology' : 'scene ' + (index + 1),
      dialogue: 'authored scene ' + (index + 1),
      teachingPoint: 'authored scene ' + (index + 1),
    })),
  };
}

test('scene construction applies the failure-specific layout directive without changing authored content', async () => {
  const board = storyboard();
  const assignments = board.scenes.map((scene, index) => ({ sceneId: scene.id, assetId: 'asset-' + (index + 1) }));
  const handlers = createProductionHandlers({});
  const result = await handlers.scene_construction({
    artifacts: {
      storyboard: { storyboard: board },
      visual_assignment: { media: { assignments } },
    },
    repairDirective: {
      target: 'scene_construction',
      attempt: 1,
      requirements: [{ code: 'MEDIA_TEXT_UNREADABLE', message: 'MEDIA_TEXT_UNREADABLE:3:390' }],
    },
  });
  const repaired = result.artifacts.scenes.storyboard.storyboard;
  assert.equal(repaired.scenes[2].titleFontSize, 128);
  assert.equal(repaired.scenes[1].titleFontSize, undefined);
  assert.equal(repaired.scenes[2].dialogue, board.scenes[2].dialogue);
  assert.equal(board.scenes[2].titleFontSize, undefined);
  assert.equal(result.artifacts.scenes.shots.length, 13);
});

test('the renderer consumes the repaired scene-construction storyboard', () => {
  const base = storyboard('original');
  const repaired = storyboard('repaired');
  repaired.scenes[2].titleFontSize = 128;
  const assignments = repaired.scenes.map((scene, index) => ({
    sceneId: scene.id,
    assetId: 'asset-' + (index + 1),
  }));
  const readyAssets = repaired.scenes.map((scene, index) => ({
    id: 'asset-' + (index + 1),
    instructional_scene_id: scene.id,
    entitlement_id: 'licensed-entitlement',
    public_url: 'https://media.example/scene-' + (index + 1) + '.jpg',
    mime_type: 'image/jpeg',
    provider: 'envato',
    provider_item_id: 'provider-item-' + (index + 1),
    license_evidence_url: 'https://media.example/license',
  }));
  const prepared = prepareUltimateStoryboardInput({
    lessonId: 'lesson',
    courseTitle: 'Cosmetology',
    artifacts: {
      storyboard: { storyboard: base },
      scene_construction: { scenes: { storyboard: { storyboard: repaired } } },
      visual_assignment: { media: { assignments, readyAssets } },
    },
  });
  assert.equal(prepared.sceneData.title, 'repaired');
  assert.equal(prepared.sceneData.scenes[2].titleFontSize, 128);
  const renderedStoryboard = directMedia(prepared);
  assert.equal(renderedStoryboard.scenes[2].titleFontSize, 128);
});
