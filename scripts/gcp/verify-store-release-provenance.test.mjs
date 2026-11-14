import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyStoreReleaseProvenance} from './verify-store-release-provenance.mjs';
const sha='a'.repeat(40),mainSha='b'.repeat(40);
function fixture({status='ahead',deployed=true,runSha=sha,jobName='deploy'}={}){const calls=[];return {calls,sha,mainSha,token:'fixture-private-token',async request(url,options){calls.push(url);assert.equal(options.redirect,'error');return Response.json(url.includes('/compare/')?{status}:url.includes('/jobs?')?{jobs:[{name:jobName,status:'completed',conclusion:deployed?'success':'skipped'}]}:{workflow_runs:[{id:123,head_sha:runSha,path:'.github/workflows/deploy-google-store-runtime.yml',status:'completed',conclusion:'success'}]});}};}
test('accepts the exact successful Store deployment through later operational-only main commits',async()=>{const f=fixture(),r=await verifyStoreReleaseProvenance(f);assert.equal(r.acceptedDeploymentRun,123);assert.equal(r.source,sha);assert.ok(!JSON.stringify(r).includes('private'));});
for(const [name,options]of [['unrelated source',{status:'diverged'}],['undeployed source',{deployed:false}],['another source',{runSha:'c'.repeat(40)}]])test('refuses '+name+' without creating any infrastructure',async()=>{await assert.rejects(verifyStoreReleaseProvenance(fixture(options)));});
test('invalid source values cannot enter API paths',async()=>{const f=fixture();await assert.rejects(verifyStoreReleaseProvenance({...f,sha:'../main'}));assert.equal(f.calls.length,0);});
test('recognizes the deployment job actually declared by the Store workflow',async()=>{const workflow=readFileSync(new URL('../../.github/workflows/deploy-google-store-runtime.yml',import.meta.url),'utf8');const jobName=workflow.match(/\n  deploy:\n    name: ([^\n]+)/)?.[1];assert.ok(jobName);const result=await verifyStoreReleaseProvenance(fixture({jobName}));assert.equal(result.acceptedDeploymentRun,123);await assert.rejects(verifyStoreReleaseProvenance(fixture({jobName,deployed:false})));});
for(const jobName of ['Build and upload Store image','acceptance','Deploy and verify Admin on Google'])test('does not mistake '+jobName+' for a successful Store deployment',async()=>{await assert.rejects(verifyStoreReleaseProvenance(fixture({jobName})));});
const exactRun={id:123,head_sha:sha,head_branch:'main',event:'workflow_dispatch',path:'.github/workflows/deploy-google-store-runtime.yml',status:'completed',conclusion:'success'};
function handoff({run=exactRun,job='success',pendingReads=0}={}) {
 const calls=[];let reads=0,waits=0;
 return {sha,mainSha,runId:'123',token:'fixture-private-token',calls,get waits(){return waits;},delay:async()=>{waits++;},request:async(url)=>{
  calls.push(url);
  if(url.includes('/compare/'))return Response.json({status:'ahead'});
  if(url.endsWith('/runs/123'))return Response.json(reads++<pendingReads?{...run,status:'in_progress',conclusion:null}:run);
  if(url.endsWith('/runs/123/jobs?per_page=100'))return Response.json({jobs:[{name:'Deploy and verify Store on Google',status:'completed',conclusion:job}]});
  throw Error('Unexpected API path');
 }};
}
test('exact payment handoff waits for its dispatching release to complete before accepting its successful deployment',async()=>{
 const f=handoff({pendingReads:2}),result=await verifyStoreReleaseProvenance(f);
 assert.equal(f.waits,2);assert.equal(result.acceptedDeploymentRun,123);
 assert.equal(f.calls.some(url=>url.includes('actions/runs?head_sha=')),false);
});
test('exact handoff rejects wrong source, workflow, branch, event, run ID and unsuccessful source',async()=>{
 for(const run of [{...exactRun,id:124},{...exactRun,head_sha:mainSha},{...exactRun,head_branch:'other'},{...exactRun,event:'push'},{...exactRun,path:'.github/workflows/deploy-admin.yml'},{...exactRun,conclusion:'failure'}]) {
  const f=handoff({run});await assert.rejects(verifyStoreReleaseProvenance(f),/STORE_RELEASE_/);
  assert.equal(f.calls.some(url=>url.includes('/jobs?')),false);
 }
 await assert.rejects(verifyStoreReleaseProvenance(handoff({job:'skipped'})),/STORE_RELEASE_/);
});
test('unfinished source exhausts a bounded wait without accepting a deployment',async()=>{
 const f=handoff({pendingReads:100});
 await assert.rejects(verifyStoreReleaseProvenance(f),/STORE_RELEASE_DEPLOYMENT_COMPLETION_TIMEOUT/);
 assert.equal(f.calls.filter(url=>url.endsWith('/runs/123')).length,36);
 assert.equal(f.waits,35);
 assert.equal(f.calls.some(url=>url.includes('/jobs?')),false);
});
test('invalid exact deployment run cannot enter API paths',async()=>{
 for(const runId of ['../123','0','123/other',0,null,false,[]]){const f=handoff();await assert.rejects(verifyStoreReleaseProvenance({...f,runId}),/STORE_RELEASE_SOURCE_REQUIRED/);assert.equal(f.calls.length,0);}
});
test('payment workflow passes the optional exact source run to its unchanged provenance gate',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/migrate-store-paypal-config.yml',import.meta.url),'utf8');
 assert.ok(workflow.includes('      deployment_run_id:'));
 assert.ok(workflow.includes('STORE_PAYPAL_DEPLOYMENT_RUN_ID: ${{ inputs.deployment_run_id }}'));
 assert.ok(workflow.includes("if: inputs.routing != 'none' && inputs.routing != ''"));
});
