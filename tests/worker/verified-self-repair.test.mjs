import { describeWorkerError } from '../../lib/ultimate-course-builder/core/worker-error.mjs';
test('refrigerant hazard warnings retain safety classification without salon vocabulary',()=>{
 const dialogue='SAFETY WARNING: Pressurized refrigerants create cylinder rupture, frostbite, and chemical exposure hazards. Never assume a recovery container can accept an unidentified mixture. Before a recovery task, identify the appliance and refrigerant.';
 const scene=instructionView({scenes:[{id:'concept',stage:'concept_explanation',sceneType:'mental_model',dialogue}]}).scenes[0];
 assert.equal(scene.sceneType,'safety_warning');assert.equal(scene.dialogue,dialogue);
 for(const text of ['SAFETY WARNING: Learn about refrigerant pressure.','Cylinder rupture and frostbite are hazards.','SAFETY WARNING: Refrigerant cylinder rupture is dangerous.'])
  assert.notEqual(instructionView({scenes:[{id:'concept',stage:'concept_explanation',dialogue:text}]}).scenes[0].sceneType,'safety_warning');
});
import { runInNewContext } from 'node:vm';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';import {repairDirective,instructionView} from '../../lib/ultimate-course-builder/core/repair-policy.mjs';
const src=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/core/build-runner.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replaceAll('export ','');
const reviewSource=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/core/lesson-contract.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?;\n/gm,'').replaceAll('export ','');
const {nonblockingManualReview,optionalManualReviewStage}=new Function(reviewSource+';return {nonblockingManualReview,optionalManualReviewStage};')();
function runner(handlers,validation=()=>[],options={}){
 return new Function('describeWorkerError','repairDirective','artifactPayload','contractHash','currentEvidence','stepInputHash','stepInputHashes','validateStepOutput','practicalVisualFailures','ULTIMATE_LESSON_CONTRACT_VERSION','MAX_TARGETED_REPAIRS','isDurableExternalBlocker','routeSelectiveRepairs','ULTIMATE_BUILD_STEPS','nonblockingManualReview','optionalManualReviewStage',src+'\nreturn UltimateBuildRunner;')(describeWorkerError,repairDirective,x=>{const {contractEvidence,...rest}=x;return rest;},JSON.stringify,options.currentEvidence??(()=>false),()=>'',()=>[''],validation,()=>[],'test',2,f=>/^(MEDIA_LICENSE_REQUIRED|LICENSE_APPROVAL_REQUIRED|PAID_INFERENCE_AUTHORIZATION_REQUIRED)$/.test(f.code),options.route??(findings=>findings[0]?.code==='INSTRUCTIONAL_QUALITY_FAILED'?[{step:'learning_objectives'}]:[]),['learning_objectives','lesson_film_render','finished_media_qa'],nonblockingManualReview,optionalManualReviewStage);
}
test('role boundary retains measured upstream repair feedback for its producer',async()=>{
 const directive={target:'learning_objectives',failedStep:'finished_media_qa',requirements:[{code:'MEASURED_FAILURE',message:'real measured evidence'}],previous:{saved:true}};
 const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},startAtStep:'finished_media_qa',artifacts:{__repairState:{status:'diagnosed',directive}},findings:[],passedSteps:new Set()};
 const R=runner();await new R({}).run(ctx);
 assert.equal(ctx.artifacts.__repairState.directive,directive);
 assert.equal(ctx.artifacts.__repairState.directive.requirements[0].message,'real measured evidence');
 assert.equal(ctx.findings[0].code,'AUTOPILOT_UPSTREAM_CHECKPOINT_REQUIRED');
});
test('repair carries exact failed requirement, changes producer and validates before new render',async()=>{
 let renders=0,authors=0;const journal=[];const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{},findings:[],passedSteps:new Set(),persistArtifact:async x=>journal.push(x)};
 const R=runner();const r=new R({learning_objectives:async c=>{authors++;return {artifacts:{blueprint:{title:c.repairDirective?'Welcome to Cosmetology Apprenticeship':'wrong'}}};},lesson_film_render:async c=>{
 if(c.artifacts.learning_objectives.blueprint.title==='wrong')return {passed:false,findings:[{code:'INSTRUCTIONAL_QUALITY_FAILED',severity:'error',message:'narration must teach apprenticeship'}]};
 renders++;return {artifacts:{video:'new video'}};
 },finished_media_qa:async()=>({artifacts:{inspection:'actual evidence'}})});
 await r.run(ctx);assert.equal(authors,2);assert.equal(renders,1);assert.equal(ctx.artifacts.__repairState.status,'producer-validated');
 assert.equal(journal.find(x=>x.artifacts?.repair?.directive)?.artifacts.repair.directive.requirements[0].message,'narration must teach apprenticeship');
});

test('checkpoint save failure preserves the prior payload and cannot advance to rendering',async()=>{
 const source={blueprint:{title:'saved source'}},film={video:'saved external movie'};
 let saves=0;
 const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{learning_objectives:source,lesson_film_render:film,__repairState:{status:'diagnosed',directive:{target:'learning_objectives',previous:source}}},findings:[],passedSteps:new Set(['learning_objectives','lesson_film_render']),persistArtifact:async e=>{if(e.step==='learning_objectives'){saves++;throw Error('CHECKPOINT_SAVE_UNAVAILABLE: database rejected the write');}}};
 const R=runner({},()=>[],{currentEvidence:()=>true});
 await new R({learning_objectives:async()=>({artifacts:{blueprint:{title:'new validated source'}}}),lesson_film_render:()=>assert.fail('must not render after failed checkpoint save')}).run(ctx);
 assert.equal(saves,1);
 assert.deepEqual(ctx.artifacts.learning_objectives,source);
 assert.deepEqual(ctx.artifacts.lesson_film_render,film);
 assert.equal(ctx.passedSteps.has('learning_objectives'),false);
 assert.equal(ctx.findings.at(-1).code,'CHECKPOINT_SAVE_UNAVAILABLE');
});
test('a later failed render retains the newly saved source and the old movie as uncertified recovery data',async()=>{
 const source={blueprint:{title:'saved source'}},film={video:'saved external movie'};
 const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{learning_objectives:source,lesson_film_render:film,__repairState:{status:'diagnosed',directive:{target:'learning_objectives',previous:source}}},findings:[],passedSteps:new Set(['learning_objectives','lesson_film_render'])};
 const R=runner({},()=>[],{currentEvidence:()=>true});
 await new R({learning_objectives:async()=>({artifacts:{blueprint:{title:'new validated source'}}}),lesson_film_render:async()=>{throw Error('MEDIA_LICENSE_REQUIRED: render blocked before encoding');}}).run(ctx);
 assert.equal(ctx.artifacts.learning_objectives.blueprint.title,'new validated source');
 assert.equal(ctx.passedSteps.has('learning_objectives'),true);
 assert.deepEqual(ctx.artifacts.lesson_film_render,film);
 assert.equal(ctx.passedSteps.has('lesson_film_render'),false);
 assert.equal(ctx.artifacts.selective_repair.repair.blockedAt,'lesson_film_render');
});


test('a thrown repair failure retains source and movie checkpoints without recertifying them',async()=>{
 const source={blueprint:{title:'saved source'}},film={video:'saved external movie'};
 const steps=[];
 const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{learning_objectives:source,lesson_film_render:film,__repairState:{status:'diagnosed',directive:{target:'learning_objectives',previous:source}}},findings:[],passedSteps:new Set(['learning_objectives','lesson_film_render']),persistStep:async e=>steps.push(e)};
 const R=runner({},()=>[],{currentEvidence:()=>true});
 await new R({learning_objectives:async()=>{throw Error('MEDIA_LICENSE_REQUIRED: actual entitlement unavailable');},lesson_film_render:()=>assert.fail('must not render after failed repair')}).run(ctx);
 assert.deepEqual(ctx.artifacts.learning_objectives,source);
 assert.deepEqual(ctx.artifacts.lesson_film_render,film);
 assert.equal(ctx.passedSteps.has('learning_objectives'),false);
 assert.equal(ctx.passedSteps.has('lesson_film_render'),false);
 assert.deepEqual(steps.find(e=>e.step==='learning_objectives'&&e.state==='failed').artifacts,source);
 assert.equal(ctx.artifacts.selective_repair.repair.unresolved,1);
});
test('a failed repair output cannot replace the previous checkpoint with a new artifact version',async()=>{
 const source={blueprint:{title:'saved source'}},film={video:'saved external movie'};
 const saved=[];
 const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{learning_objectives:source,lesson_film_render:film,__repairState:{status:'diagnosed',directive:{target:'learning_objectives',previous:source}}},findings:[],passedSteps:new Set(['learning_objectives','lesson_film_render']),persistArtifact:async e=>saved.push(e)};
 const R=runner({},()=>[],{currentEvidence:()=>true});
 await new R({learning_objectives:async()=>({passed:false,artifacts:{blueprint:{title:'invalid replacement'}},findings:[{code:'MEDIA_LICENSE_REQUIRED',severity:'error',message:'Actual entitlement unavailable'}]})}).run(ctx);
 assert.deepEqual(ctx.artifacts.learning_objectives,source);
 assert.deepEqual(ctx.artifacts.lesson_film_render,film);
 assert.equal(saved.some(e=>e.step==='learning_objectives'),false);
 assert.equal(ctx.passedSteps.has('lesson_film_render'),false);
});

test('unchanged repaired output is independently rejected without a redundant producer rerun',async()=>{
 let authorCalls=0;const journal=[];
 const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{},findings:[],passedSteps:new Set(),persistArtifact:async event=>journal.push(event)};
 const R=runner();
 await new R({learning_objectives:async()=>{authorCalls++;return {artifacts:{blueprint:{title:'same'}}};},lesson_film_render:async()=>({passed:false,findings:[{code:'INSTRUCTIONAL_QUALITY_FAILED',severity:'error',message:'missing recap'}]})}).run(ctx);
 assert.equal(authorCalls,2); // initial attempt and one validated repair; repeated identical QA failure must not retrigger the producer
 assert.equal(ctx.findings.at(-1).code,'INSTRUCTIONAL_QUALITY_FAILED');
 assert.equal(journal.filter(event=>event.step==='learning_objectives').length,2);
 assert.equal(ctx.artifacts.selective_repair.repair.unresolved,1);
 assert.equal(ctx.artifacts.selective_repair.repair.blockedAt,'lesson_film_render');
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

test('restart preserves a validated repair producer but still executes an unfinished directive',async()=>{
 for(const status of ['producer-validated','diagnosed']){
  let renders=0,inspections=0;
  const R=runner({},()=>[],{currentEvidence:()=>true});
  const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{learning_objectives:{blueprint:'saved'},lesson_film_render:{video:'saved.mp4'},__repairState:{status,directive:{target:'lesson_film_render'}}},findings:[],passedSteps:new Set(['learning_objectives','lesson_film_render'])};
  await new R({learning_objectives:()=>assert.fail('must preserve source'),lesson_film_render:async()=>{renders++;return {artifacts:{video:'repaired.mp4'}};},finished_media_qa:async()=>{inspections++;return {artifacts:{inspection:'measured evidence'}};}}).run(ctx);
  assert.equal(renders,status==='producer-validated'?0:1);assert.equal(inspections,1);
  assert.equal(ctx.artifacts.lesson_film_render.video,status==='producer-validated'?'saved.mp4':'repaired.mp4');
 }
});

test('explicitly named safety teaching survives concept stage normalization',()=>{
 const view=instructionView({scenes:[{id:'scene:seg-06-concept-safety-sanitation',stage:'concept_explanation',sceneType:'worked_example',text:'Use clean tools, protective draping and suitable gloves.'}]});
 assert.equal(view.scenes[0].sceneType,'safety_warning');
 assert.equal(view.scenes[0].dialogue,'Use clean tools, protective draping and suitable gloves.');
});
test('incidental safety words do not invent a safety scene',()=>{
 const view=instructionView({scenes:[{id:'color-wheel',stage:'concept_explanation',text:'Gloves protect the stylist.'},{id:'safety',stage:'concept_explanation',text:'Color theory explains hues.'},{id:'warning',stage:'concept_explanation',sceneType:'safety_warning',text:'Wear protective gloves.'}]});
 assert.equal(view.scenes[0].sceneType,'mental_model');assert.equal(view.scenes[1].sceneType,'mental_model');assert.equal(view.scenes[2].sceneType,'safety_warning');
});
test('a dedicated hygiene scene with real protective instructions survives stage normalization',()=>{
 const text='Cross-contamination in cosmetic services is a severe health risk. Use single-use applicators where required, especially for shared sample products.';
 const view=instructionView({scenes:[{id:'scene:seg-05-concept-hygiene',stage:'concept_explanation',sceneType:'mental_model',teachingPoint:text}]});
 assert.equal(view.scenes[0].sceneType,'safety_warning');assert.equal(view.scenes[0].dialogue,text);
 assert.equal(view.scenes[0].referenceImageUrl,undefined);
 const qualitySource=stripTypeScriptTypes(readFileSync(new URL('../../lib/video/instructional-quality-gate.ts',import.meta.url),'utf8'),{mode:'transform'}).replaceAll('export ','');
 const gate=new Function(qualitySource+';return instructionalQualityFailures;')();
 const check=board=>gate({courseTitle:'Cosmetology RTI',lessonTitle:'Makeup Application and Color Selection',lessonType:'practical_skill',script:text,instructor:{id:'ultimate',title:'Instructor',specialty:'Cosmetology'},storyboard:board});
 const result=check(view);assert.equal(result.evidence.hasSafetyScene,true);
 assert.ok(!result.failures.some(f=>f.includes('explicit safety or sanitation scene')));
 const missing=check(instructionView({scenes:[{id:'concept-hygiene',stage:'concept_explanation',text:'Compare warm and cool colors.'}]}));
 assert.equal(missing.evidence.hasSafetyScene,false);assert.ok(missing.failures.some(f=>f.includes('explicit safety or sanitation scene')));
});
test('hygiene labels alone cannot satisfy the safety-scene requirement',()=>{
 const view=instructionView({scenes:[{id:'concept-hygiene',stage:'concept_explanation',text:'Compare warm and cool colors.'},{id:'hygienic-dispensing',stage:'concept_explanation',text:'Appearance is the overall visual result.'}]});
 assert.ok(view.scenes.every(scene=>scene.sceneType!=='safety_warning'));
});

test('an unnamed chemical demonstration with protective setup and a real stop response is safety teaching',()=>{
 const text='First, prepare clean supplies, appropriate gloves and protective draping. Stop for discomfort or an unsafe response and follow product safety directions.';
 const view=instructionView({scenes:[{id:'scene:seg-demonstration',title:'demonstration',stage:'demonstration',text}]});
 assert.equal(view.scenes[0].sceneType,'safety_warning');
 assert.equal(view.scenes[0].dialogue,text);
 const incidental=instructionView({scenes:[{id:'scene:seg-demonstration',title:'demonstration',stage:'demonstration',text:'Wear gloves while applying color evenly.'}]});
 assert.equal(incidental.scenes[0].sceneType,'worked_example');
});


test('errors crossing worker realms retain their message and external-blocker classification', async () => {
 const error=runInNewContext("new Error('MEDIA_LICENSE_REQUIRED: actual entitlement unavailable')");
 assert.equal(error instanceof Error,false);
 const ctx={buildId:'b:c',profile:{competencies:[{id:'c'}]},artifacts:{},findings:[],passedSteps:new Set()};
 const R=runner();
 await new R({learning_objectives:async()=>{throw error;},lesson_film_render:()=>assert.fail('must not render without licensed input')}).run(ctx);
 assert.equal(ctx.findings.at(-1).code,'MEDIA_LICENSE_REQUIRED');
 assert.equal(ctx.findings.at(-1).message,'MEDIA_LICENSE_REQUIRED: actual entitlement unavailable');
 assert.equal(ctx.artifacts.selective_repair.repair.unresolved,1);
});

// The authoring pipeline can persist safety_scene; the instructional gate uses safety_warning.
test('authored safety scene survives stage normalization without rewriting its instruction',()=>{
 const dialogue='Wash and sanitize hands thoroughly. Defer service for cuts or active infections.';
 for(const stage of ['activate_prior_knowledge','concept_explanation','demonstration']){
  const view=instructionView({scenes:[{id:'scene:prior-knowledge',stage,sceneType:'safety_scene',dialogue}]});
  assert.equal(view.scenes[0].sceneType,'safety_warning');
  assert.equal(view.scenes[0].dialogue,dialogue);
 }
});

test('real sanitation procedures and allergy contraindications survive neutral stage titles',()=>{
 const examples=[
  ['concept_explanation','Perform a skin allergy test. Do not proceed after a reaction or on an irritated scalp.'],
  ['concept_explanation','Before service, apply safety and sanitation standards. Sanitize tools and wear clean gloves.'],
  ['demonstration','Prepare supplies hygienically and check comfort. Stop immediately if irritation occurs.'],
  ['activate_prior_knowledge','Recall sanitation standards. Prepare clean hands and clean linens; dispense products hygienically.'],
 ];
 for(const [stage,dialogue] of examples){
  const view=instructionView({scenes:[{id:'scene:neutral',stage,sceneType:'worked_example',dialogue}]});
  assert.equal(view.scenes[0].sceneType,'safety_warning');
  assert.equal(view.scenes[0].dialogue,dialogue);
 }
});
test('testing vocabulary and a safety-protocol mention alone cannot invent protective teaching',()=>{
 for(const dialogue of ['Skin allergy tests and strand tests are different terms.','Safety protocols are part of this course.','A client asks about skin testing after a previous reaction.']){
  assert.equal(instructionView({scenes:[{id:'neutral',stage:'concept_explanation',dialogue}]}).scenes[0].sceneType,'mental_model');
 }
});

test('safety-related recaps and checks retain their distinct teaching roles',()=>{
 const dialogue='Follow safety protocols: sanitize tools, wear protective gloves, and stop for burning.';
 for(const stage of ['recap','knowledge_check','assessment','reassessment']){
  const result=instructionView({scenes:[{id:'safety-summary',stage,dialogue}]}).scenes[0];
  assert.equal(result.sceneType,stage==='recap'?'memory_recap':'knowledge_check');
 }
});
