import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/persistence/supabase-persistence.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import .*;\n/gm,'').replace('export class ','class ');
const Persistence=new Function('currentEvidence','ULTIMATE_BUILD_STEPS','MIN_LESSON_VIDEO_SCENES',source+';return UltimateSupabasePersistence;')(value=>value?.certified===true,['standards_lock','synchronization','lesson_film_render','finished_media_qa'],1);
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
