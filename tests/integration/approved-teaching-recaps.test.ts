import {createCourseProgressWatch} from '../../lib/ultimate-course-builder/worker/progress-watch.mjs';
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
test('unsupported recap review cannot certify the presentation after bounded repair',async()=>{
 let calls=0;
 await assert.rejects(addFreshTeachingRecaps(blueprint,{},sources,async(_model,system)=>{calls++;return system.includes('recaps:')?{recaps}:{pass:false,findings:['Unsupported instruction']};}),/SOURCE_REVIEW_REQUIRED/);
 assert.equal(calls,6);
});

test('review failure is returned to author for a bounded source-grounded repair',async()=>{
 let reviews=0, repairs=0;
 const result=await addFreshTeachingRecaps(blueprint,{},sources,async(_model,system,input)=>{
  if(system.includes('recaps:')){if(input.repair)repairs++;return {recaps};}
  reviews++;
  return {pass:reviews>1,findings:reviews>1?[]:['Unsupported instruction'],hash:input.hash,blueprintHash:input.hash,competencyId:input.competencyId};
 });
 assert.equal(reviews,2);assert.equal(repairs,1);assert.equal(result.segments.length,2);
});

test('recap generation and evidence count as real progress during a long objectives stage',async()=>{
 let tick=0,calls=0;const watch=createCourseProgressWatch({now:()=>tick,schedule:()=>0,cancel:()=>{}});
 try {
  await watch.run(()=>addFreshTeachingRecaps(blueprint,{},sources,async(_model,_system,input)=>{
   tick+=540000;await watch.check();assert.equal(watch.signal.aborted,false);
   return ++calls===1?{recaps}:{pass:true,findings:[],hash:input.hash,blueprintHash:input.hash,competencyId:input.competencyId};
  }));
  assert.equal(watch.signal.aborted,false);assert.equal(calls,2);
  assert.equal(watch.snapshot().phase,'authoring:tools:recap-evidence');
  tick+=600001;await watch.check();assert.equal(watch.signal.aborted,true);
 } finally {watch.dispose();}
});

test('RTI recap filler is repaired without removing subject narration or quizzes',async()=>{
 let drafts=0;
 const profile={id:'course:a6b0b712-1cf0-475a-ba79-ee2023dea8ec'};
 const result=await addFreshTeachingRecaps(blueprint,profile,sources,async(_model,system,input)=>{
  if(system.includes('recaps:')){
   drafts++;
   assert.match(input.rtiRequirements,/picture sequences/);
   if(drafts===1)return {recaps:[{...recaps[0],text:'Click the next button to proceed to the next lesson.'},recaps[1]]};
   assert.equal(input.repair.error,'BLUEPRINT_RTI_NAVIGATION_FILLER');
   return {recaps};
  }
  return {pass:true,findings:[],hash:input.hash,blueprintHash:input.hash,competencyId:input.competencyId};
 });
 assert.equal(drafts,2);
 assert.equal(result.segments[0].text,blueprint.segments[0].text);
});
