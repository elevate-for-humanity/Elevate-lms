import test from 'node:test';
import assert from 'node:assert/strict';
import {imageCleanupPlan} from './cleanup-old-images.mjs';
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
