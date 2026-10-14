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
for (const region of regions) {
  const services=query(['run','services','list','--region='+region]);
  const jobs=query(['run','jobs','list','--region='+region]);
  report.regions[region]={
    services:Array.isArray(services)?services.map(compact):services,
    jobs:Array.isArray(jobs)?jobs.map(j=>({name:j.metadata?.name,parallelism:j.spec?.template?.spec?.parallelism,taskCount:j.spec?.template?.spec?.taskCount,limits:j.spec?.template?.spec?.template?.spec?.containers?.[0]?.resources?.limits})):jobs,
  };
}
console.log(JSON.stringify(report,null,2));
if (Object.values(report.regions).some(r=>!Array.isArray(r.services))) process.exitCode=1;
