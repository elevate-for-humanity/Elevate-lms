import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const moduleURL = source => 'data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64');
const licensed = await import(moduleURL(readFileSync(new URL('../../media/licensed-course-media.ts',import.meta.url),'utf8').replace(/import 'server-only';/,'').replace(/import type[^;]+;/g,'')));
let source=readFileSync(new URL('../adapters/platform-media.ts',import.meta.url),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];\s*/g,'');
source=`const {attachStoredLicensedMedia,licensedMediaBelongsToCourse,recommendLicensedMediaForCourse,storedLicensedMediaMetadata}=globalThis.__licensed; const buildSceneAssignments=()=>({assignments:[],gaps:[]}); const selectApprovedAcquisitionMatches=x=>x; const requestMediaDependency=()=>{throw Error('unexpected gap')};\n`+source;
globalThis.__licensed=licensed;
const {UltimatePlatformMedia}=await import(moduleURL(source));
delete globalThis.__licensed;
test('current entitlement path overrides a historical lesson URL and object path',async()=>{
 const calls=[];
 const asset={id:'asset',course_id:'course',video_url:'https://old.invalid/old.mp4',storage_path:'licensed-library/old.mp4',entitlement_id:'entitlement',licensed_media_entitlements:{provider:'envato',provider_item_id:'item',license_document_url:'https://license.invalid/item',metadata:{courseId:'course',storage_bucket:'course_videos',storage_path:'licensed-library/new.mp4',mime_type:'video/mp4'}},course_lesson_media_matches:[]};
 const query={select(){return this},eq(){return this},not(){return this},order(){return Promise.resolve({data:[asset]})}};
 const db={from(){return query},storage:{from(bucket){assert.equal(bucket,'course_videos');return {createSignedUrl:async(path)=>{calls.push(path);return {data:{signedUrl:'https://private.invalid/'+path}}}}}}};
 const result=await new UltimatePlatformMedia(db).find({courseId:'course',competency:{id:'lesson'},profile:{}});
 assert.deepEqual(calls,['licensed-library/new.mp4']);
 assert.equal(result.readyAssets[0].storage_path,'licensed-library/new.mp4');
 assert.equal(result.readyAssets[0].public_url,'https://private.invalid/licensed-library/new.mp4');
});
test('course ownership remains required when choosing the canonical source',()=>{
 assert.equal(licensed.licensedMediaBelongsToCourse({courseId:'other'},'course'),false);
 assert.equal(licensed.storedLicensedMediaMetadata({storage_bucket:'course_videos',storage_path:'../escape.mp4'}),null);
});
