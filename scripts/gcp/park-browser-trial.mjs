import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {google,PROJECT} from './runtime-config.mjs';
import {METADATA_PROBE,inventoryStudioLiveState} from './inventory-studio-live-state.mjs';
import {productionBrowserEnvironment,inspectServingAdminBrowserBinding} from './production-browser-binding.mjs';
import {browserConsumerBindings} from './release-empty-browser-aliases.mjs';
const name='elevate-studio-browser-trial',scope=['--project='+PROJECT,'--zone=us-central1-a'];

export const TRIAL_INSPECTION=`import json,urllib.request,os,subprocess
from pathlib import Path
program=${JSON.stringify(METADATA_PROBE)}
values={}
for line in Path('/etc/elevate-studio/runtime.env').read_text().splitlines():
 key,sep,value=line.partition('=')
 if sep and key=='STUDIO_BROWSER_SECRET':values[key]=value
def request(path,body=None):
 headers={'Content-Type':'application/json','x-studio-browser-secret':values.get('STUDIO_BROWSER_SECRET','')}
 req=urllib.request.Request('http://127.0.0.1:3100'+path,data=json.dumps(body).encode() if body else None,headers=headers)
 with urllib.request.urlopen(req,timeout=40) as response:return json.load(response)
health=request('/health')
response=request('/workspace/exec',{'command':'node','args':['-e',program],'timeoutMs':30000})
if response.get('exitCode')!=0:raise ValueError('VM_METADATA_UNVERIFIED')
data=json.loads(response.get('stdout',''))
if data.get('fileContentsRead')!=False or data.get('commandsRead')!=False:raise ValueError('VM_METADATA_UNVERIFIED')
mounts=json.loads(subprocess.check_output(['docker','inspect','studio-browser','--format','{{json .Mounts}}'],text=True,timeout=10))
mounted=subprocess.check_output(['findmnt','--noheadings','--output','SOURCE','--target','/var/lib/elevate-studio/auth'],text=True,timeout=10).strip()
persistent=os.path.realpath(mounted)==os.path.realpath('/dev/disk/by-id/google-elevate-studio-browser-auth-trial')
expected=[('/var/lib/elevate-studio/auth','/var/lib/studio-browser-auth'),('/var/lib/elevate-studio/workspace','/workspace/project')]
persistent=persistent and all(any(m.get('Type')=='bind' and m.get('Source')==source and m.get('Destination')==target for m in mounts) for source,target in expected)
print(json.dumps({'ready':health.get('ready')==True,'activeBrowserSessions':health.get('activeSessions'),'cookieStoragePersistent':health.get('providerAuthStorage',{}).get('persistent')==True,'dataDiskMounted':persistent,'files':data.get('files'),'symlinks':data.get('symlinks'),'directChildShells':data.get('directChildShells'),'directNonBrowserProcesses':data.get('directNonBrowserProcesses'),'processInventoryReadable':data.get('processInventoryReadable')}))
`;
function owned(vm){return vm.name===name&&/^[1-9][0-9]*$/.test(vm.id||'')&&vm.labels?.purpose==='studio-isolation-trial'&&vm.zone?.endsWith('/us-central1-a')&&vm.disks?.some(d=>d.source?.endsWith('/disks/elevate-studio-browser-auth-trial')&&d.autoDelete===false);}
const disks=vm=>(vm.disks||[]).map(d=>({source:d.source,autoDelete:d.autoDelete,boot:d.boot})).sort((a,b)=>a.source.localeCompare(b.source));
function empty(proof){return proof.ready===true&&proof.cookieStoragePersistent===true&&proof.dataDiskMounted===true&&proof.activeBrowserSessions===0&&proof.files===0&&proof.symlinks===0&&proof.directChildShells===0&&proof.directNonBrowserProcesses===0&&proof.processInventoryReadable===true;}
export async function parkBrowserTrial({read,inspect,bindings,production,stop,start}){
 const before=read();if(!owned(before))throw Error('TRIAL_OWNERSHIP_UNVERIFIED');
 if(before.status==='TERMINATED')return {vm:name,parked:true,unchanged:true,disksDeleted:false};
 if(before.status!=='RUNNING')throw Error('TRIAL_STATE_NOT_STABLE');
 if((await bindings())!==true||(await production())!==true)throw Error('TRIAL_PRODUCTION_BINDINGS_UNVERIFIED');
 if(!empty(await inspect()))throw Error('TRIAL_HAS_WORK_OR_UNVERIFIED_STATE');
 const fresh=read();
 if(!owned(fresh)||fresh.id!==before.id||fresh.status!=='RUNNING'||!isDeepStrictEqual(disks(before),disks(fresh)))throw Error('TRIAL_CHANGED_CONCURRENTLY');
 if((await bindings())!==true||!empty(await inspect()))throw Error('TRIAL_HAS_WORK_OR_UNVERIFIED_STATE');
 stop();const after=read();
 if(after.status!=='TERMINATED'||after.id!==before.id||!isDeepStrictEqual(disks(before),disks(after)))throw Error('TRIAL_STOP_READBACK_REQUIRED');
 if((await bindings())!==true||(await production())!==true){
  start();const restored=read();
  if(restored.status!=='RUNNING'||restored.id!==before.id||!isDeepStrictEqual(disks(restored),disks(before)))throw Error('TRIAL_ROLLBACK_READBACK_REQUIRED');
  throw Error('TRIAL_PARK_ROLLED_BACK_FOR_PRODUCTION');
 }
 return {vm:name,parked:true,status:after.status,machineType:before.machineType?.split('/').at(-1),diskCount:after.disks.length,disksDeleted:false,authDiskRetained:true,productionBrowserVerified:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let observed;
 try{
  const read=()=>JSON.parse(google(['compute','instances','describe',name,...scope,'--format=json']));
  const browser=JSON.parse(google(['run','services','describe','elevate-studio-browser','--project='+PROJECT,'--region=us-central1','--format=json']));
  const url=productionBrowserEnvironment(browser).STUDIO_BROWSER_URL;
  const bindings=async()=>{
   const verified=inspectServingAdminBrowserBinding({url});if(!verified.verified)return false;
   const admin=JSON.parse(google(['run','services','describe','elevate-admin-migration','--project='+PROJECT,'--region=us-central1','--format=json']));
   for(const traffic of admin.status?.traffic||[])if(traffic.percent>0){
    const revision=JSON.parse(google(['run','revisions','describe',traffic.revisionName,'--project='+PROJECT,'--region=us-central1','--format=json']));
    if(!revision.spec?.containers?.every(c=>c.env?.some(e=>e.name==='ELEVATE_RUNTIME_CONFIG_PROVIDER'&&e.value==='google-secret-manager')))return false;
   }
   const vm=read(),addresses=new Set(vm.networkInterfaces?.flatMap(n=>[n.networkIP,...(n.accessConfigs||[]).map(x=>x.natIP)]).filter(Boolean));
   for(const row of browserConsumerBindings()){
    const endpoint=new URL(row.value);if(addresses.has(endpoint.hostname)||!endpoint.hostname.endsWith('.run.app'))return false;
   }
   return true;
  };
  const production=async()=>{const state=await inventoryStudioLiveState();return state.workspaceRecovery.ready===true&&state.workspaceRecovery.persistent===true&&state.terminalRecovery.ready===true;};
  const result=await parkBrowserTrial({read,bindings,production,
   inspect:()=>{observed=JSON.parse(google(['compute','ssh',name,...scope,'--quiet','--ssh-flag=-oConnectTimeout=15','--command=sudo python3 -'],TRIAL_INSPECTION));return observed;},
   stop:()=>google(['compute','instances','stop',name,...scope,'--quiet']),start:()=>google(['compute','instances','start',name,...scope,'--quiet'])});
  console.log(JSON.stringify(result));
 }catch(error){console.error(JSON.stringify({vm:name,parked:false,readbackRequired:/READBACK_REQUIRED$/.test(error.message||''),proof:observed||null,reason:/^TRIAL_[A-Z_]+$/.test(error.message||'')?error.message:error.code||'TRIAL_PRESERVATION_PROOF_UNAVAILABLE',operation:error.message?.startsWith('Google operation failed: ')?error.message.slice(25):null}));process.exitCode=1;}
}
