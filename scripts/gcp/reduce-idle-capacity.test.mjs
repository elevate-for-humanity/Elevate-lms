import test from 'node:test';
import assert from 'node:assert/strict';
import {reduceIdleCapacity} from './reduce-idle-capacity.mjs';
const commit='a'.repeat(40), image='registry/image@sha256:'+'b'.repeat(64);
function state(min='1',revision='old') {return {metadata:{annotations:{}},spec:{template:{metadata:{annotations:{'autoscaling.knative.dev/minScale':min}},spec:{containers:[{image,resources:{limits:{cpu:'2',memory:'4Gi'}}}]} }},status:{url:'https://elevate-store.run.app',latestReadyRevisionName:revision,latestCreatedRevisionName:revision,conditions:[{type:'Ready',status:'True'}],traffic:[{revisionName:revision,percent:100}]}};}
test('promotes unchanged healthy image before releasing idle reservation',async()=>{
 let reads=0,updated=false,activated=false;
 const before=state(),candidate=state('0','new'),after=state('0','new');
 const result=await reduceIdleCapacity('store',{
 read:()=>[before,candidate,after][reads++],
 update:()=>{updated=true;},
 fetcher:async()=>({ok:true,json:async()=>({service:'store',healthy:true,commit,dependencies:{supabase:{ok:true}}})}),
 activate:async args=>{assert.equal(updated,true);assert.deepEqual(args,{service:'elevate-store-migration',revision:'new',commit});activated=true;return args;}
 });
 assert.equal(activated,true);assert.equal(result.imageUnchanged,true);assert.equal(result.idleReservationRemovedGiB,4);
});
test('rejects unexpected resource sizing before mutation',async()=>{
 const s=state();s.spec.template.spec.containers[0].resources.limits.memory='8Gi';
 await assert.rejects(reduceIdleCapacity('store',{read:()=>s,update:()=>assert.fail('must not update')}),/Unexpected topology/);
});
test('refuses promotion if runtime configuration changes concurrently',async()=>{
 let reads=0;const a=state(),b=state('0','new');b.spec.template.spec.containers[0].image='different';
 await assert.rejects(reduceIdleCapacity('store',{read:()=>[a,b][reads++],update:()=>{},
 fetcher:async()=>({ok:true,json:async()=>({service:'store',healthy:true,commit,dependencies:{supabase:{ok:true}}})}),
 activate:()=>assert.fail('must not promote')}),/changed unexpectedly/);
});
test('does not reduce Admin or active browser capacity',async()=>{
 await assert.rejects(reduceIdleCapacity('admin',{}),/Only request-driven/);
});
