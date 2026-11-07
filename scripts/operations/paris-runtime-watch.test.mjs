import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizeJobs,readJobs,collect} from './paris-runtime-watch.mjs';
const t=Date.parse('2026-11-04T10:00:00Z');
const job=(id,status,extra={})=>({id,status,monitor:{enabled:true},attempts:1,max_attempts:5,...extra});
test('reports new failure, completion and completed reversal by job id',()=>{
 const previous={byId:{a:{status:'running'},b:{status:'completed'},c:{status:'queued'}}};
 const s=summarizeJobs([job('a','failed'),job('b','running',{heartbeat_at:new Date(t).toISOString(),lease_expires_at:new Date(t+60000).toISOString()}),job('c','completed')],t,previous);
 assert.equal(s.unexplainedCompletedReversals,1);
 assert.deepEqual(s.alerts.filter(a=>['failed','completed','completed_reversal'].includes(a.type)).map(x=>x.type).sort(),['completed','completed_reversal','failed']);
});
test('flags stale leases and eligible overdue queue without waking anything',()=>{
 const s=summarizeJobs([job('a','running',{heartbeat_at:new Date(t-600000).toISOString(),lease_expires_at:new Date(t-1000).toISOString()}),
 job('b','queued',{available_at:new Date(t-3600000).toISOString()}),job('c','queued',{available_at:new Date(t+3600000).toISOString()})],t);
 assert.equal(s.staleHeartbeatCount,1);assert.equal(s.overdueEligibleCount,1);
});
test('rejects duplicate IDs and missing monitoring coverage',()=>{
 assert.throws(()=>summarizeJobs([job('a','queued'),job('a','failed')],t),/INVALID_JOB_ROWS/);
 assert.equal(summarizeJobs([job('a','failed',{monitor:{enabled:false}})],t).unmonitoredCount,1);
});
test('GET-only runtime collection never fabricates release or playback acceptance',async()=>{
 const calls=[];
 const request=async(url,options)=>{
   calls.push(options.method);
   return {ok:true,headers:{get:()=> '0-0/1'},json:async()=>[job('one','completed')]};
 };
 const result=await collect({request,env:{SUPABASE_SERVICE_ROLE_KEY:'test'},now:new Date(t)});
 assert.deepEqual(calls,['GET']);
 assert.equal(result.deployment.verifiedCloudRunDigest,false);
 assert.equal(result.learnerAcceptance.passed,false);
 assert.equal(result.publication.canonicalMismatchCount,null);
});
test('fails closed on unstable count or lack of credentials',async()=>{
 await assert.rejects(()=>readJobs({env:{}}),/CREDENTIAL_REQUIRED/);
 const request=async()=>({ok:true,headers:{get:()=> '*/bad'},json:async()=>[]});
 await assert.rejects(()=>readJobs({env:{SUPABASE_SERVICE_ROLE_KEY:'test'},request}),/UNSTABLE_COUNT/);
});
