import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const importTS=source=>import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64'));
const router=await importTS(readFileSync(new URL('../../lib/ultimate-course-builder/core/repair-router.ts',import.meta.url),'utf8').replace(/import type[^;]+;/g,''));
const instruction=await importTS(readFileSync(new URL('../../lib/video/instructional-quality-gate.ts',import.meta.url),'utf8').replace(/import type[^;]+;/g,''));
globalThis.__approvedRepetition=instruction.repeatedTeachingSegments;
const recaps=await importTS('import {subjectTeachingRequirements,assertRtiSubjectTeaching} from '+JSON.stringify(new URL('../../lib/ultimate-course-builder/instructional/rti-teaching-policy.mjs',import.meta.url).href)+'; import {reportCourseProgress} from '+JSON.stringify(new URL('../../lib/ultimate-course-builder/worker/progress-watch.mjs',import.meta.url).href)+'; const repeatedTeachingSegments=globalThis.__approvedRepetition; const generateVertexLessonJson=()=>{throw Error("Unexpected generation")}; const contractHash=()=>"test";\n'+readFileSync(new URL('../../lib/ultimate-course-builder/instructional/teaching-recaps.ts',import.meta.url),'utf8').replace(/import[^;]+;/g,''));
delete globalThis.__approvedRepetition;
test('authoring correction receives its rejected source and remains bounded',async()=>{
 const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/adapters/platform-instructional-generator.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replaceAll('export ','');
 const duplicate={segments:[{text:'Inspect all reusable tools before starting the service.'},{text:'Inspect all reusable tools before starting the service.'}]};
 const corrected={segments:[{text:'Inspect all reusable tools before starting the service.'},{text:'Remove any damaged tool and notify the supervisor.'}]};
 const evidence={profile:{authority:'course-defined',instructionalAuthoring:{provider:'google',version:'source-grounded-teaching-1',model:'test'}},competency:{id:'barber-h'}};
 for(const resolves of [true,false]){
  const requests=[];
  const Generator=new Function('lessonInstructionalSources','contractHash','GOOGLE_LESSON_AUTHOR_VERSION','authorGoogleLesson','generateVertexLessonJson','repeatedTeachingSegments','const ULTIMATE_LESSON_CONTRACT_VERSION="test";'+source+';return UltimatePlatformInstructionalGenerator;')(()=>[{id:'source',text:'Authorized material'}],JSON.stringify,'source-grounded-teaching-1',async input=>{requests.push(input);return resolves&&requests.length>1?corrected:duplicate;},()=>{throw Error('Unexpected transport');},instruction.repeatedTeachingSegments);
  const result=new Generator().blueprint(evidence);
  if(resolves)assert.deepEqual(await result,corrected);else await assert.rejects(result,/NARRATION_DUPLICATION/);
  assert.equal(requests.length,resolves?2:3);
  assert.deepEqual(requests[1].repairDirective.previousBlueprint,duplicate);
  assert.equal(requests[1].repairDirective.duplicateSentenceCount,1);
 }
});
test('repeated original instruction returns to authoring before recap generation',async()=>{
 let calls=0;
 const text='Clean all compatible reusable tools before disinfection.';
 await assert.rejects(recaps.addFreshTeachingRecaps({segments:[{id:'one',text},{id:'two',text}]},{},[],async()=>{calls++;return {};}),/NARRATION_DUPLICATION/);
 assert.equal(calls,0);
});
test('repeated generated recap is still rejected with bounded repair attempts',async()=>{
 const text='Clean all compatible reusable tools before disinfection.';let calls=0;
 await assert.rejects(recaps.addFreshTeachingRecaps({segments:[{id:'one',text}]},{},[],async()=>{calls++;return {recaps:[{segmentId:'one',text}]};}),/TEACHING_RECAP_REPEATS_NARRATION/);
 assert.equal(calls,3);
});
test('repair routes rebuild the failed producer instead of repeating a downstream stage',()=>{
 for(const [code,step] of [['TEACHING_RECAP_SOURCE_REVIEW_REQUIRED','learning_objectives'],['NARRATION_DUPLICATION','learning_objectives'],['ULTIMATE_GOOGLE_AUTHORING_JSON_INVALID','learning_objectives'],['APPROVED_AUDIO_PART_GAP_OR_OVERLAP','natural_narration'],['GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED','lesson_film_render'],['APPROVED_RECAP_PICTURE_REQUIRED','lesson_film_render']]){
  assert.equal(router.routeSelectiveRepairs([{code}])[0]?.step,step,code);
 }
 assert.deepEqual(router.routeSelectiveRepairs([{code:'LICENSE_APPROVAL_REQUIRED'}]),[]);
});
