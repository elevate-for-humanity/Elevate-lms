import test from 'node:test';
import assert from 'node:assert/strict';
import {previewRuntime,ownerLessonPreview} from './owner-lesson-preview.mjs';
const job=()=>({spec:{template:{spec:{template:{spec:{serviceAccountName:'elevate-worker-runtime@elegant-racer-299721.iam.gserviceaccount.com',containers:[{image:'registry.example/old@sha256:'+'a'.repeat(64),resources:{limits:{cpu:'4',memory:'8Gi'}},env:Object.entries({NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service',ELEVATE_MEDIA_ENDPOINT:'https://s3.us-west-004.backblazeb2.com',ELEVATE_MEDIA_ACCESS_KEY_ID:'test-access',ELEVATE_MEDIA_SECRET_ACCESS_KEY:'test-secret',ELEVATE_MEDIA_BUCKET:'elevate-course-media',ELEVATE_MEDIA_PUBLIC_URL:'https://media.example.org'}).map(([name,value])=>({name,value}))}]}}}}}});
test('preview uses only the existing scoped identity, database, B2 bucket, and allocation',()=>{
 const input=job(),before=structuredClone(input),out=previewRuntime(input);
 assert.equal(out.b2.ELEVATE_MEDIA_PROVIDER,'backblaze-b2');assert.deepEqual(input,before);
});
test('wrong identity, resources, database, or provider cannot silently fall back',()=>{
 for(const mutate of [x=>x.spec.template.spec.template.spec.serviceAccountName='admin',x=>x.spec.template.spec.template.spec.containers[0].resources.limits.cpu='8',x=>x.spec.template.spec.template.spec.containers[0].env[0].value='https://other.supabase.co',x=>x.spec.template.spec.template.spec.containers[0].env.find(e=>e.name==='ELEVATE_MEDIA_ENDPOINT').value='https://example.r2.cloudflarestorage.com']){
  const input=job();mutate(input);assert.throws(()=>previewRuntime(input));
 }
});
test('validation performs no deployment, execution, queue write, or lease change',async()=>{
 const commands=[],methods=[];
 const run=args=>{commands.push(args);if(args[2]==='describe')return JSON.stringify(job());if(args[2]==='executions')return '[]';throw Error('unexpected mutation');};
 const request=async(url,options)=>{methods.push(options.method);return {ok:true,json:async()=>url.includes('ultimate_course_builds')?[{profile:{lessonPresentation:'approved-premium-v1',presentationContract:{approvedReferenceVideo:{sha256:'6921ebb2f049e0183fa2f5cfebaa1a9a6e2a8242a672daebbdcb251ca0a96fc2'}}}}]:[{build_id:'572cca43-6bd6-4a91-b385-a8b576209c4e',status:'failed',lease_owner:null,lease_expires_at:null}]};};
 const out=await ownerLessonPreview({run,request,capacity:async()=>({fits:true})});
 assert.equal(out.executionStarted,false);assert.equal(out.releaseHoldChanged,false);
 assert.deepEqual(methods,['GET','GET']);assert.equal(commands.some(a=>a.some(v=>['update','deploy','execute','cancel'].includes(v))),false);
});
