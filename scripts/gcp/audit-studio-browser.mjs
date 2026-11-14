import { execFileSync } from 'node:child_process';
const project = 'elegant-racer-299721';
function read(args) {
 return JSON.parse(execFileSync('gcloud', [...args, '--project='+project, '--format=json'], {encoding:'utf8',timeout:45000,stdio:['ignore','pipe','pipe']}));
}
const admin=read(['run','services','describe','elevate-admin-migration','--region=us-central1']);
const variables=admin.spec?.template?.spec?.containers?.[0]?.env
  || admin.spec?.template?.spec?.template?.spec?.containers?.[0]?.env
  || [];
const serviceUrl=admin.status?.url || admin.uri || null;
console.log(JSON.stringify({adminService:'elevate-admin-migration',serviceUrlPresent:Boolean(serviceUrl)}));
const keys=['STUDIO_BROWSER_URL','STUDIO_BROWSER_PUBLIC_URL','STUDIO_BROWSER_SECRET'];
for(const key of keys) {
 const v=variables.find(x=>x.name===key);
 const report={key,present:Boolean(v),secretReference:Boolean(v?.valueFrom)};
 if(key.endsWith('URL') && v?.value) {
  const url=new URL(v.value);
  report.hostname=url.hostname;
  report.legacyProvider=url.hostname.endsWith('.northflank.app') || url.hostname.endsWith('.code.run');
  try {const r=await fetch(new URL('/health',url),{signal:AbortSignal.timeout(15000),redirect:'manual'});report.healthStatus=r.status;}catch(e){report.healthError=e.name;}
 }
 console.log(JSON.stringify(report));
}
// Check the browser service directly when its public URL is configured.
const browserUrl=variables.find(x=>x.name==='STUDIO_BROWSER_URL')?.value;
if(browserUrl) {
  try {
    const response=await fetch(new URL('/health',browserUrl),{signal:AbortSignal.timeout(15000)});
    console.log(JSON.stringify({browserHealthStatus:response.status,browserReachable:response.ok}));
  } catch(e) {console.log(JSON.stringify({browserReachable:false,error:e.name}));}
}
const instances=read(['compute','instances','list']);
console.log(JSON.stringify({studioInstances:instances.filter(x=>/studio|browser/i.test(x.name)).map(x=>({name:x.name,status:x.status,zone:x.zone.split('/').pop(),internalIp:x.networkInterfaces?.[0]?.networkIP,authDisks:(x.disks || []).filter(d=>/^elevate-studio-browser-auth(?:-|$)/.test(d.deviceName || '') || /\/elevate-studio-browser-auth(?:-|$)/.test(d.source || '')).map(d=>({deviceName:d.deviceName,sourceName:d.source?.split('/').pop(),boot:Boolean(d.boot),autoDelete:Boolean(d.autoDelete)}))}))}));
const disks=read(['compute','disks','list']).filter(x=>/^elevate-studio-browser-auth(?:-|$)/.test(x.name));
console.log(JSON.stringify({durableAuthDisks:disks.map(x=>({name:x.name,status:x.status,zone:x.zone?.split('/').pop(),attachedInstances:(x.users || []).map(u=>u.split('/').pop())}))}));
