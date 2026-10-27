import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const root=new URL('../../',import.meta.url);
const sequence=['why_it_matters','activate_prior_knowledge','terminology','concept_explanation','instructor_example','demonstration','guided_practice','knowledge_check','independent_practice','mistake_and_correction','assessment','remediation','recap'];
const source=stripTypeScriptTypes(readFileSync(new URL('lib/ultimate-course-builder/instructional/lesson-blueprint.ts',root),'utf8'),{mode:'transform'}).replace(/^import[^;]+;\n/gm,'').replaceAll('export ','');
const {validateLessonBlueprint}=new Function('ULTIMATE_TEACHING_SEQUENCE','contractHash','validateTeachingVisual',source+';return {validateLessonBlueprint};')(sequence,()=>{throw Error('Hashing is outside this validation test');},()=>{throw Error('This fixture has no authored visuals');});
const ids=['ethics','apprenticeship','licensure'];
const task=(type,objectives,id=type)=>({id,type,prompt:'Apply the supplied scenario and explain your decision.',feedback:'Compare the decision and reasoning with the source-backed worked solution.',objectiveIds:objectives});
function fixture(){
 const question={id:'q',prompt:'Which action meets the stated requirement?',choices:['Document the evidence','Ignore the evidence','Discard the record'],answerIndex:0,explanation:'The record supports the decision.',remediation:'Review the worked example.',objectiveIds:ids};
 return {competencyId:'lesson',objectives:ids.map(id=>({id,text:'Explain '+id,sourceRequirementIds:['course:lesson']})),prerequisites:{checks:[],noneReason:'Introductory lesson.',reviewRequired:false},stages:sequence.map(stage=>({stage,instruction:'Teach the specific lesson content.',objectiveIds:ids})),segments:sequence.map(stage=>({id:stage,stage,text:'Explain the source requirement and apply it to the workplace scenario with a documented reason and a concrete correction.',visualRequirement:'Show the relevant decision and supporting record.',sceneType:'system_diagram',objectiveIds:ids,sourceRequirementIds:['course:lesson']})),activities:[task('guided_practice',['ethics','apprenticeship']),task('independent_practice',['apprenticeship','licensure']),...['knowledge_check','remediation','reassessment'].map(type=>task(type,ids))],mistakes:[{mistake:'Missing evidence',correction:'Supply the required record',reason:'The decision requires evidence',objectiveIds:ids}],assessment:{questions:[question],reassessment:[{...question,id:'r',prompt:'Which different scenario still requires the supporting record?'}],passingScore:80}};
}
const competency={id:'lesson',authorityRequirementIds:[],requiresPracticalEvidence:false};
test('the saved lesson failure is rejected before media work: all activity types do not cover every objective',()=>{
 assert.throws(()=>validateLessonBlueprint(fixture(),competency),/BLUEPRINT_OBJECTIVE_PRACTICE_REQUIRED/);
});
test('specific guided and independent tasks complete the missing objective coverage',()=>{
 const b=fixture();b.activities.push(task('guided_practice',['licensure'],'guided-licensure'),task('independent_practice',['ethics'],'independent-ethics'));
 assert.doesNotThrow(()=>validateLessonBlueprint(b,competency));
});
test('an empty task or unrelated objective mapping cannot satisfy missing practice',()=>{
 const b=fixture();b.activities.push({...task('guided_practice',['licensure'],'empty'),prompt:' '},task('independent_practice',['apprenticeship'],'unrelated'));
 assert.throws(()=>validateLessonBlueprint(b,competency),/BLUEPRINT_OBJECTIVE_PRACTICE_REQUIRED/);
});

const strip=path=>stripTypeScriptTypes(readFileSync(new URL(path,root),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?;\n/gm,'').replaceAll('export ','');
const {auditTraceability}=new Function(strip('lib/ultimate-course-builder/release/traceability.ts')+';return {auditTraceability};')();
const {createProductionHandlers}=new Function('auditTraceability','evaluateAccessibility',strip('lib/ultimate-course-builder/core/production-handlers.ts')+';return {createProductionHandlers};')(auditTraceability,()=>{throw Error('This test does not certify browser accessibility');});
const {routeSelectiveRepairs}=new Function(strip('lib/ultimate-course-builder/core/repair-router.ts')+';return {routeSelectiveRepairs};')();
test('saved release failures identify the missing objective practices and route back to authoring',async()=>{
 const b=fixture();
 const result=await createProductionHandlers({}).credential_release({buildId:'build:lesson',courseId:'a6b0b712-1cf0-475a-ba79-ee2023dea8ec',profile:{competencies:[competency]},passedSteps:new Set(['lesson_film_render','finished_media_qa']),artifacts:{learning_objectives:{objectives:b.objectives},instructor_script:{script:{segments:b.segments}},active_teaching:{activities:b.activities},assessment_alignment:{assessment:b.assessment},lesson_film_render:{render:{videoUrl:'https://media.example/verified.mp4'}},finished_media_qa:{mediaQA:{pass:true}}}});
 assert.equal(result.passed,false);
 assert.equal(result.artifacts.release.blocked,true);
 const failures=result.findings?.filter(f=>f.code==='BLUEPRINT_OBJECTIVE_PRACTICE_REQUIRED');
 assert.equal(failures?.length,2);
 assert.ok(failures.some(f=>f.message.includes('ethics')&&f.message.includes('independent_practice')));
 assert.ok(failures.some(f=>f.message.includes('licensure')&&f.message.includes('guided_practice')));
 assert.deepEqual(routeSelectiveRepairs(failures),[{step:'learning_objectives',codes:['BLUEPRINT_OBJECTIVE_PRACTICE_REQUIRED'],rebuildOnlyThisStage:true}]);
});
