import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {smokeLmsContainer} from './smoke-lms-container.mjs';
const sha='a'.repeat(40);
function fixture({memory=4*2**30,swap=4*2**30,cpu=2e9,restarts=0,wrongSha=false,wrongService=false,dependency=true,guestAllowed=false,oom=false}={}) {
 const calls=[];let requests=0;
 return {calls,get requests(){return requests;},input:{sha,name:'lms-bounded-fixture',env:{NEXT_PUBLIC_SUPABASE_URL:'public',NEXT_PUBLIC_SUPABASE_ANON_KEY:'public',PRIVATE_KEY:'must-not-forward'},delay:async()=>{},
  docker:args=>{calls.push(args);if(args[0]==='inspect')return JSON.stringify({State:{Running:true,OOMKilled:oom&&requests>4},RestartCount:restarts,HostConfig:{Memory:memory,MemorySwap:swap,NanoCpus:cpu}});if(args[0]==='port')return '127.0.0.1:3001';return 'started';},
  request:async url=>{
   requests++;const path=new URL(url).pathname;
   if(path==='/login')return new Response('<html>'+('x'.repeat(1200))+'</html>',{headers:{'content-type':'text/html'}});
   if(path==='/lms/dashboard')return guestAllowed?new Response('private page'):new Response(null,{status:307,headers:{location:'/login?redirect=%2Flms%2Fdashboard'}});
   return Response.json({service:wrongService?'marketing':'lms',commit:wrongSha?'b'.repeat(40):sha,ok:true,ready:true,healthy:true,configuration:{ok:true},dependencies:{supabase:{ok:dependency}}});
  }}};
}
test('native acceptance enforces 2 CPU/4 GiB with no swap, bounded SSR and exact dependency health',async()=>{
 const f=fixture(),r=await smokeLmsContainer(f.input);
 assert.equal(r.renderedRequests,12);assert.equal(r.memoryBytes,4*2**30);assert.equal(r.exactHealthVerified,true);
 assert.ok(f.calls[0].includes('--cpus=2'));assert.ok(f.calls[0].includes('--memory=4g'));assert.ok(f.calls[0].includes('--memory-swap=4g'));
 assert.equal(JSON.stringify(f.calls).includes('PRIVATE_KEY'),false);
 assert.deepEqual(f.calls.at(-1),['rm','-f','lms-bounded-fixture']);
});
for(const [name,options] of [['unbounded memory',{memory:8*2**30}],['extra swap',{swap:8*2**30}],['different CPU limit',{cpu:4e9}],['restarted process',{restarts:1}],['wrong immutable commit',{wrongSha:true}],['another service',{wrongService:true}],['failed dependency',{dependency:false}],['guest access to LMS',{guestAllowed:true}],['OOM after page traffic',{oom:true}]]) {
 test('rejects '+name+' and cleans its own container',async()=>{
  const f=fixture(options);await assert.rejects(smokeLmsContainer(f.input),/LMS_SMOKE_/);
  assert.deepEqual(f.calls.at(-1),['rm','-f','lms-bounded-fixture']);
 });
}
test('mutable images and unsafe container names cannot run Docker',async()=>{
 for(const options of [{image:'elevate-lms:main'},{name:'other-user-container'}]){
  const f=fixture();await assert.rejects(smokeLmsContainer({...f.input,...options}),/LMS_SMOKE_/);assert.deepEqual(f.calls,[]);
 }
});
test('native load failures do not leave a running smoke container',async()=>{
 const f=fixture();const request=f.input.request;f.input.request=async url=>new URL(url).pathname==='/login'?Promise.reject(Error('private error')):request(url);
 await assert.rejects(smokeLmsContainer(f.input));assert.deepEqual(f.calls.at(-1),['rm','-f','lms-bounded-fixture']);
});
test('cold transport failures stop at the startup deadline rather than looping indefinitely',async()=>{
 const f=fixture();let clock=0,requests=0;f.input.now=()=>clock;f.input.delay=async ms=>{clock+=ms;};
 f.input.request=async()=>{requests++;clock+=60000;throw new TypeError('connection unavailable');};
 await assert.rejects(smokeLmsContainer(f.input),/STARTUP_UNVERIFIED/);assert.equal(requests,2);
 assert.deepEqual(f.calls.at(-1),['rm','-f','lms-bounded-fixture']);
});
test('malformed startup responses cannot pass identity or trigger repeated HTTP probes',async()=>{
 const f=fixture();let requests=0;f.input.request=async()=>{requests++;return new Response('not JSON');};
 await assert.rejects(smokeLmsContainer(f.input),/STARTUP_RESPONSE_INVALID/);assert.equal(requests,1);
 assert.deepEqual(f.calls.at(-1),['rm','-f','lms-bounded-fixture']);
});
test('LMS profile is scoped, capacity-checked and smoke-tested before any Google service update',()=>{
 const read=name=>readFileSync(new URL('../../.github/workflows/'+name,import.meta.url),'utf8');
 const deploy=read('deploy-google-repaired.yml'),trigger=read('deploy-google-lms-trigger.yml'),gate=read('consolidation-docker-northflank.yml');
 assert.ok(trigger.includes('candidate_size: lms-2cpu-4gi'));
 const profile=deploy.slice(deploy.indexOf('            lms-2cpu-4gi)'),deploy.indexOf("            *) echo"));
 assert.ok(profile.includes('test "$COMPONENT" = lms'));assert.ok(profile.includes('CANDIDATE_CPU=2 CANDIDATE_MEMORY=4Gi'));
 assert.ok(profile.includes('smoke-lms-container.mjs'));assert.ok(profile.includes('SMOKE_IMAGE="$IMAGE@$DIGEST"'));
 assert.ok(deploy.indexOf('preflight-web-rollout.mjs')<deploy.indexOf('gcloud run services update "$SERVICE"'));
 assert.ok(gate.includes("if: matrix.service == 'lms'"));assert.ok(gate.includes('node scripts/gcp/smoke-lms-container.mjs'));
});
