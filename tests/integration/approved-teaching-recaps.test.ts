import test from 'node:test';
import assert from 'node:assert/strict';
import {addFreshTeachingRecaps} from '../../lib/ultimate-course-builder/instructional/teaching-recaps';
import {contractHash} from '../../lib/ultimate-course-builder/core/lesson-contract';
const blueprint={competencyId:'tools',segments:[{id:'prepare',text:'Turn off the clipper before removing its compatible attachment.'},{id:'inspect',text:'Inspect the attachment for damage before returning it to service.'}]};
const recaps=[{segmentId:'prepare',text:'Safe preparation starts with powered equipment switched off.'},{segmentId:'inspect',text:'Only undamaged compatible attachments should return to the workstation.'}];
const sources=[{id:'source',text:blueprint.segments.map(s=>s.text).join(' ')}];
test('every teaching moment gets a fresh separately reviewable recap',async()=>{
 let calls=0;
 const result=await addFreshTeachingRecaps(blueprint,{},sources,async(_model,_system,input)=>{
  calls++;return calls===1?{recaps}:{pass:true,findings:[],hash:input.hash,blueprintHash:input.hash,competencyId:input.competencyId};
 });
 assert.equal(calls,2);
 assert.equal(result.segments.length,2);
 assert.equal(result.segments[0].recapText,recaps[0].text);
 const {authoringEvidence,...payload}=result;
 assert.equal(authoringEvidence.blueprintHash,contractHash(payload));
});
test('blank, missing and replayed narration cannot become a recap',async()=>{
 for(const invalid of [[],[{...recaps[0],text:''},recaps[1]],[{...recaps[0],text:blueprint.segments[0].text},recaps[1]]]){
  await assert.rejects(addFreshTeachingRecaps(blueprint,{},sources,async()=>({recaps:invalid})),/RECAP|REPEATS/);
 }
});
test('unsupported recap review cannot certify the presentation',async()=>{
 let calls=0;
 await assert.rejects(addFreshTeachingRecaps(blueprint,{},sources,async()=>++calls===1?{recaps}:{pass:false,findings:['Unsupported instruction']}),/SOURCE_REVIEW_REQUIRED/);
});
