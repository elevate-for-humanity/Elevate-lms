import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverStaleCourseRenderer} from './recover-stale-course-renderer.mjs';
const target='a9b85487-5465-4bc0-bed0-9fc3411c4e50';
const env={GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',GITHUB_SHA:'a'.repeat(40),SUPABASE_SERVICE_ROLE_KEY:'test',RENDER_RECOVERY_JOB_ID:target,RENDER_RECOVERY_GENERATION:'53'};
const image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:'+'b'.repeat(64);
function fixture({rows=[{id:target,execution_generation:53,lease_owner:'owner'}],activeImage='old-image',multiple=false,advanced=false}={}){
 let reads=0;const calls=[];
 return {calls,env,request:async(_url,options)=>{assert.equal(options.method,undefined);reads++;return {ok:true,json:async()=>advanced&&reads>1?[]:rows};},
  run:args=>{calls.push(args);
   if(args[0]==='artifacts')return JSON.stringify({image_summary:{digest:'sha256:'+'b'.repeat(64)}});
   if(args[2]==='describe')return JSON.stringify({spec:{template:{spec:{template:{spec:{containers:[{image}],serviceAccountName:'elevate-worker-runtime@elegant-racer-299721.iam.gserviceaccount.com'}}}}}});
   if(args[3]==='list')return JSON.stringify(args.includes('--job=elevate-course-builder-parallel')?[]:Array.from({length:multiple?2:1},(_,i)=>({metadata:{name:'elevate-course-builder-old-'+i},spec:{template:{spec:{containers:[{image:activeImage}]}}},status:{}})));
   return '{}';
  }};
}
test('cancels only the exclusively identified stale execution, never changes database ownership',async()=>{
 const f=fixture();assert.equal((await recoverStaleCourseRenderer(f)).state,'old_image_cancellation_requested');
 const mutations=f.calls.filter(args=>args.includes('cancel'));assert.equal(mutations.length,1);
 assert.equal(mutations[0][4],'elevate-course-builder-old-0');
});
test('an advanced generation, additional live lease, multiple executions or corrected image cannot be canceled',async()=>{
 for(const options of [{rows:[]},{rows:[{id:target,execution_generation:54,lease_owner:'owner'}]},
  {rows:[{id:target,execution_generation:53,lease_owner:'owner'},{id:'other',execution_generation:1,lease_owner:'another'}]},
  {multiple:true},{activeImage:image},{advanced:true}]){
  const f=fixture(options);await recoverStaleCourseRenderer(f);assert.equal(f.calls.some(args=>args.includes('cancel')),false);
 }
});
test('missing corrected artifact waits without canceling current work',async()=>{
 const f=fixture();f.run=()=>{throw Object.assign(Error('not found'),{code:'not_found'});};
 assert.equal((await recoverStaleCourseRenderer(f)).state,'awaiting_corrected_worker_image');
});

test('a later website commit cannot change the verified worker image identity',async()=>{
 const f=fixture();f.env={...env,RENDER_RECOVERY_WORKER_SHA:'c'.repeat(40)};
 await recoverStaleCourseRenderer(f);
 const lookup=f.calls.find(args=>args[0]==='artifacts');
 assert.ok(lookup[4].endsWith(':'+f.env.RENDER_RECOVERY_WORKER_SHA));
});
