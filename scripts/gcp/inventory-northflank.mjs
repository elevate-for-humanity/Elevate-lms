import {writeFileSync} from 'node:fs';
const token=process.env.NORTHFLANK_API_TOKEN;
if(!token) throw new Error('NORTHFLANK_API_TOKEN is not available');
const project=process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
async function get(path) {
  const r=await fetch('https://api.northflank.com/v1'+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
  if(!r.ok) throw new Error('Northflank returned HTTP '+r.status);
  const j=await r.json(); return j.data ?? j;
}
const list=await get('/projects/'+encodeURIComponent(project)+'/services');
const services=Array.isArray(list)?list:list.services;
if(!Array.isArray(services)) throw new Error('Unrecognized services response');
const report={project,services:[],failures:[]};
for(const item of services) {
  try {
    const s=await get('/projects/'+encodeURIComponent(project)+'/services/'+encodeURIComponent(item.id));
    report.services.push({id:s.id,name:s.name,type:s.type,
      dockerfile:s.vcsData?.dockerFilePath ?? s.buildSettings?.dockerfile?.dockerFilePath,branch:s.vcsData?.projectBranch ?? s.vcsData?.branch,
      deploymentPlan:s.billing?.deploymentPlan,
      instances:s.deployment?.instances,region:s.deployment?.region,
      runtimeKeys:Object.keys(s.runtimeEnvironment ?? {}).sort(),
      buildKeys:Object.keys(s.buildEnvironment ?? {}).sort(),
      ports:(s.ports??[]).map(p=>({name:p.name,internalPort:p.internalPort,public:p.public})),
      volumeCount:(s.volumes??[]).length,
      hasCommandOverride:Boolean(s.deployment?.command || s.runtime?.command || s.config?.command),
      deployedSHA:s.deployment?.internal?.deployedSHA});
  } catch(e) {report.failures.push({id:item.id,error:e.message});}
}
for(const resource of ['volumes','secrets']) {
  try {
    const response=await get('/projects/'+encodeURIComponent(project)+'/'+resource);
    const items=Array.isArray(response)?response:response[resource];
    if(!Array.isArray(items)) throw new Error('Unrecognized '+resource+' response');
    report[resource]=items.map(v=>({id:v.id,name:v.name,
      ...(resource==='volumes'?{storageSize:v.spec?.storageSize,mounts:(v.mounts??[]).map(m=>({containerMountPath:m.containerMountPath}))}:{priority:v.priority,restricted:v.restrictions?.restricted,serviceIds:(v.restrictions?.nfObjects??[]).map(o=>o.id)})}));
  } catch(e) {report.failures.push({resource,error:e.message});}
}
writeFileSync('northflank-migration-inventory.json',JSON.stringify(report,null,2));
console.log('Inventoried '+report.services.length+' services; failures: '+report.failures.length+'. Secret values were not exported.');
if(report.failures.length) process.exitCode=1;
