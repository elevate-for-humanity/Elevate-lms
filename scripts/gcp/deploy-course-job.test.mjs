import test from 'node:test';
import assert from 'node:assert/strict';
import {courseJobEnvironment} from './deploy-course-job.mjs';
const source=()=>({runtimeEnvironment:{NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-test',STORAGE_KEY:'storage-test',ULTIMATE_WORKER_ID:'northflank-fixed',PORT:'3000',AI_NARRATION_PROVIDER:'cloudflare'}});
test('worker migration preserves source credentials without restoring paid narration or fixed lease identity',()=>{
 const s=source(),r=courseJobEnvironment(s,{});
 assert.equal(r.STORAGE_KEY,'storage-test');assert.equal(r.SUPABASE_SERVICE_ROLE_KEY,'private-test');
 assert.equal(r.REMOTION_RENDER_CONCURRENCY,'4');assert.equal(r.PORT,undefined);assert.equal(r.ULTIMATE_WORKER_ID,undefined);
 assert.equal(r.AI_NARRATION_PROVIDER,'kokoro');assert.equal(r.AI_PROVIDER,'none');assert.equal(r.ULTIMATE_WORKER_ONCE,'true');
 assert.equal(s.runtimeEnvironment.AI_NARRATION_PROVIDER,'cloudflare');
});
test('wrong tenant, missing credentials and unhandled persistent state stop deployment',()=>{
 const s=source();s.runtimeEnvironment.NEXT_PUBLIC_SUPABASE_URL='https://other.supabase.co';
 assert.throws(()=>courseJobEnvironment(s,{}));
 const missing=source();delete missing.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY;assert.throws(()=>courseJobEnvironment(missing,{}));
 assert.throws(()=>courseJobEnvironment({...source(),runtimeFiles:{'/x':'file'}},{}));
 assert.throws(()=>courseJobEnvironment(source(),{volumes:[{}]}));
});
