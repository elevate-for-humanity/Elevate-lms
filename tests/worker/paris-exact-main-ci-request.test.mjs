import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureRepairMainCI } from '../../lib/ai/runtime/exact-main-ci-request.mjs';
const sha='a'.repeat(40),repository='fixture/repository',now=Date.parse('2026-11-19T14:00:00Z');
const ci={id:42,head_sha:sha,name:'CI',path:'.github/workflows/ci.yml',head_branch:'main',event:'workflow_dispatch',head_repository:{full_name:repository},status:'completed',conclusion:'success'};
async function fixture(patch={}) {
  const writes=[],intents=[];
  const base={sha,repository,runs:[],now,observationWindowMs:60000,persistIntent:async intent=>{intents.push(intent);},gh:async(path,options)=>{
    if(options?.method==='POST'){writes.push({path,body:JSON.parse(options.body)});return {};}
    if(path==='/git/ref/heads/main')return {object:{sha}};
    if(path==='/actions/runs/42/jobs?per_page=100')return {jobs:[{name:'CI Required Gate',status:'completed',conclusion:'success'}]};
    throw Error('Unexpected path '+path);
  }};
  const result=await ensureRepairMainCI({...base,...patch});return {result,writes,intents};
}
test('missing exact main CI saves intent then dispatches full CI once, never a deployment',async()=>{
  const r=await fixture();assert.equal(r.result.state,'pending');assert.equal(r.intents.length,1);
  assert.deepEqual(r.writes,[{path:'/actions/workflows/ci.yml/dispatches',body:{ref:'main',inputs:{requested_sha:sha}}}]);
});
test('upstream API lag honors existing durable intent without duplicate dispatch',async()=>{
  const r=await fixture({priorRequest:{sha,requestedAt:new Date(now-30000).toISOString()}});
  assert.equal(r.result.state,'pending');assert.deepEqual(r.writes,[]);assert.deepEqual(r.intents,[]);
});
test('unobserved CI fails closed after bounded grace without replaying request',async()=>{
  const r=await fixture({priorRequest:{sha,requestedAt:new Date(now-60000).toISOString()}});
  assert.equal(r.result.reason,'REPAIR_MAIN_CI_NOT_OBSERVED');assert.deepEqual(r.writes,[]);
});
test('queued CI never authorizes deployment',async()=>{
  const r=await fixture({runs:[{...ci,status:'queued',conclusion:null}]});assert.equal(r.result.state,'pending');assert.deepEqual(r.writes,[]);
});
test('complete exact main CI with successful required gate authorizes existing release stage',async()=>{
  const r=await fixture({runs:[ci]});assert.equal(r.result.state,'verified');assert.equal(r.result.runId,42);assert.deepEqual(r.writes,[]);
});
test('newer failed exact CI wins over older green run',async()=>{
  const r=await fixture({runs:[ci,{...ci,id:43,conclusion:'failure'}]});assert.equal(r.result.reason,'REPAIR_REQUIRED_MAIN_CI_FAILED');assert.deepEqual(r.writes,[]);
});
test('missing or failed required gate does not authorize release',async()=>{
  for(const jobs of [[],[{name:'CI Required Gate',status:'completed',conclusion:'failure'}]]){
    const r=await fixture({runs:[ci],gh:async path=>path==='/git/ref/heads/main'?{object:{sha}}:{jobs}});assert.equal(r.result.state,'blocked');assert.deepEqual(r.writes,[]);
  }
});
test('truncated or unknown run inventory fails closed without dispatch',async()=>{
  for(const runs of [null,Array.from({length:100},()=>ci)]){const r=await fixture({runs});assert.equal(r.result.reason,'REPAIR_RUN_INVENTORY_INCOMPLETE');assert.deepEqual(r.writes,[]);}
});
test('moved main never dispatches CI or treats old head as validated current main',async()=>{
  const r=await fixture({gh:async()=>({object:{sha:'b'.repeat(40)}})});assert.equal(r.result.state,'superseded');assert.deepEqual(r.writes,[]);
});
