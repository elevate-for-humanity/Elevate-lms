import {execFileSync} from 'node:child_process';
const read=args=>{
 try{return JSON.parse(execFileSync('gcloud',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024,timeout:60000}));}
 catch(error){
  // Native errors include captured stdout, which can contain raw configuration.
  // Keep that evidence private and emit only the bounded operation failure code.
  throw new Error('COURSE_DIAGNOSTIC_READ_FAILED:'+String(error.code??'INVALID_RESPONSE'));
 }
};
const jobs=[['elevate-course-builder','us-central1'],['elevate-course-builder-parallel','us-east1'],['elevate-course-instruction','us-east1'],['elevate-course-media','us-east1'],['elevate-course-quality','us-east1']];
for(const [job,region] of jobs){
 const config=read(['run','jobs','describe',job,'--region='+region,'--project=elegant-racer-299721','--format=json']);
 const task=config.spec?.template?.spec?.template?.spec;
 console.log(JSON.stringify({job,region,image:task?.containers?.[0]?.image,resources:task?.containers?.[0]?.resources?.limits,timeoutSeconds:task?.timeoutSeconds}));
 const runs=read(['run','jobs','executions','list','--job='+job,'--region='+region,'--project=elegant-racer-299721','--limit=6','--format=json']);
 console.log(JSON.stringify({job,region,executions:runs.map(r=>({name:r.metadata?.name,image:r.spec?.template?.spec?.containers?.[0]?.image,start:r.status?.startTime,end:r.status?.completionTime,running:r.status?.runningCount,failed:r.status?.failedCount,conditions:r.status?.conditions?.map(c=>({type:c.type,status:c.status,reason:c.reason}))}))}));
}
const logs=read(['logging','read','resource.type="cloud_run_job" AND ('+jobs.map(([job])=>'resource.labels.job_name="'+job+'"').join(' OR ')+') AND NOT logName:"cloudaudit.googleapis.com"','--project=elegant-racer-299721','--freshness=2h','--limit=1000','--format=json']);
const patterns=[[/memory|OOM|SIGKILL/i,'memory_or_kill'],[/timeout|timed out/i,'timeout'],[/heartbeat.*failed|fetch failed|ECONNRESET|ETIMEDOUT|TLS/i,'connection_failure'],[/lease.*lost|LEASE_LOST/i,'lease_lost'],[/terminated|exit|killed|signal/i,'process_exit'],[/GOOGLE_TEACHING_PHOTO|RESOURCE_EXHAUSTED|429/i,'photo_provider_failure'],[/progress stalled|PROGRESS_STALLED/i,'progress_stall']];
for(const e of logs){const s=JSON.stringify(e.textPayload??e.jsonPayload??'');const categories=patterns.filter(([p])=>p.test(s)).map(([,c])=>c);if(categories.length)console.log(JSON.stringify({at:e.timestamp,job:e.resource?.labels?.job_name,execution:e.labels?.['run.googleapis.com/execution_name'],categories,events:['heartbeat failed','progress stalled','poll error','fatal','segment complete','segment started','job claimed','processed'].filter(event=>s.includes(event)),codes:[...new Set(s.match(/ULTIMATE_[A-Z_]+|GOOGLE_TEACHING_[A-Z_]+|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|UND_ERR_[A-Z_]+|AbortError|TimeoutError|SIGKILL/g)??[])]}));}


// A database timeout alone does not distinguish an unavailable server from a
// stalled inference process. Correlate safe liveness events from the same
// execution; never print raw messages, URLs, request bodies or runtime config.
const liveness=new Map();
for(const entry of [...logs].reverse()){
 const message=JSON.stringify(entry.textPayload??entry.jsonPayload??'');
 const event=['job claimed','heartbeat acknowledged','heartbeat failed','progress stalled','lease lost; not changing job state','segment started','segment complete','processed'].find(value=>message.includes(value));
 if(!event)continue;
 const execution=entry.labels?.['run.googleapis.com/execution_name'];
 if(!execution)continue;
 const timeline=liveness.get(execution)??[];
 timeline.push({at:entry.timestamp,event});liveness.set(execution,timeline);
}
for(const [execution,timeline]of liveness)console.log(JSON.stringify({execution,liveness:timeline.slice(-24)}));

// Read rollout state without emitting runtime environment or secret bindings.
const admin=read(['run','services','describe','elevate-admin-migration','--project=elegant-racer-299721','--region=us-central1','--format=json']);
console.log(JSON.stringify({service:'elevate-admin-migration',latestCreated:admin.status?.latestCreatedRevisionName,latestReady:admin.status?.latestReadyRevisionName,conditions:admin.status?.conditions?.map(c=>({type:c.type,status:c.status,reason:c.reason})),traffic:admin.status?.traffic?.filter(t=>t.percent>0).map(t=>({revision:t.revisionName,percent:t.percent}))}));
if(admin.status?.latestCreatedRevisionName){
 const revision=read(['run','revisions','describe',admin.status.latestCreatedRevisionName,'--project=elegant-racer-299721','--region=us-central1','--format=json']);
 console.log(JSON.stringify({revision:revision.metadata?.name,created:revision.metadata?.creationTimestamp,image:revision.spec?.containers?.[0]?.image,conditions:revision.status?.conditions?.map(c=>({type:c.type,status:c.status,reason:c.reason}))}));
}
