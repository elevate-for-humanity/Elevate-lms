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
const authorText=read('lib/ultimate-course-builder/instructional/google-lesson-author.ts').replace("'./vertex-response.mjs'",JSON.stringify(data('export const parseVertexLessonResponse=x=>x;'))).replace("'./source-grounding.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/instructional/source-grounding.mjs',root).href)).replace("'../core/lesson-contract'",JSON.stringify(hash)).replace("'./lesson-blueprint'",JSON.stringify(blueprint)).replace("'./teaching-visual'",JSON.stringify(visual)).replace("'./teaching-sequence'",JSON.stringify(sequence));
const {authorGoogleLesson}=await import(data(stripTypeScriptTypes(authorText,{mode:'transform'})));
function fixture(){
 const blueprint=JSON.parse(read('docs/ultimate-course-builder/lessons/cosmetology-welcome.blueprint.json'));
 for(const segment of blueprint.segments)segment.teachingVisual.steps=segment.teachingVisual.steps.slice(0,4);
 const competency={id:blueprint.competencyId,type:'knowledge',authorityRequirementIds:[],requiresPracticalEvidence:false};
 const sources=[{id:'authorized',text:blueprint.segments.map(s=>s.text).join('\n')}];
 const result={blueprint,grounding:blueprint.segments.map(s=>({segmentId:s.id,sourceId:'authorized',excerpt:s.text}))};
 return {input:{profile:{title:'Course'},competency,sources},result};
}
test('bad quote is repaired with exact-source feedback before independent review',async()=>{
 const {input,result}=fixture();const invalid=structuredClone(result);invalid.grounding[0].excerpt='Invented quotation with enough words that is absent from the source.';
 let calls=0;
 const output=await authorGoogleLesson(input,async(_system,request)=>{
  calls++;
  if(calls===1)return invalid;
  if(calls===2){assert.equal(request.repair.invalidCitations[0].segmentId,result.blueprint.segments[0].id);assert.deepEqual(request.sources,input.sources);return result;}
  return {pass:true,findings:[],competencyId:input.competency.id,blueprintHash:request.blueprintHash};
 });
 assert.equal(calls,3);assert.equal(output.authoringEvidence.review.pass,true);
});
test('three bad quotes fail without reaching review',async()=>{
 const {input,result}=fixture();result.grounding[0].sourceId='invented';let calls=0;
 await assert.rejects(authorGoogleLesson(input,async()=>{calls++;return result;}),/ULTIMATE_SOURCE_CITATION_INVALID/);
 assert.equal(calls,3);
});
test('source gap after repair remains blocked',async()=>{
 const {input,result}=fixture();result.grounding[0].excerpt='short';let calls=0;
 await assert.rejects(authorGoogleLesson(input,async()=>++calls===1?result:{blocked:true,reason:'Missing instructional source'}),/ULTIMATE_AUTHORING_SOURCE_GAP/);
 assert.equal(calls,2);
});
