import test from 'node:test';import assert from 'node:assert/strict';import {photoResponseDetails,recoverTeachingPhoto} from '../../lib/ultimate-course-builder/adapters/photo-repair.mjs';
const input={courseTitle:'Cosmetology',scene:{id:'scene:assessment',stage:'assessment',visualRequirement:'Assessment at a training station'},step:{narrationQuote:'Answer each question carefully',view:'full workstation'},index:1,primaryPrompt:'Original abstract narration prompt'};
test('text-only image response is diagnosed and repaired with a changed observable request',async()=>{
 const prompts=[],diagnostics=[];const result=await recoverTeachingPhoto({...input,persistFailure:async x=>diagnostics.push(x),generate:async(p,opts)=>{
 prompts.push(p);assert.equal(opts.maxAttempts,2);assert.equal(opts.timeoutMs,90000);
 if(prompts.length===1)throw Object.assign(Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED'),{details:photoResponseDetails({candidates:[{finishReason:'STOP',content:{parts:[{text:'text-only'}]}}]})});
 return {bytes:Buffer.from('photo'),mimeType:'image/png'};
 }});
 assert.equal(prompts.length,2);assert.notEqual(prompts[0],prompts[1]);assert.match(prompts[1],/assessment sheet/);assert.equal(diagnostics[0].provider.partTypes[0],'text');assert.equal(result.repair.cueIndex,1);
});
test('explicit provider safety block is preserved rather than evaded',async()=>{
 let calls=0;await assert.rejects(recoverTeachingPhoto({...input,generate:async()=>{calls++;throw Object.assign(Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED'),{details:{blocked:true,blockReason:'SAFETY'}});}}),/TEACHING_PHOTO_REPLACEMENT_REQUIRED:scene:assessment:cue-1/);assert.equal(calls,1);
});
test('exhausted changed request records the precise cue and blocks instead of endless rerender',async()=>{
 const records=[];let calls=0;
 await assert.rejects(recoverTeachingPhoto({...input,persistFailure:async x=>records.push(x),generate:async()=>{calls++;throw Object.assign(Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED'),{details:{candidateCount:0}});}}),/TEACHING_PHOTO_REPLACEMENT_REQUIRED/);
 assert.equal(calls,2);assert.equal(records[1].sceneId,input.scene.id);assert.equal(records[1].cueIndex,1);
});
test('successful image does not invoke replacement or redo other cues',async()=>{
 let calls=0;const result=await recoverTeachingPhoto({...input,generate:async()=>{calls++;return {bytes:Buffer.from('saved image')};}});assert.equal(calls,1);assert.equal(result.bytes.toString(),'saved image');
});
