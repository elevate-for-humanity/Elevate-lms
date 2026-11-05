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
 assert.match(source,/ownedAncillaryCourseKey\(url, config\)/);
 assert.match(source,/getSignedElevateMediaUrl\(key, 300\)/);
 assert.match(source,/if \(!response\.ok\) throw new Error/);
});
