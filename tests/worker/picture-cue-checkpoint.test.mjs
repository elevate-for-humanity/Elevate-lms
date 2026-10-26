import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/persistence/supabase-persistence.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import .*;\n/gm,'').replace('export class ','class ');
const Persistence=new Function('currentEvidence','ULTIMATE_BUILD_STEPS','MIN_LESSON_VIDEO_SCENES',source+';return UltimateSupabasePersistence;')(value=>value?.certified===true,['standards_lock','storyboard','visual_assignment','synchronization','lesson_film_render','finished_media_qa'],1);
async function checkpoint({valid=true,failedStep='lesson_film_render',message='ULTIMATE_VIDEO_RENDER_FAILED:PICTURE_CUE_NOT_ALIGNED_TO_SPEECH',extra=[]}={}){
 const previous={certified:valid,timeline:{durationSeconds:30}};
 const artifacts={visual_assignment:{certified:true,media:{saved:true}},__repairState:{status:'diagnosed',directive:{failedStep,target:'synchronization',previous,requirements:[{code:'ULTIMATE_VIDEO_RENDER_FAILED',message},...extra]}}};
 const steps=[{step:'standards_lock',state:'passed',artifacts:{certified:true}},{step:'synchronization',state:'failed',artifacts:{}}];
 const db={from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:{artifacts,findings:[]}}),then:resolve=>resolve({data:steps})};return q;}};
 return {result:await new Persistence(db).loadLessonCheckpoint({lessonBuildId:'lesson'}),previous};
}
test('legacy picture cue retry reuses its certified timeline and requires a new render and inspection',async()=>{
 const {result,previous}=await checkpoint();
 assert.equal(result.artifacts.synchronization,previous);
 assert.ok(result.passedSteps.includes('synchronization'));
 assert.deepEqual(result.recoveredSteps,['synchronization']);
 assert.ok(!result.passedSteps.includes('lesson_film_render'));
 assert.ok(!result.passedSteps.includes('finished_media_qa'));
 assert.equal(result.artifacts.__repairState.status,'producer-validated');
 assert.equal(result.artifacts.__repairState.directive.target,'lesson_film_render');
});
test('unverified timelines, genuine sync defects and mixed requirements are never recovered as certified',async()=>{
 for(const options of [{valid:false},{failedStep:'synchronization'},{message:'CAPTION_SYNC_FAILED'},{extra:[{code:'AUDIO_SYNC_FAILED',message:'wrong timing'}]}]){
  const {result}=await checkpoint(options);
  assert.ok(!result.passedSteps.includes('synchronization'));
  assert.deepEqual(result.recoveredSteps,[]);
  assert.equal(result.artifacts.__repairState.directive.target,'synchronization');
 }
});
