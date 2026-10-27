import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
let source=readFileSync(new URL('../../lib/ultimate-course-builder/adapters/platform-renderer.ts',import.meta.url),'utf8');
source=source.replace(/import[\s\S]*?from\s+['"][^'"]+['"];\s*/g,'');
source='const storedLicensedMediaMetadata=metadata=>metadata?.storage_bucket==="course_videos"&&metadata.storage_path?metadata:null;\n'+source;
const {refreshLicensedVisualUrls}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64'));
test('saved visual checkpoint renews the current entitlement source rather than its stale path',async()=>{
 const signed=[];
 const query={select(){return this},eq(){return this},async single(){return {data:{metadata:{storage_bucket:'course_videos',storage_path:'licensed-library/current.mp4'}}};}};
 const db={from(table){assert.equal(table,'licensed_media_entitlements');return query;},storage:{from(bucket){assert.equal(bucket,'course_videos');return {async createSignedUrl(path){signed.push(path);return {data:{signedUrl:'https://private.example/current'}};}};}}};
 const input={artifacts:{visual_assignment:{media:{readyAssets:[{id:'asset',entitlement_id:'license',storage_path:'old/source.mp4'}]}}}};
 const result=await refreshLicensedVisualUrls(input,db);
 assert.deepEqual(signed,['licensed-library/current.mp4']);
 assert.equal(result.artifacts.visual_assignment.media.readyAssets[0].storage_path,'licensed-library/current.mp4');
});
test('unreadable entitlement stops refresh instead of signing the obsolete path',async()=>{
 const query={select(){return this},eq(){return this},async single(){return {error:new Error('missing')};}};
 const db={from(){return query;}};
 await assert.rejects(refreshLicensedVisualUrls({artifacts:{visual_assignment:{media:{readyAssets:[{id:'asset',entitlement_id:'license',storage_path:'old.mp4'}]}}}},db),/ENTITLEMENT_REFRESH_FAILED/);
});
