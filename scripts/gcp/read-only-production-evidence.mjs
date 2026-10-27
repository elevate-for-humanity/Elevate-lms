/**
 * Read-only Cloud Run production evidence. No traffic, IAM, quota or scaling writes.
 * A reachable external probe is not a substitute for authenticated Cloud Run health.
 */
import {execFileSync} from 'node:child_process';
const project='elegant-racer-299721', region='us-central1';
const token=execFileSync('gcloud',['auth','print-access-token'],{encoding:'utf8'}).trim();
const hdr={Authorization:'Bearer '+token};
const root=`https://run.googleapis.com/v2/projects/${project}/locations/${region}`;
async function get(url) {
  const r=await fetch(url,{headers:hdr,signal:AbortSignal.timeout(20000)});
  const body=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(`HTTP ${r.status}: ${JSON.stringify(body).slice(0,500)}`);
  return body;
}
const services=['elevate-marketing-migration','elevate-lms-migration','elevate-admin-migration','elevate-store-migration','elevate-studio-browser'];
const main=process.env.GITHUB_SHA||'unknown';
console.log(JSON.stringify({type:'source',main,project,region}));
let possibleCpu=0, possibleMemoryGi=0, errors=0;
for(const name of services){
  try {
    const s=await get(`${root}/services/${name}`);
    const allocations=(s.template?.containers||[]).map(c=>({cpu:c.resources?.limits?.cpu||null,memory:c.resources?.limits?.memory||null}));
    const cpu=allocations.reduce((t,c)=>t+Number(c.cpu||0),0);
    const memoryGi=allocations.reduce((t,c)=>t+(parseFloat(c.memory||'0')*(String(c.memory||'').endsWith('Mi')?1/1024:1)),0);
    const max=s.template?.scaling?.maxInstanceCount ?? s.scaling?.maxInstanceCount ?? null;
    if(max!=null){possibleCpu+=cpu*Number(max);possibleMemoryGi+=memoryGi*Number(max);}
    const traffic=(s.trafficStatuses||s.traffic||[]).map(t=>({revision:t.revision||null,percent:t.percent||0,tag:t.tag||null}));
    console.log(JSON.stringify({type:'service',name,ready:s.terminalCondition?.state||s.conditions?.find(c=>c.type==='Ready')?.state||null,latestReadyRevision:s.latestReadyRevision||null,traffic,allocations,min:s.template?.scaling?.minInstanceCount??s.scaling?.minInstanceCount??0,max,uri:s.uri||null,warning:traffic.length===0?'No observed traffic allocation; do not infer 100%':undefined}));
  }catch(e){errors++;console.log(JSON.stringify({type:'service_error',name,error:e.message}));}
}
for(const name of ['elevate-course-builder','elevate-video-render']){
  try {
    const j=await get(`${root}/jobs/${name}`);
    console.log(JSON.stringify({type:'job',name,taskCount:j.template?.taskCount??null,parallelism:j.template?.parallelism??null,limits:j.template?.template?.containers?.map(c=>c.resources?.limits)||[],latestCreatedExecution:j.latestCreatedExecution?.name||null}));
  }catch(e){console.log(JSON.stringify({type:'job_unavailable',name,error:e.message}));}
}
try {
 const number=execFileSync('gcloud',['projects','describe',project,'--format=value(projectNumber)'],{encoding:'utf8'}).trim();
 const base=`https://serviceusage.googleapis.com/v1beta1/projects/${number}/services/run.googleapis.com/consumerQuotaMetrics?view=FULL&pageSize=200`;
 let url=base,count=0;
 do{
  const q=await get(url);
  for(const m of q.metrics||[]) {
    const str=JSON.stringify(m);
    if(/cpu|memory|instance|allocation/i.test(str)) console.log(JSON.stringify({type:'quota_metric',metric:m.metric,consumerQuotaLimits:m.consumerQuotaLimits}));
    count++;
  }
  url=q.nextPageToken?base+'&pageToken='+encodeURIComponent(q.nextPageToken):null;
 }while(url);
 console.log(JSON.stringify({type:'quota_inventory',metricCount:count}));
}catch(e){errors++;console.log(JSON.stringify({type:'quota_error',error:e.message}));}
console.log(JSON.stringify({type:'configured_maximum_estimate',cpu:possibleCpu,memoryGi:possibleMemoryGi,note:'Not current instance allocation; may exclude rollout overlap and jobs. Requires effective regional quota and current Cloud Run metrics.'}));
if(errors)process.exitCode=1;
