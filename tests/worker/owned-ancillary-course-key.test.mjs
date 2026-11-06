import test from 'node:test';
import assert from 'node:assert/strict';
import {ownedAncillaryCourseKey} from '../../lib/video/owned-ancillary-course-key.mjs';

const config={endpoint:'https://s3.us-east-005.backblazeb2.com',bucket:'elevate-media'};
const file='generated-lessons/lesson-12345678-abcd-4321-baaa-cb1234567890-1762360000000.vtt';

test('recover only existing signed private caption key on configured endpoint',()=>{
 assert.equal(ownedAncillaryCourseKey('https://s3.us-east-005.backblazeb2.com/elevate-media/'+file+'?X-Amz-Signature=expired',config),file);
 assert.equal(ownedAncillaryCourseKey('https://elevate-media.s3.us-east-005.backblazeb2.com/'+file+'?X-Amz-Signature=expired',config),file);
 assert.equal(ownedAncillaryCourseKey('https://s3.us-east-005.backblazeb2.com/elevate-media/'+file.replace('.vtt','.txt'),config),file.replace('.vtt','.txt'));
});
test('renew known immutable UUID-suffixed caption and transcript keys',()=>{
 const uuidKey='generated-lessons/lesson-38150e5f-6f6a-40cd-b470-ba64bda30068-f2618e12-1e35-435b-b40f-08cabd016b96.vtt';
 for(const key of [uuidKey,uuidKey.replace('.vtt','.txt')]) {
  assert.equal(ownedAncillaryCourseKey('https://s3.us-east-005.backblazeb2.com/elevate-media/'+key+'?X-Amz-Signature=expired',config),key);
 }
 // A foreign/altered bucket, different host or non-caption asset still fails closed.
 assert.equal(ownedAncillaryCourseKey('https://other.example/elevate-media/'+uuidKey,config),null);
 assert.equal(ownedAncillaryCourseKey('https://s3.us-east-005.backblazeb2.com/other/'+uuidKey,config),null);
 assert.equal(ownedAncillaryCourseKey('https://s3.us-east-005.backblazeb2.com/elevate-media/'+uuidKey.replace('.vtt','.mp4'),config),null);
});
test('accept only the real course-videos namespace inside the owned B2 bucket',()=>{
 const owned={endpoint:'https://s3.us-east-005.backblazeb2.com',bucket:'elevate-course-media'};
 const key='course-videos/generated-lessons/lesson-27f2878f-a8a2-424e-ba3e-ee78911274e5-1793719690588.vtt';
 for(const path of [key,key.replace('.vtt','.txt')]) {
  assert.equal(ownedAncillaryCourseKey('https://elevate-course-media.s3.us-east-005.backblazeb2.com/'+path+'?X-Amz-Signature=expired',owned),path);
  assert.equal(ownedAncillaryCourseKey('https://s3.us-east-005.backblazeb2.com/elevate-course-media/'+path+'?X-Amz-Signature=expired',owned),path);
 }
 assert.equal(ownedAncillaryCourseKey('https://untrusted.s3.us-east-005.backblazeb2.com/'+key,owned),null);
 assert.equal(ownedAncillaryCourseKey('https://elevate-course-media.s3.us-east-005.backblazeb2.com/other/'+key,owned),null);
 assert.equal(ownedAncillaryCourseKey('https://elevate-course-media.s3.us-east-005.backblazeb2.com/'+key.replace('.vtt','.mp4'),owned),null);
 assert.equal(ownedAncillaryCourseKey('https://elevate-course-media.s3.us-east-005.backblazeb2.com/some-other-folder/generated-lessons/'+key.split('/').at(-1),owned),null);
});
test('do not re-sign foreign, user-controlled or non-caption assets',()=>{
 for(const u of [
  'https://evil.example/elevate-media/'+file,
  'http://s3.us-east-005.backblazeb2.com/elevate-media/'+file,
  'https://other.s3.us-east-005.backblazeb2.com/'+file,
  'https://s3.us-east-005.backblazeb2.com/other/'+file,
  'https://s3.us-east-005.backblazeb2.com/elevate-media/generated-lessons/unrelated.txt',
  'https://s3.us-east-005.backblazeb2.com/elevate-media/'+file.replace('.vtt','.mp4'),
  'https://user:password@s3.us-east-005.backblazeb2.com/elevate-media/'+file,
 ])assert.equal(ownedAncillaryCourseKey(u,config),null,u);
});
test('quality gate retains hard-fail behavior when URL cannot be renewed',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../../lib/video/media-quality-gate.ts',import.meta.url),'utf8');
 assert.match(source,/response\.status === 401 \|\| response\.status === 403/);
 assert.match(source,/config\.endpoint \? ownedAncillaryCourseKey\(url, \{ endpoint: config\.endpoint, bucket: config\.bucket \}\) : null/);
 assert.match(source,/getSignedElevateMediaUrl\(key, 300\)/);
 assert.match(source,/if \(!response\.ok\) throw new Error/);
});
