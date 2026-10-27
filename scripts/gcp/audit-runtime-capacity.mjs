// Read-only production capacity inventory. Never prints environment variables or secrets.
import { spawnSync } from 'node:child_process';
const project = 'elegant-racer-299721';
const regions = ['us-central1', 'us-east1'];
function query(args) {
  const result = spawnSync('gcloud', [...args, '--project='+project, '--format=json'], {encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
  if (result.status !== 0) return {error:'unavailable',operation:args.slice(0,3).join(' ')};
  try {return JSON.parse(result.stdout||'null')} catch {return {error:'invalid_json'}}
}
function compact(service) {
  const t=service.spec?.template?.spec||{};
  const a=t.containers?.[0]||{};
  const annotations=service.spec?.template?.metadata?.annotations||{};
  return {
    name:service.metadata?.name,
    latestCreated:service.status?.latestCreatedRevisionName,
    latestReady:service.status?.latestReadyRevisionName,
    conditions:(service.status?.conditions||[]).map(c=>({type:c.type,status:c.status,reason:c.reason})),
    traffic:(service.status?.traffic||[]).map(x=>({revision:x.revisionName,percent:x.percent,tag:x.tag})),
    cpu:a.resources?.limits?.cpu, memory:a.resources?.limits?.memory,
    concurrency:t.containerConcurrency,
    minScale:service.metadata?.annotations?.['autoscaling.knative.dev/minScale']||annotations['autoscaling.knative.dev/minScale']||'0',
    maxScale:service.metadata?.annotations?.['autoscaling.knative.dev/maxScale']||annotations['autoscaling.knative.dev/maxScale']||null,
    cpuThrottling:annotations['run.googleapis.com/cpu-throttling']||null,
  };
}
const report={project,checkedAt:new Date().toISOString(),regions:{}};
// Access tokens are plain text, not JSON; obtain separately and never report it.
const tokenResult=spawnSync('gcloud',['auth','print-access-token'],{encoding:'utf8',timeout:15000});
const token=tokenResult.status===0?tokenResult.stdout.trim():null;
for (const region of regions) {
  const services=query(['run','services','list','--region='+region]);
  const jobs=query(['run','jobs','list','--region='+region]);
  let quotas={error:'quota_read_unavailable'};
  if(token) {
    try {
      const entries=await Promise.all(['CpuAllocPerProjectRegion','MemAllocPerProjectRegion'].map(async id=>{
        const response=await fetch('https://cloudquotas.googleapis.com/v1/projects/484736877039/locations/global/services/run.googleapis.com/quotaInfos/'+id,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
        if(!response.ok)return [id,{httpStatus:response.status}];
        const body=await response.json();
        const dimensions=body.dimensionsInfos?.find(x=>x.dimensions?.region===region);
        return [id,{value:dimensions?.details?.value??null}];
      }));
      quotas=Object.fromEntries(entries);
    }catch{quotas={error:'quota_read_unavailable'};}
  }
  report.regions[region]={
    quotas,
    services:Array.isArray(services)?services.map(compact):services,
    jobs:Array.isArray(jobs)?jobs.map(j=>({name:j.metadata?.name,parallelism:j.spec?.template?.spec?.parallelism,taskCount:j.spec?.template?.spec?.taskCount,limits:j.spec?.template?.spec?.template?.spec?.containers?.[0]?.resources?.limits})):jobs,
  };
}
console.log(JSON.stringify(report,null,2));
if (Object.values(report.regions).some(r=>!Array.isArray(r.services))) process.exitCode=1;
