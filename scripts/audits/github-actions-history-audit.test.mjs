import test from 'node:test';
import assert from 'node:assert/strict';
import {auditHistory,summary} from './github-actions-history-audit.mjs';
const start='2026-11-06T00:00:00Z',end='2026-11-06T01:00:00Z';
const fixture={id:1,name:'PARIS verified code repair',event:'workflow_run',conclusion:'skipped',status:'completed',created_at:'2026-11-06T00:20:00Z'};
test('read-only audit preserves skipped result and exact inspected job evidence',async()=>{
 const calls=[];
 const result=await auditHistory({start,end,maxRequests:10,maxJobRequests:1,request:async(url,init)=>{
  calls.push({url,method:init.method});
  return {ok:true,json:async()=>url.includes('/jobs?')?
   {total_count:1,jobs:[{id:2,name:'monitor',conclusion:'skipped',status:'completed',steps:[{name:'conditional monitor',conclusion:'skipped'}]}]}:
   {total_count:1,workflow_runs:[fixture]}};
 }});
 assert.equal(result.runInventoryComplete,true);
 assert.equal(result.jobInventoryComplete,true);
 assert.equal(result.byWorkflow[0].skipped,1);
 assert.deepEqual(result.jobDetails[0].items[0].skipped_steps,['conditional monitor']);
 assert.ok(calls.every(c=>c.method===undefined));
 assert.match(summary(result),/Run inventory complete: \*\*true\*\*/);
});
test('bounded audit explicitly reports uninspected job details',async()=>{
 const result=await auditHistory({start,end,maxRequests:2,maxJobRequests:0,
  request:async()=>({ok:true,json:async()=>({total_count:1,workflow_runs:[fixture]})})});
 assert.equal(result.runInventoryComplete,true);
 assert.equal(result.jobInventoryComplete,false);
 assert.deepEqual(result.uninspectedJobRuns,[1]);
});
test('search truncation cannot be called an exhaustive scan',async()=>{
 const result=await auditHistory({start,end,maxRequests:2,maxJobRequests:0,
  request:async()=>({ok:true,json:async()=>({total_count:2500,workflow_runs:[]})})});
 assert.equal(result.runInventoryComplete,false);
 assert.ok(result.remainingWindows.length>0);
});

test('skip-only history backfill scopes GitHub search and all mode remains available',async()=>{
 for(const status of ['skipped','all']){
  const paths=[];
  const result=await auditHistory({start,end,status,maxRequests:2,maxJobRequests:0,
   request:async(url)=>{paths.push(url);return {ok:true,json:async()=>({total_count:0,workflow_runs:[]})};}});
  assert.equal(result.statusFilter,status);
  assert.equal(paths.length,1);
  assert.equal(paths[0].includes('status=skipped'),status==='skipped');
 }
 await assert.rejects(auditHistory({start,end,status:'untrusted'}),/HISTORY_STATUS_FILTER_INVALID/);
});
