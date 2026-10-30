import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { courseSelectedStill, selectedStillPosition } from '../../lib/ultimate-course-builder/adapters/selected-course-stills.mjs';

const exec=promisify(execFile);
test('photographs use their first image without requiring a fabricated video duration',()=>{
 assert.equal(selectedStillPosition({streams:[{codec_type:'video'}]},'image/jpeg',0),0);
 assert.equal(selectedStillPosition({},'image/png',0),0);
 assert.equal(selectedStillPosition({format:{duration:'20'}},'video/mp4',.5),10);
 assert.equal(selectedStillPosition({},'video/mp4',.5),null);
});
test('an inspected licensed JPEG is decoded, persisted, and reused as a course picture',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'licensed-photo-test-'));
 try {
  const path=join(directory,'photo.jpg');
  await exec('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=64x36','-frames:v','1',path]);
  const bytes=await readFile(path),sha=createHash('sha256').update(bytes).digest('hex');
  const files=new Map([['licensed-library/photo.jpg',bytes]]);
  const row={id:'photo-item',course_id:'course',status:'ready',asset_role:'source_broll',entitlement_id:'license',storage_path:'licensed-library/photo.jpg',
   licensed_media_entitlements:{provider:'envato',provider_item_id:'envato-photo',metadata:{mime_type:'image/jpeg',license_evidence_url:'https://license.example/observed-item',visual_observation:{method:'sampled-frame-inspection',reviewedAt:'2026-10-13T13:26:57Z',contentSha256:sha,visibleActions:['Technician beside air conditioning equipment'],sampleFractions:[0]}}}};
  const bucket={download:async key=>files.has(key)?{data:new Blob([files.get(key)])}:{error:{status:404}},upload:async(key,data)=>{files.set(key,data);return {};},createSignedUrl:async key=>({data:{signedUrl:'https://media.example/'+key}})};
  const query={select(){return this;},eq(){return this;},then(resolve){resolve({data:[row]});}};
  const db={from:()=>query,storage:{from:()=>bucket}};
  const input={courseId:'course',lessonId:'lesson'},scene={id:'equipment'},step={narrationQuote:'Identify the air conditioning equipment.'};
  const first=await courseSelectedStill(input,db,scene,0,step,{allowRelatedCoursePhoto:true});
  assert.equal(first.provider,'envato');assert.equal(first.selectedSourceAssetId,'photo-item');
  assert.equal(first.selectedSourceSha256,sha);assert.equal(first.sampleFraction,0);
  assert.ok(files.has(first.storagePath));assert.ok(files.get(first.storagePath).length>0);
  const again=await courseSelectedStill(input,db,scene,0,step,{allowRelatedCoursePhoto:true});
  assert.deepEqual(again,first);
 }finally{await rm(directory,{recursive:true,force:true});}
});
