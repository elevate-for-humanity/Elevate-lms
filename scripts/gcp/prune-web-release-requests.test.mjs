import test from 'node:test';
import assert from 'node:assert/strict';
import {pruneWebReleaseRequests,assertLatestWebReleaseRequest,releaseApi,WEB_RELEASE_WORKFLOWS} from './prune-web-release-requests.mjs';
const repository='elevate-for-humanity/Elevate-lms';
const row=(id,status='pending',extra={})=>({id,run_number:id,event:'workflow_dispatch',head_branch:'main',status,...extra});
function fixture({rows=[row(1),row(2)],current,started=false,invalid=false}={}) {
 const writes=[];let reads=0;
 const api=async(path,method)=>{
  if(method==='POST'){writes.push(path);return {};}
  if(path.includes('/workflows/'))return {workflow_runs:path.includes(WEB_RELEASE_WORKFLOWS[0])?rows:[]};
  if(path.includes('/jobs'))return invalid?{}:{total_count:1,jobs:[{name:'Build and deploy Admin on Google',status:started?'in_progress':'pending',started_at:started?'2026-10-18T00:00:00Z':null}]};
  reads++;return current?.(reads)??rows[0];
 };
 return {api,writes};
}
test('only the older unstarted same-app main dispatch is canceled',async()=>{
 const f=fixture();const r=await pruneWebReleaseRequests({...f,repository,execute:true});
 assert.deepEqual(f.writes,[`repos/${repository}/actions/runs/1/cancel`]);assert.equal(r[0].runId,1);
});
test('dry run preserves requests',async()=>{const f=fixture();await pruneWebReleaseRequests({...f,repository});assert.deepEqual(f.writes,[]);});
test('active runs, started jobs, current requests and other branches remain untouched',async()=>{
 for(const options of [{rows:[row(1,'in_progress'),row(2)]},{started:true},{rows:[row(1)]},{rows:[row(1,'pending',{head_branch:'fix'}),row(2)]},{current:()=>row(1,'in_progress')},{current:n=>row(1,n===1?'pending':'in_progress')}]){
  const f=fixture(options);await pruneWebReleaseRequests({...f,repository,execute:true});assert.deepEqual(f.writes,[]);
 }
});
test('unreadable job inventory or another repository cannot authorize cancellation',async()=>{
 const f=fixture({invalid:true});await assert.rejects(pruneWebReleaseRequests({...f,repository,execute:true}),/INVENTORY/);assert.deepEqual(f.writes,[]);
 await assert.rejects(pruneWebReleaseRequests({...fixture(),repository:'another/repository',execute:true}),/NOT_AUTHORIZED/);
});
test('only the newest request for the selected app can start an expensive build',async()=>{
 const f=fixture();const workflow=WEB_RELEASE_WORKFLOWS[0];
 await assert.rejects(assertLatestWebReleaseRequest({...f,repository,workflow,runId:1}),/SUPERSEDED/);
 assert.equal((await assertLatestWebReleaseRequest({...f,repository,workflow,runId:2})).runId,2);
 assert.deepEqual(f.writes,[]);
});
test('large GitHub inventories are read without a subprocess output buffer',async()=>{
 const payload={workflow_runs:[{...row(1),head_commit:{message:'x'.repeat(2_000_000)}}]};
 const result=await releaseApi(`repos/${repository}/actions/workflows/deploy-admin.yml/runs`,'GET',{token:'test-token',request:async(url,options)=>{
  assert.equal(new URL(url).hostname,'api.github.com');assert.equal(options.headers.Authorization,'Bearer test-token');return Response.json(payload);
 }});
 assert.equal(result.workflow_runs[0].head_commit.message.length,2_000_000);
});
test('GitHub failure, missing credentials and foreign API paths fail closed',async()=>{
 await assert.rejects(releaseApi(`repos/${repository}/actions/runs/1`,'GET',{token:'test',request:async()=>new Response('unavailable',{status:503})}),/HTTP_503/);
 await assert.rejects(releaseApi('repos/another/repository/actions/runs','GET',{token:'test'}),/NOT_AUTHORIZED/);
 await assert.rejects(releaseApi(`repos/${repository}/actions/runs`,'GET',{token:''}),/AUTH_REQUIRED/);
 for(const status of [202,204])assert.deepEqual(await releaseApi(`repos/${repository}/actions/runs/1/cancel`,'POST',{token:'test',request:async()=>new Response(null,{status})}),{});
});
