import test from 'node:test';
import assert from 'node:assert/strict';
import {readApplicationUsage} from './application-usage.mjs';
const observedAt='2026-10-17T15:00:00.000Z';
const application={kind:'service',name:'store',region:'us-central1',serving:[{revision:'store-ready'}],configured:{cpu:'4',memory:'8Gi'},observedUsage:null};
function series(type,{time='2026-10-17T14:58:00Z',revision='store-ready',value=0.25,state='active',empty=false}={}) {
 return {resource:{type:'cloud_run_revision',labels:{project_id:'elegant-racer-299721',service_name:'store',location:'us-central1',revision_name:revision}},metric:{type,labels:{state}},points:[{interval:{endTime:time},value:type.endsWith('instance_count')?{int64Value:String(value)}:{distributionValue:{count:empty?'0':'10',mean:value}}}]};
}
test('uses sampled utilization and counts for the serving revision, without inferring allocation consumption',async()=>{
 const urls=[];
 const result=await readApplicationUsage({observedAt,applications:[application],read:async url=>{
  urls.push(new URL(url));const type=new URL(url).searchParams.get('filter').match(/metric.type = "([^"]+)"/)[1];
  if(type.endsWith('instance_count'))return {timeSeries:[series(type,{value:2,state:'active'}),series(type,{value:1,state:'idle'})]};
  return {timeSeries:[series(type,{value:0.2,time:'2026-10-17T14:55:00Z'}),series(type,{value:0.35}),series(type,{revision:'store-old',value:0.99}),series(type,{time:'2026-10-17T13:00:00Z',value:0.9})]};
 }});
 const row=result.applications[0].observedUsage.revisions[0];
 assert.equal(row.cpuPercent.value,35);assert.equal(row.memoryPercent.value,35);assert.equal(row.activeInstances.value,2);assert.equal(row.idleInstances.value,1);
 assert.equal(row.cpuPercent.sampledAt,'2026-10-17T14:58:00.000Z');assert.equal(result.applications[0].configured.cpu,'4');
 assert.equal(urls.length,3);assert.ok(urls.every(url=>url.searchParams.get('interval.startTime')==='2026-10-17T14:45:00.000Z'));
});
test('missing, empty, malformed and foreign samples never appear as zero utilization',async()=>{
 const result=await readApplicationUsage({observedAt,applications:[application],read:async url=>{
  const type=new URL(url).searchParams.get('filter').match(/metric.type = "([^"]+)"/)[1];
  const foreign=series(type);foreign.resource.labels.project_id='different-project';
  return {timeSeries:[foreign,series(type,{empty:true,value:NaN}),series(type,{value:-1}),series(type,{time:'2026-10-17T15:02:00Z'})]};
 }});
 assert.equal(result.applications[0].observedUsage,null);
});
test('verified zero samples remain distinct from missing metrics',async()=>{
 const result=await readApplicationUsage({observedAt,applications:[application],read:async url=>{
  const type=new URL(url).searchParams.get('filter').match(/metric.type = "([^"]+)"/)[1];return {timeSeries:[series(type,{value:0})]};
 }});
 assert.equal(result.applications[0].observedUsage.revisions[0].cpuPercent.value,0);
});
test('permissions and pagination limits fail closed without serializing API diagnostics',async()=>{
 let reads=0;
 const result=await readApplicationUsage({observedAt,applications:[application],read:async()=>{
  reads++;if(reads===1)throw Error('permission_denied');return {timeSeries:[],nextPageToken:'more'};
 }});
 assert.equal(reads,5);assert.equal(result.applications[0].observedUsage,null);assert.equal(result.failures.length,3);
 assert.equal(result.failures[0].code,'permission_denied');
});
