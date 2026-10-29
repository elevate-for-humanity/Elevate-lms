import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dispatchAcceptance,verifyAcceptance} from './production-acceptance.mjs';
const env={GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',ACCEPTANCE_COMPONENT:'admin',ACCEPTANCE_SHA:'a'.repeat(40),ACCEPTANCE_RUN_ID:'123',GH_TOKEN:'private-token'};
const health={service:'admin',commit:env.ACCEPTANCE_SHA,ready:true,healthy:true,dependencies:{supabase:{ok:true}},revision:'verified-revision'};
const source={head_sha:env.ACCEPTANCE_SHA,head_branch:'main',event:'workflow_dispatch',path:'.github/workflows/deploy-admin.yml',status:'completed',conclusion:'success'};
function fixture({live=health,run=source,status=204}={}) {
 const calls=[];
 const request=async(url,options)=>{calls.push({url,options});return url.includes('/api/health')?Response.json(live):url.endsWith('/runs/123')?Response.json(run):new Response(null,{status});};
 return {calls,request};
}
test('only a healthy exact live revision can explicitly dispatch E2E and non-delivering voice acceptance',async()=>{
 const f=fixture(),result=await dispatchAcceptance(env,f.request);
 assert.equal(result.acceptanceDispatched,true);assert.equal(result.acceptancePassed,false);
 assert.equal(f.calls.length,3);
 assert.deepEqual(JSON.parse(f.calls[1].options.body).inputs,{component:'admin',deployed_sha:env.ACCEPTANCE_SHA,deployment_run_id:'123'});
 assert.equal(JSON.stringify(result).includes('private-token'),false);
});
test('stale or unhealthy live services cannot start acceptance',async()=>{
 for(const live of [{...health,commit:'b'.repeat(40)},{...health,ready:false},{...health,dependencies:{}}]) {
  const f=fixture({live});await assert.rejects(dispatchAcceptance(env,f.request),/LIVE_REVISION_MISMATCH/);assert.equal(f.calls.length,1);
 }
});
test('receivers reject push dispatchers, wrong branches, unrelated workflows and failed releases',async()=>{
 for(const run of [{...source,event:'push'},{...source,head_branch:'other'},{...source,path:'.github/workflows/ci.yml'},{...source,conclusion:'failure'}]) {
  const f=fixture({run});await assert.rejects(verifyAcceptance(env,f.request),/ACCEPTANCE_DEPLOYMENT_/);
 }
});
test('receiver waits for the dispatching source run to finish then verifies the live revision',async()=>{
 let reads=0,waits=0;const f=fixture();
 const result=await verifyAcceptance(env,async(url,options)=>url.endsWith('/runs/123')&&reads++===0?Response.json({...source,status:'in_progress',conclusion:null}):f.request(url,options),async()=>{waits++;});
 assert.equal(waits,1);assert.equal(result.sourceVerified,true);
});
test('missing or untrusted identity never makes an API call and permission failures are not bypassed',async()=>{
 const f=fixture({status:403});
 await assert.rejects(dispatchAcceptance({...env,GITHUB_REPOSITORY:'other/repo'},f.request),/IDENTITY_REQUIRED/);assert.equal(f.calls.length,0);
 await assert.rejects(dispatchAcceptance(env,f.request),/GITHUB_HTTP_403/);assert.equal(f.calls.length,2);
});
test('transient health transport failures recover before a single acceptance dispatch',async()=>{
 const f=fixture();let attempts=0;
 const result=await dispatchAcceptance(env,async(url,options)=>{
  if(url.includes('/api/health') && attempts++<2)throw new DOMException('sensitive URL detail','TimeoutError');
  return f.request(url,options);
 });
 assert.equal(attempts,3);assert.equal(result.acceptanceDispatched,true);
 assert.equal(f.calls.filter(c=>c.options.method==='POST').length,2);
});
test('exhausted health failures have sanitized stage evidence and never dispatch',async()=>{
 let attempts=0;
 await assert.rejects(dispatchAcceptance(env,async()=>{attempts++;throw new TypeError('private-token');}),/^Error: ACCEPTANCE_HEALTH_TRANSPORT_FAILED$/);
 assert.equal(attempts,3);
});
test('ambiguous dispatch failures are never retried',async()=>{
 const f=fixture();let posts=0;
 await assert.rejects(dispatchAcceptance(env,async(url,options)=>{
  if(options.method==='POST'){posts++;throw new DOMException('private-token','TimeoutError');}
  return f.request(url,options);
 }),/^Error: ACCEPTANCE_DISPATCH_TRANSPORT_FAILED$/);
 assert.equal(posts,1);
});
test('all four real deployment jobs explicitly hand off acceptance, never their push dispatchers',()=>{
 for(const [file,dependency,component] of [['deploy-admin.yml','deploy-admin','admin'],['deploy-google-lms-trigger.yml','deploy','lms'],['deploy-google-marketing-trigger.yml','deploy','marketing'],['deploy-google-store-runtime.yml','deploy','store']]) {
  const source=readFileSync(new URL('../../.github/workflows/'+file,import.meta.url),'utf8');
  const job=source.slice(source.indexOf('\n  acceptance:'));
  assert.ok(source.includes("'scripts/gcp/production-acceptance.*'"));
  assert.ok(job.includes('needs: '+dependency));
  assert.ok(job.includes(`needs.${dependency}.result == 'success'`));
  assert.ok(job.includes("github.event_name == 'workflow_dispatch'"));
  assert.ok(job.includes('ACCEPTANCE_COMPONENT: '+component));
  assert.ok(job.includes('node scripts/gcp/production-acceptance.mjs dispatch'));
 }
});
