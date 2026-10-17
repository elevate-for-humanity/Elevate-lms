import test from 'node:test';
import assert from 'node:assert/strict';
import {courseJobEnvironment,courseJobResources,courseB2Environment} from './deploy-course-job.mjs';
const b2=()=>({ELEVATE_MEDIA_ENDPOINT:'https://s3.us-west-004.backblazeb2.com',ELEVATE_MEDIA_ACCESS_KEY_ID:'fixture-key',ELEVATE_MEDIA_SECRET_ACCESS_KEY:'fixture-secret',ELEVATE_MEDIA_BUCKET:'fixture-bucket',ELEVATE_MEDIA_PUBLIC_URL:'https://media.example.org/course-media'});
const source=()=>({runtimeEnvironment:{...b2(),NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-test',STORAGE_KEY:'storage-test',ULTIMATE_WORKER_ID:'northflank-fixed',PORT:'3000',AI_NARRATION_PROVIDER:'cloudflare'}});
test('worker migration preserves source credentials without restoring paid narration or fixed lease identity',()=>{
 const s=source(),r=courseJobEnvironment(s,{});
 assert.equal(r.STORAGE_KEY,'storage-test');assert.equal(r.SUPABASE_SERVICE_ROLE_KEY,'private-test');
 assert.equal(r.REMOTION_RENDER_CONCURRENCY,'1');assert.equal(r.PORT,undefined);assert.equal(r.ULTIMATE_WORKER_ID,undefined);
 assert.equal(r.AI_NARRATION_PROVIDER,'kokoro');assert.equal(r.AI_PROVIDER,'none');assert.equal(r.ULTIMATE_WORKER_ONCE,'true');
 assert.equal(s.runtimeEnvironment.AI_NARRATION_PROVIDER,'cloudflare');
 assert.equal(r.COURSE_VIDEO_STORAGE_BACKEND,'b2');assert.equal(r.ELEVATE_MEDIA_PROVIDER,'backblaze-b2');
});
test('missing B2 delivery or mixed provider credentials refuse migration instead of falling back',()=>{
 for(const key of Object.keys(b2())){
  const config=b2();delete config[key];assert.throws(()=>courseB2Environment(config),/COURSE_B2_CONFIGURATION_/);
 }
 assert.throws(()=>courseB2Environment({...b2(),ELEVATE_MEDIA_SECRET_ACCESS_KEY:'',S3_SECRET_ACCESS_KEY:'unrelated'}),/INCOMPLETE/);
});
test('only HTTPS Backblaze endpoints and unsigned HTTPS delivery bases are accepted',()=>{
 for(const value of ['https://account.r2.cloudflarestorage.com','https://s3.us-west-004.backblazeb2.com.attacker.example','http://s3.us-west-004.backblazeb2.com','https://user:private@s3.us-west-004.backblazeb2.com','https://s3.us-west-004.backblazeb2.com?token=private'])
  assert.throws(()=>courseB2Environment({...b2(),ELEVATE_MEDIA_ENDPOINT:value}),/INVALID/);
 assert.throws(()=>courseB2Environment({...b2(),ELEVATE_MEDIA_PUBLIC_URL:'https://media.example.org?token=private'}),/INVALID/);
});
test('a complete S3-named B2 family is normalized without using legacy R2 secrets',()=>{
 const env={S3_ENDPOINT:b2().ELEVATE_MEDIA_ENDPOINT,S3_ACCESS_KEY_ID:'own-key',S3_SECRET_ACCESS_KEY:'own-secret',S3_BUCKET:'own-bucket',S3_PUBLIC_URL:'https://media.example.org',R2_SECRET_KEY:'unrelated'};
 const result=courseB2Environment(env);assert.equal(result.ELEVATE_MEDIA_ACCESS_KEY_ID,'own-key');assert.equal(result.ELEVATE_MEDIA_SECRET_ACCESS_KEY,'own-secret');assert.equal(result.ELEVATE_MEDIA_REGION,'us-west-004');
});
test('image releases preserve approved CPU and memory instead of resetting migration defaults',()=>{
 const job=limits=>({spec:{template:{spec:{template:{spec:{containers:[{resources:{limits}}]}}}}}});
 assert.deepEqual(courseJobResources(job({cpu:'8000m',memory:'32Gi'})),{cpu:'8',memory:'32Gi'});
 assert.deepEqual(courseJobResources(job({cpu:'4',memory:'8Gi'})),{cpu:'4',memory:'8Gi'});
 assert.throws(()=>courseJobResources(job({cpu:'unknown',memory:'32Gi'})),/resource configuration/);
 assert.throws(()=>courseJobResources({}),/resource configuration/);
});
test('wrong tenant, missing credentials and unhandled persistent state stop deployment',()=>{
 const s=source();s.runtimeEnvironment.NEXT_PUBLIC_SUPABASE_URL='https://other.supabase.co';
 assert.throws(()=>courseJobEnvironment(s,{}));
 const missing=source();delete missing.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY;assert.throws(()=>courseJobEnvironment(missing,{}));
 assert.throws(()=>courseJobEnvironment({...source(),runtimeFiles:{'/x':'file'}},{}));
 assert.throws(()=>courseJobEnvironment(source(),{volumes:[{}]}));
});
