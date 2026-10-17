import test from 'node:test';
import assert from 'node:assert/strict';
import {previewRuntime,ownerLessonPreview,runtimeSpec} from './owner-lesson-preview.mjs';
const job=()=>({spec:{template:{spec:{template:{spec:{serviceAccountName:'elevate-worker-runtime@elegant-racer-299721.iam.gserviceaccount.com',containers:[{image:'registry.example/old@sha256:'+'a'.repeat(64),resources:{limits:{cpu:'4',memory:'8Gi'}},env:Object.entries({NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service',ELEVATE_MEDIA_ENDPOINT:'https://s3.us-west-004.backblazeb2.com',ELEVATE_MEDIA_ACCESS_KEY_ID:'00'+'a'.repeat(23),ELEVATE_MEDIA_SECRET_ACCESS_KEY:'test-secret',ELEVATE_MEDIA_BUCKET:'elevate-course-media',ELEVATE_MEDIA_PUBLIC_URL:'https://media.example.org'}).map(([name,value])=>({name,value}))}]}}}}}});
const b2Read=(url)=>url.includes('b2_authorize_account')?{accountId:'test-account',authorizationToken:'test-token',apiInfo:{storageApi:{s3ApiUrl:'https://s3.us-west-004.backblazeb2.com',downloadUrl:'https://f004.backblazeb2.com',apiUrl:'https://api004.backblazeb2.com',allowed:{buckets:[{name:'elevate-course-media'}],capabilities:['listFiles','readFiles','writeFiles','listBuckets'],namePrefix:null}}}}:url.includes('b2_list_buckets')?{buckets:[{bucketName:'elevate-course-media',bucketType:'allPublic'}]}:null;
test('preview uses only the existing scoped identity, database, B2 bucket, and allocation',()=>{
 const input=job(),before=structuredClone(input),out=previewRuntime(input);
 assert.equal(out.env.NEXT_PUBLIC_SUPABASE_URL,'https://cuxzzpsyufcewtmicszk.supabase.co');assert.deepEqual(input,before);
});
test('wrong identity, resources, database, or provider cannot silently fall back',()=>{
 for(const mutate of [x=>x.spec.template.spec.template.spec.serviceAccountName='admin',x=>x.spec.template.spec.template.spec.containers[0].resources.limits.cpu='8',x=>x.spec.template.spec.template.spec.containers[0].env[0].value='https://other.supabase.co']){
  const input=job();mutate(input);assert.throws(()=>previewRuntime(input));
 }
});
test('validation performs no deployment, execution, queue write, or lease change',async()=>{
 const commands=[],methods=[];
 const run=args=>{commands.push(args);if(args[2]==='describe')return JSON.stringify(job());if(args[2]==='executions')return '[]';throw Error('unexpected mutation');};
 const request=async(url,options)=>{methods.push(options.method);return {ok:true,json:async()=>b2Read(url)??(url.includes('ultimate_course_builds')?[{profile:{lessonPresentation:'approved-premium-v1',presentationContract:{approvedReferenceVideo:{sha256:'6921ebb2f049e0183fa2f5cfebaa1a9a6e2a8242a672daebbdcb251ca0a96fc2'}}}}]:[{build_id:'572cca43-6bd6-4a91-b385-a8b576209c4e',status:'failed',lease_owner:null,lease_expires_at:null}])};};
 const out=await ownerLessonPreview({run,request,capacity:async()=>({fits:true})});
 assert.equal(out.executionStarted,false);assert.equal(out.releaseHoldChanged,false);
 assert.equal(methods.includes('PATCH'),false);assert.equal(commands.some(a=>a.some(v=>['update','deploy','execute','cancel'].includes(v))),false);
});
for(const reuseCandidate of [false,true])test('execution preserves evidence and runs exactly once; reuse='+reuseCandidate,async()=>{
 const current=job(),commands=[],writes=[];
 const digest=reuseCandidate?'sha256:52aae3310bf3e0baad12bbb5cdb97499ab1d24138705a22ec0615bda1122ca6d':'sha256:'+'b'.repeat(64);
 if(reuseCandidate)current.spec.template.spec.template.spec.containers[0].image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@'+digest;
 const run=args=>{
  commands.push(args);
  if(args[0]==='artifacts')return digest;
  if(args[2]==='describe')return JSON.stringify(current);
  if(args[2]==='executions')return '[]';
  if(args[2]==='update'){current.spec.template.spec.template.spec.containers[0].image=args.find(x=>x.startsWith('--image=')).slice(8);return '';}
  if(args[2]==='execute')return '';
  throw Error('unexpected operation');
 };
 const request=async(url,options)=>({ok:true,json:async()=>{
  if(b2Read(url))return b2Read(url);
  if(options.method==='PATCH'){writes.push(JSON.parse(options.body));return [{id:'queued'}];}
  if(url.includes('ultimate_course_builds'))return [{profile:{ownerPaused:true,lessonPresentation:'approved-premium-v1',presentationContract:{approvedReferenceVideo:{sha256:'6921ebb2f049e0183fa2f5cfebaa1a9a6e2a8242a672daebbdcb251ca0a96fc2'}}}}];
  return [{build_id:'572cca43-6bd6-4a91-b385-a8b576209c4e',status:'failed',lease_owner:null,lease_expires_at:null,attempts:5,max_attempts:5,execution_generation:80,payload:{savedCheckpoint:'kept'}}];
 }});
 const out=await ownerLessonPreview({execute:true,sha:'c'.repeat(40),reuseCandidate,run,request,capacity:async()=>({fits:true})});
 assert.equal(out.executionStarted,true);assert.equal(out.releaseHoldChanged,false);
 assert.equal(writes.length,1);assert.equal(writes[0].payload.savedCheckpoint,'kept');
 assert.equal(writes[0].max_attempts,6);assert.equal(writes[0].attempts,undefined);
 assert.equal(writes[0].execution_generation,undefined);assert.equal(writes[0].lease_owner,undefined);
 assert.equal(commands.filter(a=>a[2]==='execute').length,1);
 assert.equal(commands.filter(a=>a[2]==='update').length,reuseCandidate?0:1);
 assert.ok(commands.find(a=>a[2]==='execute').includes('--tasks=1'));
 assert.equal(commands.some(a=>a.includes('cancel')),false);
});

test('readback compares runtime values independent of JSON object property order',()=>{
 const a={template:{metadata:{annotations:{'run.googleapis.com/client-name':'old',kept:'same'}},spec:{b:2,a:1,list:[{y:2,x:1}]}}};
 const b={template:{spec:{list:[{x:1,y:2}],a:1,b:2},metadata:{annotations:{kept:'same','run.googleapis.com/client-name':'gcloud'}}}};
 assert.equal(JSON.stringify(runtimeSpec(a)),JSON.stringify(runtimeSpec(b)));
 b.template.spec.a=3;assert.notEqual(JSON.stringify(runtimeSpec(a)),JSON.stringify(runtimeSpec(b)));
 b.template.spec.a=1;b.template.spec.list.reverse();b.template.spec.list.push({x:2,y:1});
 assert.notEqual(JSON.stringify(runtimeSpec(a)),JSON.stringify(runtimeSpec(b)));
});
