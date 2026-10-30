import {pathToFileURL} from 'node:url';
import {google,PROJECT,loadGoogleConfig} from './runtime-config.mjs';
import {WORKSPACE_PRESERVATION_PROBE} from './verify-studio-workspace-preservation.mjs';
// The subprocess reads metadata only. It never reads file contents, command
// arguments, browser cookies, credentials, terminal input or process memory.
export function studioProcessClass(name){if(['chromium','chrome','headless_shell'].includes(name))return 'browser';if(['chrome_crashpad','chrome_crashpad_handler'].includes(name))return 'browserHelper';if(['bash','sh','dash'].includes(name))return 'shell';return 'unclassified';}
export function summarizeStudioProcessStats(stats,parentPid,probePid) {
 const empty=()=>({running:0,sleeping:0,stopped:0,zombie:0,other:0});
 const stateKey=state=>state==='R'?'running':['S','D','I'].includes(state)?'sleeping':['T','t'].includes(state)?'stopped':state==='Z'?'zombie':'other';
 const rows=stats.map(stat=>{
  const begin=stat.indexOf('('),end=stat.lastIndexOf(')'),pid=Number(stat.slice(0,begin).trim());
  const fields=stat.slice(end+2).split(' '),ppid=Number(fields[1]),state=fields[0];
  if(begin<1||end<=begin||!Number.isSafeInteger(pid)||pid<1||!Number.isSafeInteger(ppid)||ppid<0||!['R','S','D','T','t','X','Z','I','W','P'].includes(state))throw Error('PROCESS_METADATA_UNVERIFIED');
  return {pid,ppid,state,kind:studioProcessClass(stat.slice(begin+1,end))};
 });
 const owned=new Set([parentPid]),ignored=new Set([probePid]);
 for(let i=0;i<=rows.length;i++){
  let changed=false;
  for(const row of rows){
   if(ignored.has(row.ppid)&&!ignored.has(row.pid)){ignored.add(row.pid);changed=true;}
   if(owned.has(row.ppid)&&!owned.has(row.pid)){owned.add(row.pid);changed=true;}
  }
  if(!changed)break;
 }
 const result={directChildShells:0,directNonBrowserProcesses:0,directBrowserHelperProcesses:0,directShellStates:empty(),descendantNonBrowserProcesses:0,descendantProcessStates:empty()};
 for(const row of rows){
  if(row.pid===parentPid||ignored.has(row.pid)||!owned.has(row.pid))continue;
  if(row.ppid===parentPid){
   if(row.kind==='shell'){result.directChildShells++;result.directShellStates[stateKey(row.state)]++;}
   if(row.kind==='browserHelper')result.directBrowserHelperProcesses++;
   if(!['browser','browserHelper'].includes(row.kind))result.directNonBrowserProcesses++;
  }else if(!['browser','browserHelper'].includes(row.kind)){
   result.descendantNonBrowserProcesses++;result.descendantProcessStates[stateKey(row.state)]++;
  }
 }
 return result;
}
export const METADATA_PROBE=`const fs=require('node:fs/promises'),path=require('node:path');(async()=>{const root=process.cwd();let files=0,directories=0,symlinks=0,bytes=0,excludedGitTransferFiles=0,excludedGitTransferBytes=0;const excluded=new Set(['node_modules','.next','.cache','.turbo','.pnpm-store','__pycache__']);async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(excluded.has(e.name))continue;const full=path.join(dir,e.name);const st=await fs.lstat(full);if(path.relative(root,dir)==='.git/objects/pack'&&/^tmp_(?:pack|idx)_/.test(e.name)&&st.isFile()){excludedGitTransferFiles++;excludedGitTransferBytes+=st.size;continue;}if(st.isSymbolicLink())symlinks++;else if(st.isDirectory()){directories++;await walk(full);}else if(st.isFile()){files++;bytes+=st.size;}if(files+directories+symlinks>100000)throw Error('inventory_limit');}}await walk(root);const studioProcessClass=${studioProcessClass.toString()};const summarize=${summarizeStudioProcessStats.toString()};let processSummary={},procReadable=true;try{await fs.readFile('/proc/'+process.ppid+'/stat','utf8');const stats=[];for(const pid of (await fs.readdir('/proc')).filter(x=>/^\\d+$/.test(x))){try{stats.push(await fs.readFile('/proc/'+pid+'/stat','utf8'));}catch(error){if(!['ENOENT','ESRCH'].includes(error.code))throw error;}}processSummary=summarize(stats,process.ppid,process.pid);}catch{procReadable=false;}console.log(JSON.stringify({files,directories,symlinks,bytes,excludedGitTransferFiles,excludedGitTransferBytes,excludedDependencyCaches:true,...processSummary,directChildShells:procReadable?processSummary.directChildShells:null,directNonBrowserProcesses:procReadable?processSummary.directNonBrowserProcesses:null,directBrowserHelperProcesses:procReadable?processSummary.directBrowserHelperProcesses:null,processInventoryReadable:procReadable,fileContentsRead:false,commandsRead:false}));})().catch(()=>{console.log(JSON.stringify({error:'metadata_inventory_unavailable'}));process.exitCode=1;});`;
export async function inventoryStudioLiveState({run=google,request=fetch,tag}={}){
 const resource=JSON.parse(run(['run','services','describe','elevate-studio-browser','--project='+PROJECT,'--region=us-central1','--format=json']));
 let endpoint=resource.status?.url;
 if(tag!==undefined){
  if(!/^(?:studio-verify|course-qa-[a-f0-9]{12})$/.test(tag))throw Error('STUDIO_INVENTORY_TAG_UNVERIFIED');
  const rows=(resource.status?.traffic||[]).filter(t=>t.tag===tag);
  if(rows.length!==1||Number(rows[0].percent||0)!==0||!/^elevate-studio-browser-[a-z0-9-]+$/.test(rows[0].revisionName||''))throw Error('STUDIO_INVENTORY_TAG_UNVERIFIED');
  endpoint=rows[0].url;
 }
 const base=new URL(endpoint);if(base.protocol!=='https:'||!base.hostname.endsWith('.run.app')||base.username||base.password||base.pathname!=='/'||base.search||base.hash||(tag&&!base.hostname.startsWith(tag+'---elevate-studio-browser-')))throw Error('STUDIO_ENDPOINT_UNVERIFIED');
 const secret=run(['secrets','versions','access','latest','--secret=studio-browser-shared-secret','--project='+PROJECT]);
 const healthResponse=await request(new URL('/health',base),{redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!healthResponse.ok)throw Error('STUDIO_HEALTH_UNVERIFIED');const health=await healthResponse.json();
 const response=await request(new URL('/workspace/exec',base),{method:'POST',headers:{'Content-Type':'application/json','x-studio-browser-secret':secret},body:JSON.stringify({command:'node',args:['-e',METADATA_PROBE],timeoutMs:30000}),redirect:'error',signal:AbortSignal.timeout(40000)});
 if(!response.ok)throw Error('STUDIO_STATE_INVENTORY_REJECTED');const result=await response.json();
 if(result.exitCode!==0||typeof result.stdout!=='string'||result.stdout.length>2048)throw Error('STUDIO_STATE_INVENTORY_UNVERIFIED');
 const data=JSON.parse(result.stdout);if(data.error||data.fileContentsRead!==false||data.commandsRead!==false)throw Error('STUDIO_STATE_INVENTORY_UNVERIFIED');
 return {readOnly:true,observedAt:new Date().toISOString(),commit:typeof health.commit==='string'?health.commit:null,activeBrowserSessions:Number.isInteger(health.activeSessions)?health.activeSessions:null,workspace:{files:data.files,directories:data.directories,symlinks:data.symlinks,bytes:data.bytes,excludedGitTransferFiles:data.excludedGitTransferFiles,excludedGitTransferBytes:data.excludedGitTransferBytes,excludedDependencyCaches:data.excludedDependencyCaches},terminalRecovery:{active:Number.isInteger(health.terminalRecovery?.active)?health.terminalRecovery.active:null,persistent:typeof health.terminalRecovery?.persistent==='boolean'?health.terminalRecovery.persistent:null,ready:typeof health.terminalRecovery?.ready==='boolean'?health.terminalRecovery.ready:null},workspaceRecovery:{ready:typeof health.workspaceRecovery?.ready==='boolean'?health.workspaceRecovery.ready:null,persistent:typeof health.workspaceRecovery?.persistent==='boolean'?health.workspaceRecovery.persistent:null,saveFailed:health.workspaceRecovery?Boolean(health.workspaceRecovery.lastSaveError):null,failureCode:/^WORKSPACE_[A-Z_0-9]+$/.test(health.workspaceRecovery?.lastSaveCode||'')?health.workspaceRecovery.lastSaveCode:null},directShellStates:data.directShellStates,descendantNonBrowserProcesses:data.descendantNonBrowserProcesses,descendantProcessStates:data.descendantProcessStates,directChildShells:data.directChildShells,directNonBrowserProcesses:data.directNonBrowserProcesses,directBrowserHelperProcesses:data.directBrowserHelperProcesses,processInventoryReadable:data.processInventoryReadable,traffic:(resource.status?.traffic||[]).map(t=>({revision:t.revisionName,percent:t.percent||0,tag:t.tag||null})),stateChanged:false};
}
export function adminGitHubBindingMetadata(resource, config, secretNames=[]) {
 const spec=resource.spec?.template?.spec||resource.template||{};
 const env=(spec.containers||[]).flatMap(c=>c.env||[]);
 const relevant=env.filter(e=>/^GITHUB_APP_|^GITHUB_TOKEN$/.test(e.name||''));
 const names=secretNames.filter(name=>/github|paris/i.test(name));
 return {readOnly:true,stateChanged:false,
  runtimeConfigHasAppPrivateKey:Boolean(config?.runtimeEnvironment?.GITHUB_APP_PRIVATE_KEY),
  runtimeConfigHasAppPrivateKeyFile:Boolean(config?.runtimeEnvironment?.GITHUB_APP_PRIVATE_KEY_FILE),
  runtimeConfigHasAppPrivateKeyFileContent:Boolean(config?.runtimeFiles?.[config?.runtimeEnvironment?.GITHUB_APP_PRIVATE_KEY_FILE]),
  runtimeConfigHasRepositoryToken:Boolean(config?.runtimeEnvironment?.GITHUB_TOKEN),
  serviceBindings:relevant.map(e=>({name:e.name,hasLiteralValue:Boolean(e.value),secret:e.valueFrom?.secretKeyRef?.name||e.valueSource?.secretKeyRef?.secret||null})),
  secretVolumes:(spec.volumes||[]).filter(v=>v.secret).map(v=>({name:v.name,secret:v.secret.secretName||v.secret.secret||null})),
  candidateSecretNames:names,
  expectedDedicatedSecretPresent:secretNames.some(name=>name.split('/').pop()==='paris-engineer-github-private-key'),
 };
}
export async function inventoryAdminGitHubBindings({run=google}={}) {
 const resource=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project='+PROJECT,'--region=us-central1','--format=json']));
 let config=null,configReadable=true,secretNames=[],secretInventoryReadable=true;
 try {config=loadGoogleConfig('admin',run);}catch {configReadable=false;}
 try {secretNames=JSON.parse(run(['secrets','list','--project='+PROJECT,'--format=json(name)'])).map(row=>row.name);}catch {secretInventoryReadable=false;}
 return {...adminGitHubBindingMetadata(resource,config,secretNames),configReadable,secretInventoryReadable};
}
export async function inspectStudioPreservation({run=google,request=fetch}={}) {
 const resource=JSON.parse(run(['run','services','describe','elevate-studio-browser','--project='+PROJECT,'--region=us-central1','--format=json']));
 const candidate=resource.status?.traffic?.find(t=>t.revisionName===resource.status.latestCreatedRevisionName&&/^sc-[a-f0-9]{8}-[a-f0-9]{8}$/.test(t.tag||'')&&!t.percent);
 if(!candidate?.url)return {readOnly:true,stateChanged:false,candidateAvailable:false};
 const endpoints=[resource.status.url,candidate.url];
 for(const value of endpoints){const url=new URL(value);if(url.protocol!=='https:'||!url.hostname.endsWith('.run.app')||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('STUDIO_ENDPOINT_UNVERIFIED');}
 const secret=run(['secrets','versions','access','latest','--secret=studio-browser-shared-secret','--project='+PROJECT]);
 const proofs=[],runtimes=[];
 for(const base of endpoints){
  const metadataProgram="const fs=require('node:fs'),crypto=require('node:crypto');console.log(JSON.stringify({kind:'workspace_module_metadata',revision:process.env.K_REVISION,rootIsDefault:process.cwd()==='/workspace/project',prefixIsDefault:!process.env.STUDIO_WORKSPACE_OBJECT_PREFIX||process.env.STUDIO_WORKSPACE_OBJECT_PREFIX==='workspaces/admin-repository-v1',moduleHashes:Object.fromEntries(['server.mjs','workspace-checkpoint.mjs','gcs-workspace-objects.mjs'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync('/app/'+name)).digest('hex')]))}));";
  const metadataResponse=await request(new URL('/workspace/exec',base),{method:'POST',headers:{'content-type':'application/json','x-studio-browser-secret':secret},body:JSON.stringify({command:'node',args:['-e',metadataProgram],timeoutMs:30000}),redirect:'error',signal:AbortSignal.timeout(40000)});
  if(!metadataResponse.ok)throw Error('STUDIO_RUNTIME_METADATA_UNVERIFIED');
  const metadataResult=await metadataResponse.json();if(metadataResult.exitCode!==0||typeof metadataResult.stdout!=='string'||metadataResult.stdout.length>2048)throw Error('STUDIO_RUNTIME_METADATA_UNVERIFIED');
  const raw=JSON.parse(metadataResult.stdout),metadata={revision:/^elevate-studio-browser-[a-z0-9-]+$/.test(raw.revision||'')?raw.revision:null,rootIsDefault:raw.rootIsDefault===true,prefixIsDefault:raw.prefixIsDefault===true,moduleHashes:{}};
  for(const name of ['server.mjs','workspace-checkpoint.mjs','gcs-workspace-objects.mjs'])metadata.moduleHashes[name]=/^[a-f0-9]{64}$/.test(raw.moduleHashes?.[name]||'')?raw.moduleHashes[name]:null;
  runtimes.push(metadata);
  const response=await request(new URL('/workspace/exec',base),{method:'POST',headers:{'content-type':'application/json','x-studio-browser-secret':secret},body:JSON.stringify({command:'node',args:['-e',WORKSPACE_PRESERVATION_PROBE],timeoutMs:120000}),redirect:'error',signal:AbortSignal.timeout(150000)});
  if(!response.ok)throw Error('STUDIO_PRESERVATION_INSPECTION_HTTP_'+response.status);
  const result=await response.json();if(result.exitCode!==0||typeof result.stdout!=='string'||result.stdout.length>2048)throw Error('STUDIO_PRESERVATION_INSPECTION_FAILED');
  const data=JSON.parse(result.stdout),proof={};
  for(const key of ['files','directories','bytes'])proof[key]=Number.isSafeInteger(data[key])&&data[key]>=0?data[key]:null;
  for(const key of ['digest','archiveDigest'])proof[key]=/^[a-f0-9]{64}$/.test(data[key]||'')?data[key]:null;
  proof.generation=/^[1-9]\d*$/.test(data.generation||'')?String(data.generation):null;
  proof.authenticatedManifest=data.authenticatedManifest===true;proof.excludedDependencyCaches=data.excludedDependencyCaches===true;
  proofs.push(proof);
 }
 return {readOnly:true,stateChanged:false,candidateAvailable:true,candidateRevision:candidate.revisionName,sourceRuntime:runtimes[0],candidateRuntime:runtimes[1],source:proofs[0],candidate:proofs[1],equal:JSON.stringify(proofs[0])===JSON.stringify(proofs[1])};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(await (process.argv.includes('--admin-github-bindings')?inventoryAdminGitHubBindings():process.argv.includes('--preservation')?inspectStudioPreservation():inventoryStudioLiveState())));}catch{console.error(JSON.stringify({error:'STUDIO_LIVE_STATE_INVENTORY_FAILED',stateChanged:false}));process.exitCode=1;}}
