import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {instructionView} from '../../lib/ultimate-course-builder/core/repair-policy.mjs';
import {measuredNarrationRepair} from '../../lib/ultimate-course-builder/instructional/narration-checkpoint-repair.mjs';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/persistence/supabase-persistence.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import .*;\n/gm,'').replace('export class ','class ');
const Persistence=new Function('instructionView','currentEvidence','ULTIMATE_BUILD_STEPS','MIN_LESSON_VIDEO_SCENES','measuredNarrationRepair',source+';return UltimateSupabasePersistence;')(instructionView,value=>value?.certified===true,['standards_lock','synchronization','lesson_film_render','finished_media_qa'],1,measuredNarrationRepair);
test('failed QA row retains measured repair when the lesson snapshot no longer contains QA',async()=>{
 const narration={certified:true,narration:{rate:'0%'}};
 const qa={source:'delivered-mp4',mediaSha256:'actual-film',pass:false,failures:['PACE_OUT_OF_RANGE'],metrics:{wordsPerMinute:{value:108,measured:true}}};
 const rows=[{step:'natural_narration',state:'passed',completed_at:'2026-10-28T01:57:00Z',artifacts:narration},{step:'narration_qa',state:'failed',completed_at:'2026-10-28T02:39:00Z',artifacts:{narrationQA:qa}}];
 const db={from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:{artifacts:{},findings:[]}}),then:resolve=>resolve({data:rows})};return q;}};
 const saved=await new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'});
 assert.equal(saved.artifacts.__repairState.directive.requirements[0].code,'PACE_OUT_OF_RANGE');
 assert.equal(saved.artifacts.__repairState.directive.previous,narration);
 assert.equal(saved.artifacts.__repairState.status,'diagnosed');
 rows[0].completed_at='2026-10-28T02:40:00Z';
 const repaired=await new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'});
 assert.equal(repaired.artifacts.__repairState,undefined);
});
async function checkpoint({code='MEDIA_SCENE_NARRATION_MISMATCH',valid=true,film=true}={}){
 const previous={certified:valid,timeline:{durationSeconds:30}};
 const render={certified:true,render:{layoutVersion:4,videoUrl:'saved-film'}};
 const artifacts={__repairState:{attempts:[{target:'synchronization'}],directive:{failedStep:'finished_media_qa',target:'synchronization',previous,requirements:[{code}]}}};
 const steps=[{step:'standards_lock',state:'passed',artifacts:{certified:true}},...(film?[{step:'lesson_film_render',state:'passed',artifacts:render}]:[])];
 const db={from:table=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:{artifacts,findings:[]}}),then:resolve=>resolve({data:steps})};return q;}};
 return new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'});
}
test('legacy ASR timeline misroute recovers certified media for independent inspection without approving it',async()=>{
 const result=await checkpoint();assert.ok(result.passedSteps.includes('synchronization'));
 assert.deepEqual(result.recoveredSteps,['synchronization']);assert.equal(result.artifacts.lesson_film_render.render.videoUrl,'saved-film');
 assert.ok(!result.passedSteps.includes('finished_media_qa'));
 assert.equal(result.artifacts.__repairState.directive.target,'finished_media_qa');assert.equal(result.artifacts.__repairState.attempts.length,1);
});
test('missing certificates, missing saved film and real timing failures retain their original repair',async()=>{
 for(const options of [{valid:false},{film:false},{code:'CAPTION_SYNC_FAILED'}]){
  const result=await checkpoint(options);assert.ok(!result.passedSteps.includes('synchronization'));assert.deepEqual(result.recoveredSteps,[]);
  assert.equal(result.artifacts.__repairState.directive.target,'synchronization');
 }
});

test('repaired safety classifier retries the render gate without re-authoring certified objectives', async () => {
 const previous = {certified:true, contractEvidence:{outputHash:'saved-source'}, objectives:[{id:'safety'}]};
 const board = {certified:true, storyboard:{scenes:[{id:'demonstration', stage:'demonstration',
  dialogue:'Prepare clean supplies, appropriate gloves and protective draping. Stop for discomfort or an unsafe response and follow product safety directions.'}]}};
 const film = {render:{videoUrl:'preserved-render'}};
 const requirements = [{code:'INSTRUCTIONAL_QUALITY_FAILED',message:'practical beauty instruction must include an explicit safety or sanitation scene'}];
 const directive = {failedStep:'lesson_film_render',target:'learning_objectives',previous,requirements};
 const artifacts = {learning_objectives:previous,storyboard:board,lesson_film_render:film,__repairState:{status:'diagnosed',directive,attempts:[{reason:'real failure'}]}};
 const rows = [{step:'learning_objectives',state:'passed',artifacts:previous},{step:'storyboard',state:'passed',artifacts:board}];
 const db = {from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:{artifacts,findings:[]}}),then:resolve=>resolve({data:rows})};return q;}};
 const result = await new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'});
 assert.equal(result.artifacts.learning_objectives,previous);
 assert.equal(result.artifacts.lesson_film_render,film);
 assert.equal(result.artifacts.__repairState.directive.target,'lesson_film_render');
 assert.equal(result.artifacts.__repairState.directive.previousTarget,'learning_objectives');
 assert.equal(result.artifacts.__repairState.status,'diagnosed');
 assert.equal(result.artifacts.__repairState.attempts.length,1);
 assert.ok(!result.passedSteps.includes('lesson_film_render'));
 assert.ok(!result.passedSteps.includes('finished_media_qa'));
 assert.equal(result.artifacts.__repairState.directive.requirements,requirements);
 // Incidental protective words, mixed failures, stale or missing evidence must
 // retain the original producer repair, never manufacture safety acceptance.
 for (const change of [
  ()=>{board.storyboard.scenes[0].dialogue='Wear gloves while comparing colors.';},
  ()=>{requirements.push({code:'OTHER_DEFECT',message:'missing teaching'});},
  ()=>{previous.certified=false;},
  ()=>{board.certified=false;},
  ()=>{rows.splice(0,1);},
 ]) {
  const oldDialogue=board.storyboard.scenes[0].dialogue, oldRows=[...rows];
  change();
  const rejected=await new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'});
  assert.equal(rejected.artifacts.__repairState.directive.target,'learning_objectives');
  board.storyboard.scenes[0].dialogue=oldDialogue; previous.certified=true; board.certified=true;
  requirements.splice(1);rows.splice(0,rows.length,...oldRows);
 }
});
