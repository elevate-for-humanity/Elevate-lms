import { spawnSync } from 'node:child_process';
import { mkdtempSync, openSync, closeSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const project='elegant-racer-299721';
const leaf=value=>typeof value==='string'?value.split('/').at(-1):null;
export function inventoryFailureReason(error) {
  const message=String(error?.message??'');
  const classified=/INVENTORY_DIAGNOSTIC:(permission_denied|api_disabled|timeout|output_limit|invalid_response|unknown_gcloud_failure)/.exec(message);
  if(classified)return classified[1];
  if (/PERMISSION_DENIED|permission.*denied|does not have permission|cloudasset\.assets\.searchAllResources/i.test(message)) return 'permission_denied';
  if (/SERVICE_DISABLED|has not been used|API.*disabled|is disabled/i.test(message)) return 'api_disabled';
  if (/DEADLINE_EXCEEDED|timed? out|ETIMEDOUT/i.test(message)) return 'timeout';
  if (/ENOBUFS|ENOMEM|buffer exceeded/i.test(message)) return 'output_limit';
  if (/invalid inventory|Unexpected token|JSON/i.test(message)) return 'invalid_response';
  return 'unknown_gcloud_failure';
}
const definitions=[
  ['assets',['asset','search-all-resources','--scope=projects/'+project],a=>({name:a.name,type:a.assetType,location:a.location,state:a.state})],
  ['virtualMachines',['compute','instances','list'],v=>({name:v.name,zone:leaf(v.zone),machineType:leaf(v.machineType),status:v.status,disks:(v.disks||[]).map(d=>({name:leaf(d.source),boot:d.boot,autoDelete:d.autoDelete}))})],
  ['disks',['compute','disks','list'],d=>({name:d.name,zone:leaf(d.zone),region:leaf(d.region),type:leaf(d.type),sizeGb:d.sizeGb,status:d.status,attached:(d.users||[]).length>0})],
  ['addresses',['compute','addresses','list'],a=>({name:a.name,region:leaf(a.region),status:a.status,type:a.addressType})],
  ['snapshots',['compute','snapshots','list'],s=>({name:s.name,diskSizeGb:s.diskSizeGb,storageBytes:s.storageBytes,status:s.status,createdAt:s.creationTimestamp})],
  ['forwardingRules',['compute','forwarding-rules','list'],f=>({name:f.name,region:leaf(f.region),scheme:f.loadBalancingScheme,target:leaf(f.target)})],
  ['routers',['compute','routers','list'],r=>({name:r.name,region:leaf(r.region),natCount:(r.nats||[]).length})],
  ['buckets',['storage','buckets','list'],b=>({name:b.name,location:b.location,storageClass:b.storageClass||b.default_storage_class})],
];

export function auditCostResources({run=(args)=>{
  // Large project inventories can exceed child_process pipe buffers (ENOBUFS).
  // Spool complete output to a private temporary file, never stdout/stderr logs.
  const directory=mkdtempSync(join(tmpdir(),'elevate-inventory-'));
  const output=join(directory,'gcloud.json');
  const errorOutput=join(directory,'gcloud.err');
  let fd, errFd;
  try {
    fd=openSync(output,'w',0o600);
    errFd=openSync(errorOutput,'w',0o600);
    const result=spawnSync('gcloud',args,{stdio:['ignore',fd,errFd],timeout:120000});
    closeSync(fd);fd=undefined;
    closeSync(errFd);errFd=undefined;
    if(result.error||result.status!==0) {
      const message=result.error?.message??readFileSync(errorOutput,'utf8');
      throw Error('INVENTORY_DIAGNOSTIC:'+inventoryFailureReason({message}));
    }
    return readFileSync(output,'utf8');
  } finally {
    if(fd!==undefined)closeSync(fd);
    if(errFd!==undefined)closeSync(errFd);
    rmSync(directory,{recursive:true,force:true});
  }
}}={}) {
  const sections={};
  for(const [key,args,compact] of definitions) {
    try {
      const rows=JSON.parse(run([...args,'--project='+project,'--format=json']));
      if(!Array.isArray(rows))throw Error('invalid inventory');
      sections[key]={available:true,count:rows.length,resources:rows.map(compact)};
    } catch (error) {
      // A denied API is not evidence of an empty project. Never print raw CLI
      // errors or resource payloads: VM metadata may contain credentials.
      sections[key]={available:false,reason:inventoryFailureReason(error)};
    }
  }
  const review=[];
  for(const d of sections.disks.resources||[])if(!d.attached)review.push({kind:'unattached_disk',name:d.name,action:'Review ownership, recovery and retention before deletion'});
  for(const a of sections.addresses.resources||[])if(a.status==='RESERVED')review.push({kind:'reserved_address',name:a.name,action:'Check dependency and pricing before release'});
  const browsers=(sections.assets.resources||[]).filter(a=>/studio-browser/.test(a.name||'')&&/compute.googleapis.com\/Instance|run.googleapis.com\/Service/.test(a.type||''));
  if(new Set(browsers.map(a=>a.type)).size>1)review.push({kind:'multiple_browser_platforms',action:'Verify Admin destination and persistent session recovery; do not remove either from name alone'});
  return {project,checkedAt:new Date().toISOString(),readOnly:true,sections,review,
    limitations:['No usage-based dollar savings calculated','Cloud credits and remaining free allowances are not verified by this resource inventory','Unavailable sections require permissions or API review; no APIs enabled']};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const report=auditCostResources();
  console.log(JSON.stringify(report,null,2));
  if(Object.values(report.sections).some(section=>!section.available))process.exitCode=1;
}
