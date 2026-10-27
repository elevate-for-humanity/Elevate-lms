import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/core/production-handlers.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replace('export function','function');
const createHandlers=new Function('repeatedTeachingSegments','instructionView','instructionalQualityFailures',source+'\nreturn createProductionHandlers;')(()=>0,x=>x,()=>({failures:[]}));
function fixture(canonicalLessonIds){
 const scenes=Array.from({length:8},(_,i)=>({id:'scene-'+i}));
 return {buildId:'build:reference-competency',profile:{sourcePolicy:'frozen-reference-v1',competencies:[{id:'reference-competency',type:'knowledge'}],canonicalLessonIds},artifacts:{
  storyboard:{storyboard:{scenes}},visual_assignment:{media:{assignments:scenes.map(s=>({sceneId:s.id,assetId:'instructional:'+s.id,relevanceReason:'Lesson-specific illustration',licenseEvidenceUrl:'https://licenses.example/'+s.id})),readyAssets:scenes.map(s=>({id:'instructional:'+s.id,entitlement_id:'entitlement:'+s.id,public_url:'https://media.example/'+s.id+'.mp4'}))}},
  natural_narration:{narration:{segments:[{text:'Current speech'}]}},
  synchronization:{timeline:{durationSeconds:8,segments:scenes.map((s,i)=>({startSeconds:i,endSeconds:i+1}))}},
  instructor_script:{script:{script:'Current speech'}}
 }};
}
test('new course renders under its new canonical lesson ID, never the reference lesson ID',async()=>{
 let received;
 const handlers=createHandlers({renderer:{render:async input=>{received=input;return {videoUrl:'private-new-film'};}}});
 await handlers.lesson_film_render(fixture({'reference-competency':'fresh-canonical-id'}));
 assert.equal(received.lessonId,'fresh-canonical-id');
});
test('new course refuses to fall back to an old reference ID',async()=>{
 let called=false;const handlers=createHandlers({renderer:{render:async()=>{called=true;}}});
 await assert.rejects(handlers.lesson_film_render(fixture({})),/FRESH_CANONICAL_LESSON_ID_REQUIRED/);
 assert.equal(called,false);
});

test('identity checks do not bypass missing visual-license evidence',async()=>{
 const ctx=fixture({'reference-competency':'fresh-canonical-id'});delete ctx.artifacts.visual_assignment.media.assignments[0].licenseEvidenceUrl;
 const handlers=createHandlers({renderer:{render:()=>assert.fail('unlicensed render must not run')}});
 await assert.rejects(handlers.lesson_film_render(ctx),/ULTIMATE_VISUAL_LICENSE_RELEVANCE_REQUIRED/);
});
