import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const root=new URL('../../',import.meta.url);
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const read=p=>readFileSync(new URL(p,root),'utf8');
const hashText=read('lib/ultimate-course-builder/core/lesson-contract.ts');
const hash=data(stripTypeScriptTypes("import {createHash} from 'node:crypto';\n"+hashText.slice(hashText.indexOf('export function contractHash'),hashText.indexOf('export function artifactPayload')),{mode:'transform'}));
const sequence=data(stripTypeScriptTypes(read('lib/ultimate-course-builder/instructional/teaching-sequence.ts'),{mode:'transform'}));
const reviewed=data(stripTypeScriptTypes(read('lib/ultimate-course-builder/instructional/reviewed-scene-evidence.ts'),{mode:'transform'}));
const visual=data(stripTypeScriptTypes(read('lib/ultimate-course-builder/instructional/teaching-visual.ts').replace("'./reviewed-scene-evidence'",JSON.stringify(reviewed)),{mode:'transform'}));
const blueprint=data(stripTypeScriptTypes(read('lib/ultimate-course-builder/instructional/lesson-blueprint.ts').replace("'./teaching-sequence'",JSON.stringify(sequence)).replace("'../core/lesson-contract'",JSON.stringify(hash)).replace("'./teaching-visual'",JSON.stringify(visual)),{mode:'transform'}));
const authorText=read('lib/ultimate-course-builder/instructional/google-lesson-author.ts').replace("'./rti-teaching-policy.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/instructional/rti-teaching-policy.mjs',root).href)).replace("'../worker/progress-watch.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/worker/progress-watch.mjs',root).href)).replace("'./generated-lesson-assessment.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/instructional/generated-lesson-assessment.mjs',root).href)).replace("'./vertex-response.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/instructional/vertex-response.mjs',root).href)).replace("'./source-grounding.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/instructional/source-grounding.mjs',root).href)).replace("'../core/lesson-contract'",JSON.stringify(hash)).replace("'./lesson-blueprint'",JSON.stringify(blueprint)).replace("'./teaching-visual'",JSON.stringify(visual)).replace("'./teaching-sequence'",JSON.stringify(sequence));
const {authorGoogleLesson,assertHvacSafetyBlueprint}=await import(data(stripTypeScriptTypes(authorText,{mode:'transform'})));
function fixture(){
 const blueprint=JSON.parse(read('docs/ultimate-course-builder/lessons/cosmetology-welcome.blueprint.json'));
 blueprint.assessment.questions.push(...blueprint.assessment.reassessment.slice(0,2).map((q,i)=>({...q,id:'recap-extra-'+i,prompt:['Your first client asks for work beyond the assignment your supervisor verified. What is the professional response?','A dashboard marks one training module complete. Which conclusion can you support from that record alone?'][i]})));
 for(const segment of blueprint.segments)segment.teachingVisual.steps=segment.teachingVisual.steps.slice(0,4);
 const competency={id:blueprint.competencyId,type:'knowledge',authorityRequirementIds:[],requiresPracticalEvidence:false};
 const sources=[{id:'authorized',text:blueprint.segments.map(s=>s.text).join('\n')}];
 const result={blueprint,grounding:blueprint.segments.map(s=>({segmentId:s.id,sourceId:'authorized',excerpt:s.text}))};
 return {input:{profile:{title:'Course'},competency,sources},result};
}
test('optional citation metadata never blocks otherwise valid instruction', async()=>{
 const {input,result}=fixture();
 result.grounding=[{segmentId:'wrong',sourceId:'invalid',excerpt:'short'}];
 let calls=0;
 const output=await authorGoogleLesson(input,async()=>{calls++;return result;});
 assert.equal(calls,1);
 assert.equal(output.authoringEvidence.review.pass,true);
 assert.equal(output.authoringEvidence.grounding,undefined);
});

test('HVAC authoring rejects a safety-sensitive blueprint without a concrete warning',()=>{
 const profile={id:'course:hvac',title:'EPA 608 Training — Core and Type I',authority:'course-defined'};
 const competency={id:'core-practice',title:'Recovery Principles, Sales Rules and Core Practice',description:'Apply refrigerant recovery procedures.',type:'knowledge',authorityRequirementIds:['core'],requiresDemonstration:false,requiresPracticalEvidence:false};
 const blueprint={segments:[{id:'concept',sceneType:'mental_model',text:'Recovery equipment moves refrigerant into a cylinder.',sourceRequirementIds:['core']} ]};
 assert.throws(()=>assertHvacSafetyBlueprint(blueprint,profile,competency),/BLUEPRINT_HVAC_SAFETY_WARNING_REQUIRED/);
});

test('HVAC authoring accepts only a source-mapped warning with hazard, outcome and protective action',()=>{
 const profile={id:'course:hvac',title:'EPA 608 Training — Core and Type I',authority:'course-defined'};
 const competency={id:'core-practice',title:'Recovery Principles and Core Practice',description:'Apply refrigerant recovery procedures.',type:'knowledge',authorityRequirementIds:['core'],requiresDemonstration:false,requiresPracticalEvidence:false};
 const vague={segments:[{id:'warning',sceneType:'safety_warning',text:'Use care around refrigerant.',sourceRequirementIds:['core']}]};
 assert.throws(()=>assertHvacSafetyBlueprint(vague,profile,competency),/BLUEPRINT_HVAC_SAFETY_WARNING_REQUIRED/);
 const complete={segments:[{id:'warning',sceneType:'safety_warning',text:'Safety warning: Never heat a refrigerant recovery cylinder because overpressure can cause rupture and injury.',sourceRequirementIds:['core']}]};
 assert.doesNotThrow(()=>assertHvacSafetyBlueprint(complete,profile,competency));
});

test('HVAC safety assertion does not affect another course domain',()=>{
 const profile={id:'course:business',title:'Business Administration',authority:'course-defined'};
 const competency={id:'service',title:'Customer service procedure',description:'Handle a customer request.',type:'knowledge',authorityRequirementIds:['service'],requiresDemonstration:false,requiresPracticalEvidence:false};
 assert.doesNotThrow(()=>assertHvacSafetyBlueprint({segments:[]},profile,competency));
});

test('HVAC authoring repairs the missing warning before returning a blueprint',async()=>{
 const {input,result}=fixture();
 input.profile={...input.profile,id:'course:hvac',title:'EPA 608 Training — Core and Type I',authority:'course-defined'};
 input.competency={...input.competency,title:'Recovery Principles, Sales Rules and Core Practice',description:'Apply refrigerant recovery procedures.'};
 const first=structuredClone(result), repaired=structuredClone(result);
 repaired.blueprint.segments[0].sceneType='safety_warning';
 repaired.blueprint.segments[0].text+=' Safety warning: Never heat a refrigerant recovery cylinder because overpressure can cause rupture and injury.';
 let calls=0, repair;
 const output=await authorGoogleLesson(input,async(_system,request)=>{
   calls++;
   repair=request.repair;
   return calls===1?first:repaired;
 });
 assert.equal(calls,2);
 assert.equal(repair.code,'BLUEPRINT_HVAC_SAFETY_WARNING_REQUIRED');
 assert.match(repair.instructions,/source-grounded safety_warning segment/);
 assert.equal(output.segments[0].sceneType,'safety_warning');
});
