import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedDeliveryFailures,generatedTeachingPhoto,verifiedTeachingPhotoScene,narrationCoverageSeverity} from '../../lib/ultimate-course-builder/instructional/approved-delivery.mjs';
const sha='a'.repeat(64);
function fixture(){
 const text='Inspect the clean tools. Separate the used tools. Keep clean equipment protected until the next client.';
 const recapText='Keep clean equipment protected until the next client.';
 const scene={id:'render-scene',dialogue:text,durationSeconds:12,recapText,recapStartSeconds:8,
  wordAlignment:[{word:'Inspect',start:0,end:1},{word:'recap',start:8,end:9}],
  pictureCues:[0,4,8].map((start,i)=>({imageUrl:'https://media.example/'+i,sha256:String(i+1).repeat(64),startSeconds:start,endSeconds:start+4}))};
 const narration={segments:[{segmentId:'original-script-segment',text,durationSeconds:12,parts:[
  {text:'Inspect the clean tools. Separate the used tools.',audioUrl:'https://audio.example/teaching',startSeconds:0,durationSeconds:8,isRecap:false},
  {text:recapText,audioUrl:'https://audio.example/recap',startSeconds:8,durationSeconds:4,isRecap:true}]}]};
 const presentation={approvedReferenceVideo:{assetId:'approved-reference',sha256:sha}};
 const render={presentationVersion:'approved-moment-cues-v2',approvedReferenceAssetId:'approved-reference',approvedReferenceSha256:sha,
  requestedVisualStyle:{cropMode:'contain',transition:'crossfade'},duration:12,sceneData:{scenes:[scene]}};
 return {render,narration,presentation,scene};
}
const failures=f=>approvedDeliveryFailures(f.render,f.narration,f.presentation);
test('complete approved delivery with separate recap and changing pictures passes',()=>assert.deepEqual(failures(fixture()),[]));
test('recap picture cannot disguise only one teaching picture',()=>{
 const f=fixture(); f.scene.pictureCues[1].sha256=f.scene.pictureCues[0].sha256;
 assert.ok(failures(f).some(s=>s.startsWith('APPROVED_MULTIPLE_TEACHING')));
});
test('stale reference and cropping are rejected',()=>{
 const f=fixture(); f.render.approvedReferenceSha256='b'.repeat(64);f.render.requestedVisualStyle.cropMode='cover-safe';
 assert.ok(failures(f).includes('APPROVED_REFERENCE_DELIVERY_MISMATCH'));
 assert.ok(failures(f).includes('APPROVED_WHOLE_PICTURE_STYLE_REQUIRED'));
});
test('gaps, overlaps, wrong recap, and silent bookends fail',()=>{
 for(const mutate of [f=>f.scene.pictureCues[1].startSeconds=5,f=>f.narration.segments[0].parts[1].startSeconds=7,
  f=>f.narration.segments[0].parts[1].text='Wrong recap content.',f=>f.render.duration=15]){
  const f=fixture();mutate(f);assert.ok(failures(f).length);
 }
});
test('unmeasured, overlapping, and truncated word alignment cannot pass',()=>{
 for(const alignment of [[],[{word:'test',start:0,end:15}],[{word:'one',start:0,end:2},{word:'two',start:1,end:3}]]){
  const f=fixture();f.scene.wordAlignment=alignment;assert.ok(failures(f).some(s=>s.startsWith('APPROVED_WORD_ALIGNMENT')));
 }
});
test('generated illustrations preserve OpenAI provenance without pretending to be licensed stock',()=>{
 const scene={physicalDemonstration:false,resolvedProvider:'openai',resolvedModel:'generated-teaching-photograph',
  pictureCues:['openai','google'].map(provider=>({provider,illustration:true,sha256:sha,storagePath:'approved-teaching-photos/file.png'}))};
 assert.equal(generatedTeachingPhoto(scene),true);
 assert.equal(generatedTeachingPhoto({...scene,physicalDemonstration:true}),false);
 assert.equal(generatedTeachingPhoto({...scene,pictureCues:[{...scene.pictureCues[0],sha256:'invalid'}]}),false);
 assert.equal(generatedTeachingPhoto({...scene,resolvedProvider:'untrusted'}),false);
});

test('saved Elevate instructional graphics retain the same strict owned-picture contract',()=>{
 const scene={physicalDemonstration:false,resolvedProvider:'elevate-instructional',resolvedModel:'generated-teaching-photograph',
  pictureCues:[1,2].map(index=>({provider:'elevate-instructional',illustration:true,imageUrl:'https://media.example/'+index,
   sha256:String(index).repeat(64),storagePath:'approved-teaching-photos/'+index+'.png'}))};
 assert.equal(generatedTeachingPhoto(scene),true);
 assert.equal(verifiedTeachingPhotoScene(scene),true);
 assert.equal(verifiedTeachingPhotoScene({...scene,physicalDemonstration:true}),false);
 assert.equal(verifiedTeachingPhotoScene({...scene,pictureCues:[scene.pictureCues[0],{...scene.pictureCues[1],storagePath:'unapproved/file.png'}]}),false);
});

test('approved audio keeps ASR lexical differences advisory without inventing a passing score',()=>{
 assert.equal(narrationCoverageSeverity(0.895,true),'warning');
 assert.equal(narrationCoverageSeverity(0.895,false),'error');
 assert.equal(narrationCoverageSeverity(0.95,true),null);
 for(const coverage of [0,0.5,0.749,NaN,Infinity]) assert.equal(narrationCoverageSeverity(coverage,true),'error');
 const f=fixture(); f.narration.segments[0].parts[0].audioUrl='';
 assert.ok(failures(f).some(code=>code.startsWith('APPROVED_AUDIO_PART_GAP_OR_OVERLAP')));
});

test('mixed generated and licensed illustrations require evidence on every cue',()=>{
 const generated={provider:'google-generated',illustration:true,sha256:sha,imageUrl:'https://media.example/generated',storagePath:'approved-teaching-photos/image.png'};
 const licensed={provider:'envato',illustration:true,sha256:sha,imageUrl:'https://media.example/frame',storagePath:'selected-course-stills/course/'+sha+'-0.35.jpg',selectedSourceSha256:sha,selectedSourceAssetId:'source-asset',sampleFraction:.35,providerItemId:'licensed-item',licenseEvidenceUrl:'https://license.example/certificate.pdf'};
 const scene={physicalDemonstration:false,resolvedProvider:'google-generated',resolvedModel:'generated-teaching-photograph',pictureCues:[generated,licensed]};
 assert.equal(verifiedTeachingPhotoScene(scene),true);
 assert.equal(verifiedTeachingPhotoScene({...scene,resolvedModel:'licensed-teaching-photograph',pictureCues:[licensed,generated]}),true);
 assert.equal(verifiedTeachingPhotoScene({...scene,physicalDemonstration:true}),false);
 assert.equal(verifiedTeachingPhotoScene({...scene,resolvedProvider:'untrusted'}),false);
 for(const patch of [{licenseEvidenceUrl:''},{selectedSourceSha256:'b'.repeat(64)},{selectedSourceAssetId:''},{sampleFraction:NaN},{provider:'untrusted'},{illustration:false},{sha256:'bad'}])
  assert.equal(verifiedTeachingPhotoScene({...scene,pictureCues:[generated,{...licensed,...patch}]}),false);
 assert.equal(verifiedTeachingPhotoScene({...scene,pictureCues:[{...generated,provider:'untrusted'},licensed]}),false);
});
