import test from 'node:test';import assert from 'node:assert/strict';
import {selectedStillBinding} from '../../lib/ultimate-course-builder/adapters/selected-course-stills.mjs';
import {recoverTeachingPhoto} from '../../lib/ultimate-course-builder/adapters/photo-repair.mjs';
const intent={courseId:'course',lessonId:'lesson',sceneId:'scene',cueIndex:1,narrationQuote:'Exact teaching words'};
const row={id:'source',course_id:'course',storage_path:'private.mp4',licensed_media_entitlements:{metadata:{license_evidence_url:'license.pdf',visual_observation:{method:'sampled-frame-inspection',reviewedAt:'2026-10-03T22:36:32Z',visibleActions:['Learners writing'],sampleFractions:[.35],contentSha256:'a'.repeat(64)},teachingCueSelections:[{...intent,sampleFraction:.35,selectedSourceAssetId:'source'}]}}};
test('only exact course lesson scene cue and narration selection is used',()=>{
 assert.equal(selectedStillBinding([row],intent).row.id,'source');
 for(const key of ['courseId','lessonId','sceneId','cueIndex','narrationQuote'])assert.equal(selectedStillBinding([row],{...intent,[key]:'wrong'}),null);
});
test('unlicensed uninspected or different selected source is rejected',()=>{
 for(const mutate of [r=>r.licensed_media_entitlements.metadata.license_evidence_url=null,r=>r.licensed_media_entitlements.metadata.visual_observation.sampleFractions=[],r=>r.id='different']){
 const altered=structuredClone(row);mutate(altered);assert.equal(selectedStillBinding([altered],intent),null);}
});
const request={primaryPrompt:'exact request',scene:{id:'scene'},step:{narrationQuote:'Exact teaching words'},index:1};
test('failed provider uses selected replacement without arbitrary regenerated request',async()=>{
 let calls=0;const result=await recoverTeachingPhoto({...request,generate:async()=>{calls++;throw Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED');},selectedReplacement:async()=>({bytes:Buffer.from('selected'),selectedSourceAssetId:'source'})});
 assert.equal(calls,1);assert.equal(result.repair.sourceAssetId,'source');
});
test('missing selected replacement stops at exact cue',async()=>{
 await assert.rejects(recoverTeachingPhoto({...request,generate:async()=>{throw Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED');}}),/INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED:scene:cue-1/);
});
test('successful provider preserves successful cue',async()=>{
 const result=await recoverTeachingPhoto({...request,generate:async()=>({bytes:Buffer.from('saved')})});assert.equal(result.bytes.toString(),'saved');
});
test('explicit provider safety block is retained',async()=>{
 await assert.rejects(recoverTeachingPhoto({...request,generate:async()=>{throw Object.assign(Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED'),{details:{blocked:true}});}}),/INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED/);
});

test('conceptual cards cannot pass as replacement photographs',async()=>{
 const {conceptualTeachingCard}=await import('../../lib/ultimate-course-builder/adapters/conceptual-teaching-card.mjs');
 const scene={id:'licensing-check',stage:'knowledge_check',title:'Licensing'};
 const card=await conceptualTeachingCard({scene,step:{narrationQuote:'Complete the required licensing steps.'},courseTitle:'Cosmetology',index:0});
 assert.equal(card.mimeType,'image/png');assert.ok(card.bytes.length>100);
 for(const replacement of [card,{...card,selectedSourceAssetId:'generated-training-diagram:scene:0'}]){
  await assert.rejects(recoverTeachingPhoto({...request,scene,generate:async()=>{throw Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED');},selectedReplacement:async()=>replacement}),/INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED/);
 }
});

test('blocked generation uses an existing selected asset once and retains the provider finding',async()=>{
 let calls=0;const findings=[];
 const result=await recoverTeachingPhoto({...request,generate:async()=>{calls++;throw Object.assign(Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED'),{details:{blocked:true}});},persistFailure:async finding=>findings.push(finding),selectedReplacement:async()=>({bytes:Buffer.from('licensed selected image'),selectedSourceAssetId:'existing-source'})});
 assert.equal(calls,1);assert.equal(result.repair.sourceAssetId,'existing-source');assert.equal(findings[0].provider.blocked,true);
});
test('photo recovery retry window fits within ten-minute output deadline',async()=>{
 await recoverTeachingPhoto({...request,generate:async(_prompt,options)=>{
  assert.equal(options.maxAttempts,3);assert.equal(options.timeoutMs,120000);
  // Retry-After may raise each of the two backoffs to sixty seconds.
  const worstCase=10000+options.maxAttempts*options.timeoutMs+2*60000+30000;
  assert.ok(worstCase<600000);return {bytes:Buffer.from('saved')};
 }});
});

test('missing exact photo can recover with one course-related photograph',async()=>{
 const calls=[];const result=await recoverTeachingPhoto({...request,courseTitle:'Cosmetology',generate:async(prompt,options)=>{
  calls.push({prompt,options});if(calls.length===1)throw Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED');
  return {bytes:Buffer.from('related-photo'),mimeType:'image/jpeg'};
 }});
 assert.equal(calls.length,2);assert.match(calls[1].prompt,/Cosmetology/);assert.equal(calls[1].options.maxAttempts,1);
 assert.equal(result.repair.method,'course-related-photo-v1');
});
test('provider safety block never invokes course-related generation',async()=>{
 let calls=0;await assert.rejects(recoverTeachingPhoto({...request,generate:async()=>{calls++;throw Object.assign(Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED'),{details:{blocked:true}});}}),/INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED/);
 assert.equal(calls,1);
});
