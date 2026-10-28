import test from 'node:test';import assert from 'node:assert/strict';
import {inspectPublishedB2Media,publishedMediaObject} from './inspect-published-b2-media.mjs';
const base='https://cuxzzpsyufcewtmicszk.supabase.co',target={ELEVATE_MEDIA_BUCKET:'elevate-course-media'};
test('maps only the configured B2 bucket and approved source storage',()=>{
 assert.deepEqual(publishedMediaObject('https://elevate-course-media.s3.us-east-005.backblazeb2.com/film.mp4?signature=private','elevate-course-media',base),{kind:'backblaze-b2',key:'film.mp4'});
 assert.equal(publishedMediaObject('https://other.s3.us-east-005.backblazeb2.com/film.mp4','elevate-course-media',base),null);
 assert.equal(publishedMediaObject('https://attacker.example/film.mp4','elevate-course-media',base),null);
});
test('distinguishes private media existence from incomplete Supabase cutover without exposing source URLs',async()=>{
 const rows=[{id:'b2-existing',video_url:'https://elevate-course-media.s3.us-east-005.backblazeb2.com/good.mp4?signature=private'},{id:'b2-missing',video_url:'https://elevate-course-media.s3.us-east-005.backblazeb2.com/missing.mp4'},{id:'legacy',video_url:base+'/storage/v1/object/public/course-videos/legacy.mp4'}];
 const result=await inspectPublishedB2Media({NEXT_PUBLIC_SUPABASE_URL:base,SUPABASE_SERVICE_ROLE_KEY:'private-token'},target,{request:async()=>Response.json(rows),head:async key=>{if(key==='missing.mp4')throw {$metadata:{httpStatusCode:404}};return {ContentLength:100};}});
 assert.equal(result.existingB2Objects,1);assert.equal(result.supabaseCopiesPresent,1);assert.deepEqual(result.missingB2Lessons,['b2-missing']);assert.equal(result.allPublishedVideosInB2,false);assert.ok(!JSON.stringify(result).includes('private'));
});
test('does not convert provider outages into false missing-media evidence',async()=>{
 await assert.rejects(inspectPublishedB2Media({NEXT_PUBLIC_SUPABASE_URL:base,SUPABASE_SERVICE_ROLE_KEY:'token'},target,{request:async()=>Response.json([{id:'lesson',video_url:'https://elevate-course-media.s3.us-east-005.backblazeb2.com/film.mp4'}]),head:async()=>{throw {$metadata:{httpStatusCode:403}};}}),/PRIVATE_OBJECT_PROBE_FAILED/);
});
