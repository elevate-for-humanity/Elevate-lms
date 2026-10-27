import test from 'node:test';
import assert from 'node:assert/strict';
import {selectedSourceDuration} from '../lib/ultimate-course-builder/adapters/selected-course-stills.mjs';
test('stock frame extraction uses video stream duration when container duration is absent',()=>{
 assert.equal(selectedSourceDuration({format:{duration:'6.25'}}),6.25);
 assert.equal(selectedSourceDuration({format:{duration:'N/A'},streams:[{codec_type:'video',duration:'4.5'}]}),4.5);
});
test('unknown, infinite, nonpositive and audio-only durations never become fabricated timings',()=>{
 for(const probe of [{},{format:{duration:'Infinity'}},{format:{duration:0}},{format:{duration:-2}},{streams:[{codec_type:'audio',duration:10}]}])
  assert.equal(selectedSourceDuration(probe),null);
});

import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {courseSelectedStill} from '../lib/ultimate-course-builder/adapters/selected-course-stills.mjs';
test('unusable optional footage yields to photo fallback without uploading a made-up frame',async t=>{
 if(spawnSync('ffprobe',['-version']).error){t.skip('ffprobe is not installed');return;}
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6WQAAAAASUVORK5CYII=','base64');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const row={id:'durationless-source',course_id:'duration-test',status:'ready',asset_role:'source_broll',storage_path:'source.png',entitlement_id:'test-license',
 licensed_media_entitlements:{provider:'licensed',license_document_url:'https://example.test/license',metadata:{visual_observation:{
 method:'sampled-frame-inspection',reviewedAt:'2026-10-01T00:00:00Z',visibleActions:['color consultation'],contentSha256:sha,sampleFractions:[0.25,0.5]}}}};
 let reads=0,uploads=0;
 const query={select(){return this;},eq(){return this;},then(resolve){resolve({data:[row],error:null});}};
 const db={from(){return query;},storage:{from(){return {
  async download(path){if(path==='source.png'){reads++;return {data:new Blob([bytes]),error:null};}return {data:null};},
  async upload(){uploads++;throw Error('must not upload a fabricated frame');},
  async createSignedUrl(){throw Error('must not sign a nonexistent frame');}
 };}}};
 const input={courseId:'duration-test',lessonId:'lesson'};
 const scene={id:'color'},step={narrationQuote:'color consultation'};
 assert.equal(await courseSelectedStill(input,db,scene,0,step,{allowRelatedCoursePhoto:true}),null);
 assert.equal(await courseSelectedStill(input,db,scene,1,step,{allowRelatedCoursePhoto:true}),null);
 assert.equal(reads,1);assert.equal(uploads,0);
});
