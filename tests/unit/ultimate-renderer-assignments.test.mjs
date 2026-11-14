import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
// Exercise the actual adapter without loading rendering/upload dependencies.
let source = await readFile(new URL('../../lib/ultimate-course-builder/adapters/platform-renderer.ts', import.meta.url), 'utf8');
const mediaDirector = await readFile(new URL('../../lib/video/media-director.ts', import.meta.url), 'utf8');
const minimum = Number(mediaDirector.match(/export const MIN_LESSON_VIDEO_SCENES = (\d+);/)[1]);
source = source.replace("'../../video/render-checkpoint-contract.mjs'", JSON.stringify(new URL('../../lib/video/render-checkpoint-contract.mjs', import.meta.url).href));
source = source.replace(/^import .*bindTeachingPhotoAssignments.*;$/m, '');
source = source.replace(/^import .*storedLicensedMediaMetadata.*;$/m, '');
source = source.replace(/^import .*MIN_LESSON_VIDEO_SCENES.*;$/m, `const MIN_LESSON_VIDEO_SCENES = ${minimum};`);
const { prepareUltimateStoryboardInput, requireResolvedVisualEvidence } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source, { mode: 'transform' })).toString('base64'));
const { directMedia } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(mediaDirector.replace("import 'server-only';", ''), {mode:'transform'})).toString('base64'));
test('expanded accepted storyboard retains every prepared scene through the director', () => {
  const scenes=Array.from({length:15},(_,i)=>({id:`expanded-${i}`,title:`Teaching ${i+1}`,dialogue:`Explain color principle ${i+1}.`}));
  const prepared=prepareUltimateStoryboardInput({artifacts:{
    storyboard:{storyboard:{scenes}},
    visual_assignment:{media:{
      assignments:scenes.map(s=>({sceneId:s.id,assetId:s.id})),
      readyAssets:scenes.map(s=>({id:s.id,public_url:`https://media.example/${s.id}.mp4`,mime_type:'video/mp4',entitlement_id:'licensed'})),
    }},
  }});
  assert.equal(prepared.requiredSceneCount,15);
  assert.equal(directMedia(prepared).scenes.length,15);
  assert.throws(()=>directMedia({...prepared,sceneData:{...prepared.sceneData,scenes:prepared.sceneData.scenes.slice(0,14)}}),/MEDIA_REQUIRED_SCENE_COUNT:14:15/);
});
const uri = value => 'data:text/javascript;base64,' + Buffer.from(value).toString('base64');
const licensed = uri(stripTypeScriptTypes((await readFile(new URL('../../lib/media/licensed-course-media.ts', import.meta.url), 'utf8')).replace("import 'server-only';", '')));
const evidence = uri(stripTypeScriptTypes(await readFile(new URL('../../lib/ultimate-course-builder/instructional/reviewed-scene-evidence.ts', import.meta.url), 'utf8')));
const assignmentsSource = stripTypeScriptTypes(await readFile(new URL('../../lib/ultimate-course-builder/instructional/scene-assignments.ts', import.meta.url), 'utf8')).replace("'@/lib/media/licensed-course-media'", JSON.stringify(licensed)).replace("'./reviewed-scene-evidence'", JSON.stringify(evidence));
const { buildSceneAssignments } = await import(uri(assignmentsSource));
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
test('missing scene mapping cannot substitute an arbitrary licensed clip', () => {
  assert.throws(() => prepareUltimateStoryboardInput({artifacts:{
    storyboard:{storyboard:{scenes:Array.from({length:minimum},(_,i)=>({id:`unmapped-${i}`,dialogue:'Teach this competency'}))}},
    visual_assignment:{media:{assignments:[],readyAssets:[{id:'unrelated',public_url:'https://media.example/stock.mp4',mime_type:'video/mp4',entitlement_id:'license'}]}},
  }}), /ULTIMATE_RENDER_SAVED_ASSIGNMENT_REQUIRED/);
});
test('copies of one stored file request visual-neutral instruction for remaining scenes', () => {
  const scenes = Array.from({ length: minimum }, (_, i) => ({ id: `scene-${i}`, visualRequirement: 'A client consultation', teachingVisual:{kind:'sequence',steps:[{label:'Clarify',value:'Clarify the client request'}]} }));
  const assets = scenes.map((_, i) => ({ id: `copy-${i}`, public_url: `https://media.example/file.mp4?token=${i}`, entitlement_id: 'license', license_evidence_url: 'https://media.example/license', visual_coverage_verified: true, visual_requirements: ['A client consultation'] }));
  const result = buildSceneAssignments(scenes, assets);
  assert.equal(result.assignments.filter(a => a.assignmentMethod !== 'instructional-visual-request').length, 1);
  assert.equal(result.assignments.filter(a => a.assignmentMethod === 'instructional-visual-request').length, minimum - 1);
  assert.deepEqual(result.gaps, []);
});
test('checkpointed graphics cannot replace required practical demonstrations', () => {
  const scenes = Array.from({length:minimum},(_,i)=>({id:`physical-${i}`,stage:'demonstration',dialogue:'Demonstrate the technique'}));
  const input={requiresPracticalEvidence:true,artifacts:{
    storyboard:{storyboard:{scenes}},visual_assignment:{media:{
      assignments:scenes.map(s=>({sceneId:s.id,assetId:`instructional:${s.id}`,assignmentMethod:'instructional-render',generatedInstructionalVisual:true})),
      readyAssets:scenes.map(s=>({id:`instructional:${s.id}`,instructional_scene_id:s.id,public_url:`https://media.example/${s.id}.png`,mime_type:'image/png',owned_instructional_visual:true,provider:'remotion'})),
    }},
  }};
  assert.throws(()=>prepareUltimateStoryboardInput(input), /ULTIMATE_(PRACTICAL_DEMONSTRATION_VIDEO_REQUIRED|RENDER_SAVED_ASSIGNMENT_REQUIRED)/);
});

test('verified saved conceptual graphics remain resolvable by their scene assignments', () => {
  const scenes=Array.from({length:minimum},(_,i)=>({id:`concept-${i}`,stage:'core_concept',dialogue:`Explain concept ${i}`}));
  const input={requiresPracticalEvidence:false,artifacts:{
    storyboard:{storyboard:{scenes}},visual_assignment:{media:{
      assignments:scenes.map(s=>({sceneId:s.id,assetId:`graphic:${s.id}`,assignmentMethod:'instructional-visual',generatedInstructionalVisual:true})),
      readyAssets:scenes.map(s=>({id:`graphic:${s.id}`,instructional_scene_id:s.id,public_url:`https://media.example/${s.id}.png`,mime_type:'image/png',owned_instructional_visual:true,provider:'elevate-instructional',content_sha256:'a'.repeat(64),storage_path:`saved/${s.id}.png`,narration_quote:s.dialogue})),
    }},
  }};
  const prepared=prepareUltimateStoryboardInput(input);
  assert.equal(prepared.sceneData.scenes.length,minimum);
  prepared.sceneData.scenes.forEach((scene,i)=>assert.equal(scene.reference_image_url,`https://media.example/concept-${i}.png`));
  const practical=structuredClone(input);practical.requiresPracticalEvidence=true;
  practical.artifacts.storyboard.storyboard.scenes[0].stage='demonstration';
  assert.throws(()=>prepareUltimateStoryboardInput(practical),/ULTIMATE_PRACTICAL_DEMONSTRATION_VIDEO_REQUIRED/);
  const unbound=structuredClone(input);unbound.artifacts.visual_assignment.media.readyAssets[0].instructional_scene_id='other';
  assert.throws(()=>prepareUltimateStoryboardInput(unbound),/ULTIMATE_RENDER_SAVED_ASSIGNMENT_REQUIRED/);
});
