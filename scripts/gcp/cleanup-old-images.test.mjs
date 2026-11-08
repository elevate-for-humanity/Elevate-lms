import test from 'node:test';
import assert from 'node:assert/strict';
import {imageCleanupPlan,listRegistryImages} from './cleanup-old-images.mjs';
const pkg='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/admin';
const now=Date.parse('2026-11-08T00:00:00Z');
const rows=()=>Array.from({length:16},(_,i)=>({package:pkg,version:'sha256:'+i.toString(16).padStart(64,'0'),tags:[],createTime:new Date(now-(i+40)*86400000).toISOString()}));
test('retains ten rollback versions, all tags, runtime references and manifest children',()=>{
 const images=rows();images[10].tags=['rollback'];
 const referenced=[pkg+'@'+images[11].version],children=[pkg+'@'+images[12].version];
 images[0].createTime=new Date(now-86400000).toISOString();
 const plan=imageCleanupPlan(images,{referenced,children,now});
 assert.deepEqual(plan.remove.map(x=>x.image),[13,14,15].map(i=>pkg+'@'+images[i].version));
});
test('unknown tags or timestamps never qualify for deletion; foreign repository fails closed',()=>{
 const images=rows();images[10].tags=undefined;images[11].createTime='unknown';
 assert.ok(!imageCleanupPlan(images,{now}).remove.some(x=>[10,11].some(i=>x.image.endsWith(images[i].version))));
 assert.throws(()=>imageCleanupPlan([{...images[0],package:'foreign/repo'}]),/INVENTORY_INVALID/);
});
test('an old version updated recently cannot be removed',()=>{
 const images=rows();images[12].updateTime=new Date(now-86400000).toISOString();
 images[13].updateTime='unknown';
 assert.ok(!imageCleanupPlan(images,{now}).remove.some(x=>[12,13].some(i=>x.image.endsWith(images[i].version))));
});
test('registry API normalizes upload timestamps and omitted empty tags with complete pagination',async()=>{
 const uri=pkg+'@sha256:'+'a'.repeat(64);let pages=0;
 const result=await listRegistryImages('private-token',{request:async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer private-token');pages++;
  return Response.json(pages===1?{dockerImages:[{uri,uploadTime:'2026-09-01T00:00:00Z'}],nextPageToken:'next'}:{dockerImages:[]});
 }});
 assert.equal(pages,2);assert.equal(result[0].createTime,'2026-09-01T00:00:00Z');assert.deepEqual(result[0].tags,[]);assert.ok(!JSON.stringify(result).includes('private-token'));
 await assert.rejects(listRegistryImages('token',{request:async()=>Response.json({images:[]})}),/SCHEMA_UNVERIFIED/);
});
test('seven-day policy keeps recent versions and metadata gaps cannot appear as a complete review',()=>{
 const images=rows();images[12].updateTime=new Date(now-6*86400000).toISOString();
 images[13].tags=undefined;
 const plan=imageCleanupPlan(images,{now});assert.equal(plan.retention.minimumAgeDays,7);assert.equal(plan.eligibilityReviewComplete,false);assert.equal(plan.summary.unverifiableMetadata,1);
 assert.ok(!plan.remove.some(x=>[12,13].some(i=>x.image.endsWith(images[i].version))));
});
