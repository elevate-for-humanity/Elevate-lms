import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const root=new URL('../../',import.meta.url);
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const repair=data(stripTypeScriptTypes(readFileSync(new URL('lib/ultimate-course-builder/core/repair-router.ts',root),'utf8')));
const cursorSource=readFileSync(new URL('lib/ultimate-course-builder/worker/course-cursor.ts',root),'utf8').replace("'../core/repair-router'",JSON.stringify(repair));
const {nextCourseWork}=await import(data(stripTypeScriptTypes(cursorSource)));
const result=(completed,remaining=true)=>({completed,hasRemaining:remaining,nextIndex:1,lessons:[{competencyId:'first'}],findings:[]});
test('failed narration, render or QA cannot advance the lesson cursor',()=>{
 for(const step of ['natural_narration','lesson_film_render','finished_media_qa','learner_runthrough','credential_release']){
  const r={...result(false),findings:[{step,code:'QUALITY_FAILED'}]};
  const next=nextCourseWork({nextCompetencyIndex:0},r);
  assert.equal(next.continue,true);assert.equal(next.payload.nextCompetencyIndex,0);
 }
});
test('passing full lesson advances once',()=>{
 const next=nextCourseWork({nextCompetencyIndex:0},result(true));
 assert.equal(next.payload.nextCompetencyIndex,1);
});
test('external blocker pauses without consuming retries or skipping lesson',()=>{
 const r={...result(false),findings:[{code:'ULTIMATE_GOOGLE_AUTHORING_HTTP_403'}]};
 const next=nextCourseWork({nextCompetencyIndex:0,lessonRepairCounts:{first:1}},r);
 assert.equal(next.continue,false);assert.equal(next.payload.nextCompetencyIndex,0);
 assert.equal(next.payload.lessonRepairCounts.first,1);assert.deepEqual(next.unresolved,['first']);
});
test('exhausted bounded repairs stop on the same lesson',()=>{
 const next=nextCourseWork({nextCompetencyIndex:0,lessonRepairCounts:{first:2}},result(false));
 assert.equal(next.continue,false);assert.equal(next.payload.nextCompetencyIndex,0);assert.deepEqual(next.unresolved,['first']);
});
test('last accepted lesson ends only the complete course pass',()=>assert.equal(nextCourseWork({nextCompetencyIndex:39},result(true,false)).continue,false));
test('empty lesson result cannot become course success',()=>assert.equal(nextCourseWork({}, {completed:true,lessons:[]}).continue,false));

const runnerText=stripTypeScriptTypes(readFileSync(new URL('lib/ultimate-course-builder/core/full-course-runner.ts',root),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replace('export async function','async function');
const makeCourseRunner=assertCompleteLesson=>new Function('ULTIMATE_BUILD_STEPS','assertCompleteLesson',runnerText+'\nreturn runUltimateCourse;')(['standards_lock','lesson_film_render','finished_media_qa','credential_release'],assertCompleteLesson);
function persistence(events){return {updateBuild:async()=>{},createLesson:async({competencyId})=>{events.push('create:'+competencyId);return{id:competencyId};},loadLessonCheckpoint:async()=>({passedSteps:[],artifacts:{},findings:[]}),recordStep:async()=>{},recordFinding:async()=>{},finishLesson:async row=>events.push('finish:'+row.status)};}
test('full-course execution stops before creating a second lesson when final acceptance fails',async()=>{
 const events=[],run=makeCourseRunner(()=>{throw Error('MISSING_BROWSER_ACCEPTANCE');});
 const out=await run({buildId:'b',courseId:'c',profile:{competencies:[{id:'first'},{id:'second'}]}},()=>({run:async ctx=>({...ctx,findings:[]})}),persistence(events));
 assert.equal(out.completed,false);assert.equal(out.lessons.length,1);assert.deepEqual(events,['create:first','finish:built_with_findings']);
});
test('a passed complete lesson is finished before the next lesson starts',async()=>{
 const events=[],run=makeCourseRunner(()=>events.push('accept'));
 const out=await run({buildId:'b',courseId:'c',profile:{competencies:[{id:'first'},{id:'second'}]}},()=>({run:async ctx=>({...ctx,findings:[]})}),persistence(events));
 assert.equal(out.completed,true);assert.deepEqual(events,['create:first','accept','finish:built','create:second','accept','finish:built']);
});
test('materialization does not author future lessons or change their planned IDs',async()=>{
 const text=stripTypeScriptTypes(readFileSync(new URL('lib/ultimate-course-builder/worker/materialize-draft.ts',root),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replace('export async function','async function');
 let drafts=0;
 const materialize=new Function('validateLessonBlueprint','UltimatePlatformInstructionalGenerator',text+'\nreturn materializeUltimateDraft;')(()=>{},class{async blueprint(){drafts++;throw Error('future author must not run');}});
 const q={select(){return this;},eq(){return this;},then(resolve){resolve({data:[{id:'planned-first',slug:'first'}],error:null});}};
 const profile={competencies:[{id:'first'},{id:'second'}],canonicalLessonIds:{first:'planned-first',second:'planned-second'}};
 const output=await materialize({from:()=>q},'new-course',profile,['first']);
 assert.equal(drafts,0);assert.deepEqual(output.canonicalLessonIds,profile.canonicalLessonIds);
});
