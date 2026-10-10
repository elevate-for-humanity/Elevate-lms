import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { digest,LEGACY_SHA256,planUpdate,repair } from './repair-pbx-startup-metadata.mjs';

const replacement=readFileSync('infra/pbx/google-startup.sh','utf8');
const old='#!/usr/bin/env bash\nlegacy bootstrap\n';
const instance=(script=old)=>({name:'elevate-pbx',id:'instance',status:'RUNNING',lastStartTimestamp:'unchanged',
  zone:'https://www.googleapis.com/compute/v1/projects/elegant-racer-299721/zones/us-central1-a',
  networkInterfaces:[{accessConfigs:[{natIP:'107.178.216.162'}]}],
  metadata:{fingerprint:'lease',items:[{key:'ssh-keys',value:'private unchanged fixture'},{key:'startup-script',value:script}]}});
test('updates only the known bootstrap while preserving metadata and fingerprint',()=>{
  const current=instance(); const plan=planUpdate(current,{},replacement,digest(old));
  assert.equal(plan.metadata.fingerprint,'lease');
  assert.deepEqual(plan.metadata.items[0],current.metadata.items[0]);
  assert.equal(plan.metadata.items[1].value,replacement);
  assert.equal(current.metadata.items[1].value,old);
});
test('refuses unknown startup scripts instead of overwriting reviewed configuration',()=>{
  assert.throws(()=>planUpdate(instance(),{},replacement),/unrecognized/);
});
test('rejects startup URL scripts at instance or project level',()=>{
  const current=instance();current.metadata.items.push({key:'startup-script-url',value:'private'});
  assert.throws(()=>planUpdate(current,{},replacement,digest(old)),/additional_startup/);
  assert.throws(()=>planUpdate(instance(),{commonInstanceMetadata:{items:[{key:'startup-script-url',value:'private'}]}},replacement,digest(old)),/additional_startup/);
});
test('rejects mismatched VM identity, stopped VM and missing metadata',()=>{
  for(const current of [{...instance(),name:'other'},{...instance(),status:'STOPPED'},{...instance(),metadata:{items:[]}}]) {
    assert.throws(()=>planUpdate(current,{},replacement,digest(old)));
  }
});
test('accepts both Google resource self-link hosts while rejecting other projects and zones',()=>{
  const current=instance(replacement);
  assert.equal(planUpdate(current,{},replacement).changed,false);
  current.zone=current.zone.replace('www.googleapis.com','compute.googleapis.com');
  assert.equal(planUpdate(current,{},replacement).changed,false);
  for(const zone of [current.zone.replace('elegant-racer-299721','other'),current.zone+'?override=true',current.zone.replace('us-central1-a','us-central1-b')]) {
    assert.throws(()=>planUpdate({...current,zone},{},replacement),/identity_or_state/);
  }
});
test('already guarded metadata is verified without a write or restart',async()=>{
  const urls=[];
  const result=await repair(async(url,init)=>{urls.push([url,init]);return url.endsWith('/elevate-pbx')?instance(replacement):{};},replacement);
  assert.equal(result.result,'PASS');assert.equal(result.changed,false);
  assert.ok(urls.every(([,init])=>!init));
});
test('installed known legacy source can be reconstructed and CAS update verified without other actions',async()=>{
  // Inert historical fixture, never executed or used by the runtime repair.
  const legacy=readFileSync('scripts/gcp/fixtures/pbx-legacy-bootstrap.txt','utf8');
  assert.equal(digest(legacy),LEGACY_SHA256);
  let state=instance(legacy);const calls=[];
  const evidence=await repair(async(url,init)=>{
    calls.push([url,init?.method||'GET']);
    if(url.endsWith('/setMetadata')) {
      const payload=JSON.parse(init.body);assert.equal(payload.fingerprint,'lease');
      state={...state,metadata:payload};return {name:'operation-fixture'};
    }
    if(url.endsWith('/wait')) return {status:'DONE'};
    return url.endsWith('/elevate-pbx')?state:{};
  },replacement);
  assert.equal(evidence.changed,true);
  assert.deepEqual(calls.filter(([,method])=>method==='POST').map(([url])=>url.split('/').at(-1)),['setMetadata','wait']);
});
test('a concurrent metadata change is not overwritten by a retry',async()=>{
  const legacy=readFileSync('scripts/gcp/fixtures/pbx-legacy-bootstrap.txt','utf8');let writes=0;
  await assert.rejects(repair(async(url)=>{
    if(url.endsWith('/setMetadata')) {writes++;throw new Error('google_http_412');}
    return url.endsWith('/elevate-pbx')?instance(legacy):{};
  },replacement),/google_http_412/);
  assert.equal(writes,1);
});
test('a changed running identity after metadata update is not reported successful',async()=>{
  let reads=0;
  await assert.rejects(repair(async(url)=>{
    if(!url.endsWith('/elevate-pbx')) return {};
    const state=instance(replacement);if(++reads===2)state.lastStartTimestamp='unexpected-restart';return state;
  },replacement),/continuity_unverified/);
});
