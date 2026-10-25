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
const authorText=read('lib/ultimate-course-builder/instructional/google-lesson-author.ts').replace("'./rti-teaching-policy.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/instructional/rti-teaching-policy.mjs',root).href)).replace("'../worker/progress-watch.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/worker/progress-watch.mjs',root).href)).replace("'./generated-lesson-assessment.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/instructional/generated-lesson-assessment.mjs',root).href)).replace("'./vertex-response.mjs'",JSON.stringify(data('export const parseVertexLessonResponse=x=>x;'))).replace("'./source-grounding.mjs'",JSON.stringify(new URL('lib/ultimate-course-builder/instructional/source-grounding.mjs',root).href)).replace("'../core/lesson-contract'",JSON.stringify(hash)).replace("'./lesson-blueprint'",JSON.stringify(blueprint)).replace("'./teaching-visual'",JSON.stringify(visual)).replace("'./teaching-sequence'",JSON.stringify(sequence));
const {authorGoogleLesson}=await import(data(stripTypeScriptTypes(authorText,{mode:'transform'})));
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
