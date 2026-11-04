#!/usr/bin/env node
// Read-only Course Builder runtime observer. No PATCH/POST, worker dispatch,
// publication changes, GitHub writes, or use of service-role credentials in logs.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const PROJECT='cuxzzpsyufcewtmicszk';
const BASE='https://'+PROJECT+'.supabase.co/rest/v1/';
const STATES=['failed','queued','running','completed'];

export function summarizeJobs(rows, now=Date.now(), previous=null) {
 const counts=Object.fromEntries(STATES.map(s=>[s,0]));
 const byId={};
 const alerts=[];
 let staleHeartbeatCount=0, overdueEligibleCount=0, unexplainedCompletedReversals=0, unmonitoredCount=0;
 const seen=new Set();
 for(const job of rows) {
   if(!job?.id || seen.has(job.id) || !STATES.includes(job.status)) throw Error('INVALID_JOB_ROWS');
   seen.add(job.id);
   counts[job.status]++;
   byId[job.id]={status:job.status,attempts:job.attempts,last_error:job.last_error ?? null};
   if(['failed','queued','running'].includes(job.status) && job.monitor?.enabled!==true) unmonitoredCount++;
   if(job.status==='running'){
     const beat=Date.parse(job.heartbeat_at ?? '');
     const lease=Date.parse(job.lease_expires_at ?? '');
     if(!Number.isFinite(beat)||beat>now+300000||now-beat>300000||!Number.isFinite(lease)||lease<=now) {
       staleHeartbeatCount++;alerts.push({type:'stale_worker',jobId:job.id});
     }
   }
   if(job.status==='queued' && job.available_at && job.available_at!=='infinity'){
      const eligible=Date.parse(job.available_at);
      if(Number.isFinite(eligible) && now-eligible>30*60*1000){
        overdueEligibleCount++;alerts.push({type:'overdue_queue',jobId:job.id});
      }
   }
   const prior=previous?.byId?.[job.id];
   if(prior && prior.status!==job.status){
      if(job.status==='completed') alerts.push({type:'completed',jobId:job.id,prior:prior.status});
      if(job.status==='failed') alerts.push({type:'failed',jobId:job.id,prior:prior.status});
      if(prior.status==='completed' && job.status!=='completed'){
        unexplainedCompletedReversals++;alerts.push({type:'completed_reversal',jobId:job.id,next:job.status});
      }
   }
 }
 return {counts,byId,alerts,staleHeartbeatCount,overdueEligibleCount,
   unexplainedCompletedReversals,unmonitoredCount,
   exhaustedCount:rows.filter(j=>j.status==='failed'&&Number.isFinite(Number(j.attempts))&&
      Number.isFinite(Number(j.max_attempts))&&Number(j.attempts)>=Number(j.max_attempts)).length};
}

export async function readJobs({request=fetch,env=process.env}={}){
 const key=env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key) throw Error('READ_ONLY_OBSERVER_CREDENTIAL_REQUIRED');
 const rows=[]; let offset=0; let total=null;
 while(true){
   const url=new URL('ultimate_build_jobs',BASE);
   url.searchParams.set('select','id,status,attempts,max_attempts,last_error,available_at,heartbeat_at,lease_expires_at,monitor');
   url.searchParams.set('order','id.asc');
   url.searchParams.set('limit','500');url.searchParams.set('offset',String(offset));
   const res=await request(url,{method:'GET',headers:{apikey:key,Authorization:'Bearer '+key,Prefer:'count=exact'},signal:AbortSignal.timeout(25000)});
   if(!res.ok)throw Error('OBSERVER_READ_HTTP_'+res.status);
   const page=await res.json();
   if(!Array.isArray(page))throw Error('OBSERVER_READ_INVALID');
   const count=Number((res.headers.get('content-range')||'').split('/')[1]);
   if(!Number.isSafeInteger(count)||count<0||total!==null&&total!==count)throw Error('OBSERVER_READ_UNSTABLE_COUNT');
   total=count;rows.push(...page);
   if(rows.length>=total) {
     if(rows.length!==total)throw Error('OBSERVER_READ_INCONSISTENT');
     return rows;
   }
   if(page.length!==500)throw Error('OBSERVER_READ_INCOMPLETE');
   offset+=500;
   if(offset>100000)throw Error('OBSERVER_PAGINATION_LIMIT');
 }
}
export async function collect({request=fetch,env=process.env,now=new Date(),previous=null}={}){
 const rows=await readJobs({request,env});
 const summary=summarizeJobs(rows,now.getTime(),previous);
 return {
   capturedAt:now.toISOString(),source:'verified-runtime-readonly',projectId:PROJECT,
   // Do not assert Cloud Run provenance, publication integrity or playback from
   // a jobs-only REST read. The release gate must remain blocked until sourced.
   deployment:{verifiedCloudRunDigest:false,productionAcceptancePassed:false,imageDigest:null},
   jobs:{...summary.counts,staleHeartbeatCount:summary.staleHeartbeatCount,
     overdueEligibleCount:summary.overdueEligibleCount,
     unexplainedCompletedReversals:summary.unexplainedCompletedReversals,
     unauthorizedOwnerPauseCount:null},
   monitoring:{allUnresolvedJobsCovered:summary.unmonitoredCount===0},
   publication:{canonicalMismatchCount:null},learnerAcceptance:{passed:false},
   diagnostics:{alerts:summary.alerts,exhaustedFailures:summary.exhaustedCount,
      unmonitoredJobs:summary.unmonitoredCount,byId:summary.byId},
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try {
   const priorFile=process.argv[2];let previous=null;
   if(priorFile)previous=JSON.parse(readFileSync(priorFile,'utf8')).diagnostics;
   // Previous snapshots store the per-job map under diagnostics.
   const snapshot=await collect({previous});
   mkdirSync('audit-output',{recursive:true});
   writeFileSync('audit-output/paris-runtime-watch.json',JSON.stringify(snapshot,null,2));
   const d=snapshot.diagnostics;
   console.log(JSON.stringify({capturedAt:snapshot.capturedAt,counts:snapshot.jobs,
     alerts:d.alerts,exhaustedFailures:d.exhaustedFailures,unmonitoredJobs:d.unmonitoredJobs}));
   if(d.alerts.some(a=>['failed','stale_worker','overdue_queue','completed_reversal'].includes(a.type)))process.exitCode=1;
 } catch(error) {
   console.error('PARIS_READONLY_OBSERVER_FAILED:'+String(error.message).slice(0,100));
   process.exitCode=2;
 }
}
}
