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
      instances:s.deployment?.instances,region:s.deployment?.region,disabledCI:s.disabledCI,
      runtimeKeys:Object.keys(s.runtimeEnvironment ?? {}).sort(),
      buildKeys:Object.keys(s.buildEnvironment ?? {}).sort(),
      ports:(s.ports??[]).map(p=>({name:p.name,internalPort:p.internalPort,public:p.public})),
      volumeCount:(s.deployment?.volumes??s.volumes??[]).length,
      persistence:{deploymentKeys:Object.keys(s.deployment??{}).sort(),storageKeys:Object.keys(s.deployment?.storage??{}).sort(),
        declaredVolumes:(s.deployment?.volumes??s.volumes??[]).map(v=>({id:v.id,mounts:(v.mounts??[]).map(m=>({containerMountPath:m.containerMountPath,volumeMountPath:m.volumeMountPath})),spec:v.spec}))},
      hasCommandOverride:Boolean(s.deployment?.command || s.runtime?.command || s.config?.command),
      deployedSHA:s.deployment?.internal?.deployedSHA});
  } catch(e) {report.failures.push({id:item.id,error:e.message});}
}
for(const resource of ['volumes','secrets']) {
  try {
    const response=await get('/projects/'+encodeURIComponent(project)+'/'+resource);
    const items=Array.isArray(response)?response:response[resource];
    if(!Array.isArray(items)) throw new Error('Unrecognized '+resource+' response');
    if(resource==='volumes') {
      report.volumes=[];
      for(const item of items) {
        const v=await get('/projects/'+encodeURIComponent(project)+'/volumes/'+encodeURIComponent(item.id));
        report.volumes.push({id:v.id,name:v.name,storageSize:v.spec?.storageSize,status:v.status,
          attachedObjects:(v.attachedObjects??[]).map(o=>({id:o.id,type:o.type})),
          mounts:v.mounts??null,
          backupSchedules:(v.backupSchedules??[]).map(b=>({scheduling:b.scheduling,retentionTime:b.retentionTime}))});
      }
      continue;
    }
    report[resource]=items.map(v=>({id:v.id,name:v.name,
      ...(resource==='volumes'?{storageSize:v.spec?.storageSize,mounts:(v.mounts??[]).map(m=>({containerMountPath:m.containerMountPath}))}:{priority:v.priority,restricted:v.restrictions?.restricted,serviceIds:(v.restrictions?.nfObjects??[]).map(o=>o.id)})}));
  } catch(e) {report.failures.push({resource,error:e.message});}
}
// Google ownership cannot be inferred from the web project alone. Audit other
// visible projects (including retired GPU/LLM infrastructure) without enabling
// or importing their providers, credentials or workloads.
try {
  const response=await get('/projects');
  const projects=Array.isArray(response)?response:response.projects;
  if(!Array.isArray(projects)) throw new Error('Unrecognized projects response');
  report.visibleProjectIds=projects.map(p=>p.id);
  report.otherProjects=[];
  for(const p of projects.filter(p=>p.id!==project)) {
    const observed={id:p.id,resources:{},failures:[]};
    for(const resource of ['services','jobs','addons','volumes']) {
      try {
        const base='/projects/'+encodeURIComponent(p.id)+'/'+resource;
        const response=await get(base);
        const rows=Array.isArray(response)?response:response[resource];
        if(!Array.isArray(rows)) throw new Error('Unrecognized resource response');
        observed.resources[resource]=[];
        for(const row of rows) {
          const v=await get(base+'/'+encodeURIComponent(row.id));
          observed.resources[resource].push({id:v.id,name:v.name,type:v.type,status:typeof v.status==='string'?v.status:undefined,
            deploymentPlan:v.billing?.deploymentPlan,instances:v.deployment?.instances,disabledCI:v.disabledCI,
            runtimeKeys:Object.keys(v.runtimeEnvironment??{}).sort(),
            attachedObjects:(v.attachedObjects??[]).map(o=>({id:o.id,type:o.type})),storageSize:v.spec?.storageSize,
            scheduling:v.scheduling,mounts:v.mounts??null,resourceKeys:Object.keys(v).sort()});
        }
      } catch(error) {
        const reason=/^Northflank returned HTTP [0-9]{3}$/.test(error.message)?error.message:'inventory_unavailable';
        observed.failures.push({resource,reason});report.failures.push({project:p.id,resource,reason});
      }
    }
    report.otherProjects.push(observed);
  }
} catch(error) {
  report.failures.push({resource:'project_discovery',reason:/^Northflank returned HTTP [0-9]{3}$/.test(error.message)?error.message:'inventory_unavailable'});
}
writeFileSync('northflank-migration-inventory.json',JSON.stringify(report,null,2));
console.log('Inventoried '+report.services.length+' services; failures: '+report.failures.length+'. Secret values were not exported.');
if(report.failures.length) process.exitCode=1;
