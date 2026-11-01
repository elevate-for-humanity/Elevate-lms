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

test('an audio mismatch repairs the storyboard only when saved narration matches the approved script', async () => {
 const script={certified:true,script:{segments:[{text:'Approved instruction'}]}};
 const narration={certified:true,narration:{segments:[{text:'Approved instruction'}]}};
 const board={certified:true,storyboard:{scenes:[{dialogue:'Divergent instruction'}]}};
 const directive={failedStep:'lesson_film_render',target:'natural_narration',requirements:[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'ULTIMATE_VIDEO_RENDER_FAILED:ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED'}]};
 const artifacts={instructor_script:script,natural_narration:narration,storyboard:board,__repairState:{status:'producer-validated',directive}};
 const rows=[['instructor_script',script],['natural_narration',narration],['storyboard',board]].map(([step,artifacts])=>({step,state:'passed',artifacts}));
 const db={from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:{artifacts,findings:[]}}),then:resolve=>resolve({data:rows})};return q;}};
 const result=await new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'});
 assert.equal(result.artifacts.__repairState.directive.target,'storyboard');
 assert.equal(result.artifacts.__repairState.status,'diagnosed');
 assert.equal(result.artifacts.natural_narration,narration);
 assert.equal(result.artifacts.__repairState.directive.previous,board);
 narration.narration.segments[0].text='Stale recording';
 assert.equal((await new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'})).artifacts.__repairState.directive.target,'natural_narration');
 narration.narration.segments[0].text='Approved instruction';script.certified=false;
 assert.equal((await new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'})).artifacts.__repairState.directive.target,'natural_narration');
});
test('storyboard audio repair restores the approved blueprint without independent re-authoring',async()=>{
 const generatorSource=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/adapters/platform-instructional-generator.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replaceAll('export ','');
 const Generator=new Function('sceneRole','ULTIMATE_LESSON_CONTRACT_VERSION','produceTeachingVisual',generatorSource+';return UltimatePlatformInstructionalGenerator;')((stage,fallback)=>fallback,'test',()=>({kind:'sequence',steps:[]}));
 const generator=new Generator();let requested;
 generator.blueprint=async input=>{requested=input;return {segments:[{id:'approved',stage:'concept_explanation',text:'Approved instruction',recapText:'Fresh recap',objectiveIds:['o'],sourceRequirementIds:['s'],visualRequirement:'Assigned visual',sceneType:'mental_model'}]};};
 const directive={target:'storyboard',requirements:[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'ULTIMATE_VIDEO_RENDER_FAILED:ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED'}]};
 const board=await generator.storyboard({repairDirective:directive,prior:{saved:'canonical'}});
 assert.equal(requested.repairDirective,undefined);assert.equal(requested.prior.saved,'canonical');
 assert.equal(board.scenes[0].dialogue,'Approved instruction\n\nFresh recap');
 await generator.storyboard({repairDirective:{...directive,requirements:[{code:'OTHER_FAILURE',message:'genuine source defect'}]}});
 assert.equal(requested.repairDirective.requirements[0].code,'OTHER_FAILURE');
});

test('repeated Client Consultation question gets a unique exact source quotation without changing speech',async()=>{
 const generatorSource=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/adapters/platform-instructional-generator.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replaceAll('export ','');
 const clarify=new Function(generatorSource+';return uniqueSourceQuote;')();
 const {quoteStartSeconds}=await import('../../lib/ultimate-course-builder/instructional/picture-timeline.mjs');
 const text="Which question best gathers detailed information: Do you use gel or How do you typically style your hair? Choosing How do you typically style your hair invites the client to describe tools.";
 const quote='How do you typically style your hair?';
 const cues=text.toLowerCase().match(/[a-z0-9]+/g).map((text,index)=>({text,startSeconds:index/2}));
 assert.throws(()=>quoteStartSeconds(quote,cues),/NOT_ALIGNED/);
 const clarified=clarify(quote,text);
 assert.ok(text.includes(clarified));
 assert.ok(clarified.toLowerCase().includes('how do you typically style your hair'));
 assert.ok(Number.isFinite(quoteStartSeconds(clarified,cues)));
 assert.equal(clarify('unsupported invented words',text),'unsupported invented words');
 assert.throws(()=>quoteStartSeconds(clarify('unsupported invented words',text),cues),/NOT_ALIGNED/);
 assert.equal(clarify('Choosing How do you typically style your hair',text),'Choosing How do you typically style your hair');
});

test('a current saved render finding reconstructs a missing storyboard repair without regenerating approved audio', async () => {
 function fixture() {
  const script={certified:true,script:{segments:[{text:'Approved instruction'}]}};
  const narration={certified:true,narration:{segments:[{text:'Approved instruction'}]}};
  const board={certified:true,storyboard:{scenes:[{dialogue:'Divergent instruction'}]}};
  const artifacts={instructor_script:script,natural_narration:narration,storyboard:board};
  const findings=[{step:'lesson_film_render',severity:'error',code:'ULTIMATE_VIDEO_RENDER_FAILED',message:'ULTIMATE_VIDEO_RENDER_FAILED:ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED'}];
  const rows=[['instructor_script',script],['natural_narration',narration],['storyboard',board]].map(([step,artifacts])=>({step,state:'passed',completed_at:'2026-11-01T01:00:00Z',artifacts}));
  rows.push({step:'lesson_film_render',state:'failed',completed_at:'2026-11-01T01:01:00Z',artifacts:{}});
  const db={from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:{artifacts,findings}}),then:resolve=>resolve({data:rows})};return q;}};
  return {script,narration,board,artifacts,findings,rows,load:()=>new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'})};
 }
 const f=fixture(),saved=await f.load();
 assert.equal(saved.artifacts.__repairState.directive.target,'storyboard');
 assert.equal(saved.artifacts.__repairState.status,'diagnosed');
 assert.equal(saved.artifacts.__repairState.directive.previous,f.board);
 assert.equal(saved.artifacts.natural_narration,f.narration);
 assert.equal(f.artifacts.__repairState,undefined,'loading diagnosis must not mutate the database snapshot');
 assert.ok(!saved.passedSteps.includes('lesson_film_render'));
 assert.ok(!saved.passedSteps.includes('finished_media_qa'));
 for(const mutate of [
  f=>{f.script.certified=false;},
  f=>{f.narration.narration.segments[0].text='Different recording';},
  f=>{f.rows[0].completed_at='2026-11-01T01:02:00Z';},
  f=>{f.rows[0].completed_at=null;},
  f=>{f.rows.pop();},
  f=>{f.findings.push({step:'finished_media_qa',severity:'error',code:'OTHER',message:'Other defect'});},
  f=>{f.board.storyboard.scenes[0].dialogue='Approved instruction';},
 ]) {
  const rejected=fixture();mutate(rejected);
  assert.equal((await rejected.load()).artifacts.__repairState,undefined);
 }
});
