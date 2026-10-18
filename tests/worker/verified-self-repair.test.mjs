import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';import {repairDirective,instructionView} from '../../lib/ultimate-course-builder/core/repair-policy.mjs';
const src=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/core/build-runner.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replaceAll('export ','');
function runner(handlers,validation=()=>[],options={}){
 return new Function('repairDirective','artifactPayload','contractHash','currentEvidence','stepInputHash','stepInputHashes','validateStepOutput','practicalVisualFailures','ULTIMATE_LESSON_CONTRACT_VERSION','MAX_TARGETED_REPAIRS','isDurableExternalBlocker','routeSelectiveRepairs','ULTIMATE_BUILD_STEPS',src+'\nreturn UltimateBuildRunner;')(repairDirective,x=>{const {contractEvidence,...rest}=x;return rest;},JSON.stringify,options.currentEvidence??(()=>false),()=>'',()=>[''],validation,()=>[],'test',2,f=>/^(MEDIA_LICENSE_REQUIRED|LICENSE_APPROVAL_REQUIRED|PAID_INFERENCE_AUTHORIZATION_REQUIRED)$/.test(f.code),options.route??(findings=>findings[0]?.code==='INSTRUCTIONAL_QUALITY_FAILED'?[{step:'learning_objectives'}]:[]),['learning_objectives','lesson_film_render','finished_media_qa']);
}
test('repair carries exact failed requirement, changes producer and validates before new render',async()=>{
 let renders=0,authors=0;const journal=[];const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{},findings:[],passedSteps:new Set(),persistArtifact:async x=>journal.push(x)};
 const R=runner();const r=new R({learning_objectives:async c=>{authors++;return {artifacts:{blueprint:{title:c.repairDirective?'Welcome to Cosmetology Apprenticeship':'wrong'}}};},lesson_film_render:async c=>{
 if(c.artifacts.learning_objectives.blueprint.title==='wrong')return {passed:false,findings:[{code:'INSTRUCTIONAL_QUALITY_FAILED',severity:'error',message:'narration must teach apprenticeship'}]};
 renders++;return {artifacts:{video:'new video'}};
 },finished_media_qa:async()=>({artifacts:{inspection:'actual evidence'}})});
 await r.run(ctx);assert.equal(authors,2);assert.equal(renders,1);assert.equal(ctx.artifacts.__repairState.status,'producer-validated');
 assert.equal(journal.find(x=>x.artifacts?.repair?.directive)?.artifacts.repair.directive.requirements[0].message,'narration must teach apprenticeship');
});
test('unchanged repair output is evaluated by independent QA instead of a duplicate-producer gate',async()=>{
 let authorCalls=0;const journal=[];
 const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{},findings:[],passedSteps:new Set(),persistArtifact:async event=>journal.push(event)};
 const R=runner();
 await new R({learning_objectives:async()=>{authorCalls++;return {artifacts:{blueprint:{title:'same'}}};},lesson_film_render:async()=>({passed:false,findings:[{code:'INSTRUCTIONAL_QUALITY_FAILED',severity:'error',message:'missing recap'}]})}).run(ctx);
 assert.equal(authorCalls,3); // initial attempt plus two bounded selective repairs
 assert.equal(ctx.findings.at(-1).code,'INSTRUCTIONAL_QUALITY_FAILED');
 assert.equal(journal.filter(event=>event.step==='learning_objectives').length,3);
 assert.equal(ctx.artifacts.learning_objectives.blueprint.title,'same');
 assert.equal(ctx.artifacts.learning_objectives.contractEvidence.passed,true);
});
test('content failure does not invent missing encoded inspection evidence',async()=>{
 let checked=0;const R=runner({},()=>{checked++;return []});const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{},findings:[],passedSteps:new Set()};
 await new R({learning_objectives:async()=>({passed:false,findings:[{code:'REPAIR_PRODUCER_UNCHANGED',severity:'error',message:'unchanged'}]})}).run(ctx);assert.equal(checked,0);
});
test('recap and application scene identity derives from authored stage without inventing content',()=>{
 const view=instructionView({scenes:[{stage:'recap',sceneType:'worked_example',text:'Fresh recap content'},{stage:'knowledge_check',sceneType:'worked_example',text:'What would you do for this client?'}]});
 assert.equal(view.scenes[0].sceneType,'memory_recap');assert.equal(view.scenes[1].sceneType,'knowledge_check');assert.equal(view.scenes[0].dialogue,'Fresh recap content');assert.equal(view.scenes[0].referenceImageUrl,undefined);
});

test('inspection retry preserves the accepted film and resumes only the failed inspection',async()=>{
 let inspections=0;
 const R=runner({},()=>[],{currentEvidence:()=>true,route:()=>[{step:'finished_media_qa'}]});
 const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{learning_objectives:{blueprint:'saved'},lesson_film_render:{video:'saved.mp4'}},findings:[],passedSteps:new Set(['learning_objectives','lesson_film_render'])};
 await new R({learning_objectives:()=>assert.fail('must preserve source'),lesson_film_render:()=>assert.fail('must not rerender'),finished_media_qa:async()=>{
  inspections++;return inspections===1?{passed:false,findings:[{code:'MEDIA_INSPECTION_TEMPORARY',severity:'error',message:'transcript read timeout'}]}:{artifacts:{mediaQA:{inspection:'measured evidence'}}};
 }}).run(ctx);
 assert.equal(inspections,2);assert.equal(ctx.artifacts.lesson_film_render.video,'saved.mp4');assert.equal(ctx.passedSteps.has('finished_media_qa'),true);
});
