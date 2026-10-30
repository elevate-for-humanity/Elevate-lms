import test from 'node:test';
import assert from 'node:assert/strict';
import {instructionView,renderInstructionArtifacts} from '../../lib/ultimate-course-builder/core/repair-policy.mjs';
test('saved small-appliance safety instruction retains its role without reauthoring',()=>{
 const scene={id:'scene:seg-07-safety-warning',stage:'guided_practice',title:'guided practice',dialogue:'Manage electrical and ignition risks according to the actual equipment and refrigerant to prevent fire and equipment danger. Stop for an unidentified refrigerant, a damaged connection, incompatible recovery equipment, or an unsafe work area. Do not improvise a connection or a maximum container fill value.'};
 const result=instructionView({scenes:[scene]}).scenes[0];assert.equal(result.sceneType,'safety_warning');assert.equal(result.dialogue,scene.dialogue);
});
test('saved cylinder warning is recognized with its concrete injury hazard and prohibition',()=>{
 const scene={id:'scene:seg-05-concept-containers',stage:'concept_explanation',title:'concept explanation',dialogue:'Safety warning: Cylinder pressure from an unidentified mixture causes a dangerous cylinder pressure hazard, resulting injury, and equipment danger. Never assume a recovery container can accept an unidentified mixture. Never substitute a container merely because its fitting connects. Follow equipment documentation.'};
 assert.equal(instructionView({scenes:[scene]}).scenes[0].sceneType,'safety_warning');
});
test('a safety heading alone or unrelated hazard mention cannot pass as a safety procedure',()=>{
 for(const dialogue of ['This is the safety warning for recovery equipment.','Fire is a risk in a shop.','Safety warning: cylinder pressure can cause injury.']){
  assert.notEqual(instructionView({scenes:[{id:'safety-warning',stage:'concept_explanation',dialogue}]}).scenes[0].sceneType,'safety_warning');
 }
});
test('the renderer receives the safety role from the effective constructed storyboard without changing saved audio',()=>{
 const board={scenes:[{id:'scene:seg-07-safety-warning',stage:'guided_practice',dialogue:'Manage electrical and ignition risks to prevent fire. Stop for an unidentified refrigerant. Do not improvise a connection.'}]};
 const artifacts={scene_construction:{scenes:{storyboard:{storyboard:board}}},storyboard:{storyboard:board},natural_narration:{narration:{segments:[{text:'original-recording',audioUrl:'saved-audio'}]}}};
 const before=structuredClone(artifacts),result=renderInstructionArtifacts(artifacts);
 assert.equal(result.scene_construction.scenes.storyboard.storyboard.scenes[0].sceneType,'safety_warning');
 assert.deepEqual(artifacts,before);assert.deepEqual(result.natural_narration,before.natural_narration);
});
