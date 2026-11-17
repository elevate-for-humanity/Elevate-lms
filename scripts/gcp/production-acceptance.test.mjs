import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
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
test('Store hands exact deployed source and run to validation-only payment acceptance',async()=>{
 const f=fixture({live:{...health,service:'store'}});
 const result=await dispatchAcceptance({...env,ACCEPTANCE_COMPONENT:'store'},f.request);
 const payment=f.calls.find(c=>c.url.endsWith('/migrate-store-paypal-config.yml/dispatches'));
 assert.ok(payment);
 assert.deepEqual(JSON.parse(payment.options.body),{ref:'main',inputs:{apply:'false',routing:'validate',store_sha:env.ACCEPTANCE_SHA,deployment_run_id:'123'}});
 assert.equal(result.acceptancePassed,false);
 assert.equal(f.calls.filter(c=>c.options.method==='POST').length,2);
});

test('LMS explicitly dispatches Host Shop QA with the exact source release identity',async()=>{
 const f=fixture({live:{...health,service:'lms'}});
 const result=await dispatchAcceptance({...env,ACCEPTANCE_COMPONENT:'lms'},f.request);
 const host=f.calls.find(c=>c.url.endsWith('/host-shop-cross-shop-acceptance.yml/dispatches'));
 assert.ok(host);
 assert.equal(host.options.method,'POST');
 assert.deepEqual(JSON.parse(host.options.body),{ref:'main',inputs:{deployed_sha:env.ACCEPTANCE_SHA,deployment_run_id:'123'}});
 assert.equal(result.acceptancePassed,false);
 assert.equal(f.calls.filter(c=>c.options.method==='POST').length,2);
});
test('Host Shop release source must finish successfully on the exact trusted LMS workflow',async()=>{
 const lmsEnv={...env,ACCEPTANCE_COMPONENT:'lms'};
 const lmsHealth={...health,service:'lms'};
 const lmsSource={...source,path:'.github/workflows/deploy-google-lms-trigger.yml'};
 const good=fixture({live:lmsHealth,run:lmsSource});
 assert.equal((await verifyAcceptance(lmsEnv,good.request)).sourceVerified,true);
 for(const bad of [{...lmsSource,conclusion:'failure'},{...lmsSource,path:'.github/workflows/ci.yml'},{...lmsSource,head_sha:'b'.repeat(40)}]){
  const f=fixture({live:lmsHealth,run:bad});
  await assert.rejects(verifyAcceptance(lmsEnv,f.request),/ACCEPTANCE_DEPLOYMENT_/);
 }
 const workflow=readFileSync(new URL('../../.github/workflows/host-shop-cross-shop-acceptance.yml',import.meta.url),'utf8');
 assert.ok(workflow.includes('node scripts/gcp/production-acceptance.mjs verify'));
 assert.ok(workflow.includes('actions: read'));
});

test('queued release-result beyond the historical three-minute window is not mistaken for failure',async()=>{
 const lmsEnv={...env,ACCEPTANCE_COMPONENT:'lms'};
 const lmsSource={...source,path:'.github/workflows/deploy-google-lms-trigger.yml'};
 const f=fixture({live:{...health,service:'lms'},run:lmsSource});
 let reads=0,waits=0;
 const result=await verifyAcceptance(lmsEnv,async(url,options)=>{
  if(url.endsWith('/runs/123')){
   reads++;
   return Response.json(reads<=48?{...lmsSource,status:'in_progress',conclusion:null}:lmsSource);
  }
  return f.request(url,options);
 },async(ms)=>{assert.equal(ms,5000);waits++;});
 assert.equal(reads,49);
 assert.equal(waits,48);
 assert.equal(result.sourceVerified,true);
 assert.equal(result.commit,env.ACCEPTANCE_SHA);
});
test('release completion verification remains finite and never trusts a perpetually queued run',async()=>{
 const lmsEnv={...env,ACCEPTANCE_COMPONENT:'lms'};
 const queued={...source,path:'.github/workflows/deploy-google-lms-trigger.yml',status:'in_progress',conclusion:null};
 let reads=0,waits=0;
 await assert.rejects(verifyAcceptance(lmsEnv,async(url)=>{
  if(url.endsWith('/runs/123')){reads++;return Response.json(queued);}
  throw Error('unexpected health request before verified completion');
 },async()=>{waits++;}),/ACCEPTANCE_DEPLOYMENT_COMPLETION_TIMEOUT/);
 assert.equal(reads,240);
 assert.equal(waits,240);
});
test('Host Shop blocks unverified manual dispatch and runs cleanup only after fixture provisioning',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/host-shop-cross-shop-acceptance.yml',import.meta.url),'utf8');
 assert.match(workflow,/deployed_sha:\s*[\s\S]*?required: true/);
 assert.match(workflow,/deployment_run_id:\s*[\s\S]*?required: true/);
 assert.ok(workflow.includes("if: " + "$" + "{{ github.event_name == 'workflow_dispatch' }}"));
 assert.match(workflow,/name: Provision two disposable approved Host Shop identities and match requests\n\s+id: provision/);
 assert.ok(workflow.includes("steps.provision.outcome == 'success' || steps.provision.outcome == 'failure'"));
});

test('Host Shop cancellation cleans partial fixtures but skips cleanup before provisioning starts',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/host-shop-cross-shop-acceptance.yml',import.meta.url),'utf8');
 const step=workflow.split('      - name: Remove disposable match requests, shops, placements, and QA users\n')[1]?.split('\n      - name:')[0];
 assert.ok(step,'fixture cleanup step must exist');
 const expression=step.match(/if:\s*\$\{\{\s*(.*?)\s*\}\}/)?.[1];
 assert.ok(expression,'fixture cleanup must have an explicit condition');
 assert.match(expression,/\balways\(\)/,'cancellation must not apply the implicit success gate');
 assert.match(step,/run: node scripts\/qa\/host-shop-cross-shop-acceptance\.mjs cleanup/);
 for(const [outcome,expected] of [['success',true],['failure',true],['cancelled',true],['skipped',false],['',false]]){
  const selected=runInNewContext(expression,{always:()=>true,steps:{provision:{outcome}}},{timeout:100});
  assert.equal(selected,expected,`cleanup scheduling after provisioning outcome ${JSON.stringify(outcome)}`);
 }
});

test('other services cannot start Store payment validation',async()=>{
 for(const component of ['admin','marketing','lms']) {
  const f=fixture({live:{...health,service:component}});
  await dispatchAcceptance({...env,ACCEPTANCE_COMPONENT:component},f.request);
  assert.equal(f.calls.some(c=>c.url.includes('/migrate-store-paypal-config.yml/')),false);
 }
});
test('Store payment dispatch is never retried after an ambiguous acknowledgement',async()=>{
 const f=fixture({live:{...health,service:'store'}});let paymentPosts=0;
 await assert.rejects(dispatchAcceptance({...env,ACCEPTANCE_COMPONENT:'store'},async(url,options)=>{
  if(url.includes('/migrate-store-paypal-config.yml/')){paymentPosts++;throw new TypeError('private-token');}
  return f.request(url,options);
 }),/^Error: ACCEPTANCE_DISPATCH_TRANSPORT_FAILED$/);
 assert.equal(paymentPosts,1);
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

test('Host Shop browser acceptance stays pinned to dispatched source SHA and current main',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/host-shop-cross-shop-acceptance.yml',import.meta.url),'utf8');
 assert.match(workflow,/DEPLOYED_SHA:.*inputs\.deployed_sha.*workflow_run\.head_sha/);
 assert.ok(workflow.includes('test "$MAIN_SHA" = "$DEPLOYED_SHA"'));
 assert.ok(workflow.includes('QA_EXPECTED_MAIN_SHA=$EXPECTED_SHA'));
 assert.ok(workflow.includes('EXPECTED_SHA="$QA_EXPECTED_MAIN_SHA"'));
 assert.ok(workflow.includes('test "$MAIN_SHA" = "$QA_EXPECTED_MAIN_SHA"'));
});
