import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { applySceneTitleReadabilityRepair, orderSceneTeachingStates } from '../../lib/ultimate-course-builder/core/repair-policy.mjs';
import { measuredTeachingStep } from '../../lib/ultimate-course-builder/instructional/approved-presentation.mjs';
import { quoteStartSeconds } from '../../lib/ultimate-course-builder/instructional/picture-timeline.mjs';

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
  ['instructionView', 'applySceneTitleReadabilityRepair', 'orderSceneTeachingStates'],
  [value => value, applySceneTitleReadabilityRepair, orderSceneTeachingStates],
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

test('lesson 19 overlapping knowledge-check quotes each become visible in spoken order', async () => {
  const dialogue = 'Pause and verify your understanding. Which complementary hue reduces unwanted orange tones? Remember the pairings: violet opposes yellow, blue opposes orange, and green opposes red.';
  const steps = [
    {label:'Orange Neutralizer', value:'blue opposes orange', narrationQuote:'blue opposes orange'},
    {label:'Complementary Pairs', value:'violet opposes yellow, blue opposes orange, and green opposes red', narrationQuote:'violet opposes yellow, blue opposes orange, and green opposes red'},
  ];
  const scene = {id:'scene:seg-10-knowledge-check', dialogue, teachingVisual:{kind:'choices', steps}, sourceRequirementIds:['source-19']};
  const cues = dialogue.toLowerCase().match(/[a-z0-9]+/g).map((text, index) => ({text, startSeconds:index, endSeconds:index+1}));
  // Reproduce the actual defect: the earlier array entry never gets displayed.
  assert.equal(measuredTeachingStep(steps, cues, quoteStartSeconds(steps[0].narrationQuote, cues)+1), 1);
  const result = await createProductionHandlers({}).scene_construction({
    artifacts:{storyboard:{storyboard:{scenes:[scene]}},visual_assignment:{media:{assignments:[{sceneId:scene.id,assetId:'licensed-photo'}]}}},
    repairDirective:{target:'scene_construction',requirements:[{code:'MEDIA_TEACHING_STATE_NOT_VISIBLE',message:'MEDIA_TEACHING_STATE_NOT_VISIBLE:'+scene.id+':0:1280'}]},
  });
  const repaired = result.artifacts.scenes.storyboard.storyboard.scenes[0];
  assert.deepEqual(repaired.teachingVisual.steps, [steps[1],steps[0]]);
  for (const [index, step] of repaired.teachingVisual.steps.entries())
    assert.equal(measuredTeachingStep(repaired.teachingVisual.steps, cues, quoteStartSeconds(step.narrationQuote,cues)+1), index);
  assert.equal(repaired.dialogue, dialogue);
  assert.deepEqual(repaired.sourceRequirementIds, scene.sourceRequirementIds);
  assert.deepEqual(scene.teachingVisual.steps, steps);
  assert.equal(result.artifacts.scenes.shots[0].assetId,'licensed-photo');
  assert.deepEqual(orderSceneTeachingStates({scenes:[repaired]}).scenes[0], repaired);
});

test('state ordering cannot substitute unsupported narration or silently drop cards', () => {
  assert.throws(() => orderSceneTeachingStates({scenes:[{id:'missing-quote',dialogue:'Use clean tools',teachingVisual:{steps:[{label:'Wrong',value:'Skip sanitation',narrationQuote:'Skip sanitation'}]}}]}), /BLUEPRINT_TEACHING_VISUAL_NOT_SCRIPT_BOUND/);
});

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

