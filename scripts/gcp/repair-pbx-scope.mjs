import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {spawnSync} from 'node:child_process';
import {google,googleFailureCode,PROJECT} from './runtime-config.mjs';
import {digest} from './repair-pbx-startup-metadata.mjs';

export const ZONE='us-central1-a', VM='elevate-pbx';
const BASE=`https://compute.googleapis.com/compute/v1/projects/${PROJECT}`;
export const INSTANCE=`${BASE}/zones/${ZONE}/instances/${VM}`;
export const CLOUD_SCOPE='https://www.googleapis.com/auth/cloud-platform';
export const VM_PERMISSIONS=['compute.instances.get','compute.instances.stop','compute.instances.start','compute.instances.setServiceAccount'];

export function guardResult(result){
  let report;
  try{report=JSON.parse(result.stdout);}catch{ /* Raw SSH/CLI errors are never emitted. */ }
  if(result.status===0 && report?.result==='PASS')return report;
  const allowed=new Set(['active_calls_or_channels_not_zero','configured_endpoints_require_maintenance_review',
    'legacy_sip_state_requires_review','runtime_readback_failed','expected_container_not_running',
    'container_restart_policy_requires_review','configuration_mount_requires_review','container_set_requires_review',
    'post_restart_configuration_or_container_changed','restart_guard_unavailable']);
  throw Error(allowed.has(report?.code)?report.code:`restart_guard_${googleFailureCode(result.stderr)}`);
}

export function validateInstance(vm,project,addresses,startup){
  if(vm.name!==VM || !vm.id || vm.status!=='RUNNING' || !vm.zone?.endsWith(`/projects/${PROJECT}/zones/${ZONE}`) ||
    vm.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP!=='107.178.216.162')throw Error('vm_identity_mismatch');
  const scripts=vm.metadata?.items||[];
  if([...scripts,...(project.commonInstanceMetadata?.items||[])].some(x=>x.key==='startup-script-url') ||
    scripts.filter(x=>x.key==='startup-script').length!==1 ||
    digest(scripts.find(x=>x.key==='startup-script').value)!==digest(startup))throw Error('reviewed_startup_guard_not_installed');
  const pinned=addresses.items?.some(x=>x.address==='107.178.216.162' && x.status==='IN_USE' &&
    x.addressType==='EXTERNAL' && x.users?.some(u=>u.endsWith(`/zones/${ZONE}/instances/${VM}`)));
  if(!pinned)throw Error('reserved_ip_not_verified');
  if(vm.serviceAccounts?.length!==1 || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.gserviceaccount\.com$/.test(vm.serviceAccounts[0].email) ||
     !Array.isArray(vm.serviceAccounts[0].scopes))throw Error('vm_service_identity_requires_review');
  return vm.serviceAccounts[0];
}

export async function repairScope({request,guard,startup,apply=false,wait=delay,save=()=>{}}){
  const [before,project,addresses]=await Promise.all([request(INSTANCE),request(BASE),request(`${BASE}/regions/us-central1/addresses`)]);
  const identity=validateInstance(before,project,addresses,startup);
  const report={observedAt:new Date().toISOString(),vm:VM,identity:identity.email,changed:false,
    previousScopes:identity.scopes,callAcceptance:'NOT TESTED'};
  if(identity.scopes.includes(CLOUD_SCOPE))return {...report,result:'PASS',scopePresent:true};
  const [vmPermissions,saPermissions]=await Promise.all([
    request(`${INSTANCE}/testIamPermissions`,{method:'POST',body:JSON.stringify({permissions:VM_PERMISSIONS})}),
    request(`https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts/${identity.email}:testIamPermissions`,
      {method:'POST',body:JSON.stringify({permissions:['iam.serviceAccounts.actAs']})})]);
  const missing=[...VM_PERMISSIONS.filter(p=>!vmPermissions.permissions?.includes(p)),
    ...(['iam.serviceAccounts.actAs'].filter(p=>!saPermissions.permissions?.includes(p)))];
  if(missing.length)return {...report,result:'BLOCKED',code:'scope_repair_permissions_missing',missing};
  if(!apply)return {...report,result:'FAIL',code:'cloud_platform_scope_missing',repairAuthorized:true};
  // Require zero endpoints as well as zero calls: no established PBX routing may be interrupted.
  const evidence=await guard('before');
  if(evidence.result!=='PASS' || evidence.activeCalls!==0 || evidence.endpoints!==0)throw Error('restart_guard_failed');
  save({...report,before:evidence});
  async function operate(action,body){
    const operation=await request(`${INSTANCE}/${action}`,{method:'POST',body:body?JSON.stringify(body):undefined});
    if(!/^[a-zA-Z0-9-]+$/.test(operation.name||''))throw Error('scope_operation_unverified');
    for(let attempt=0;attempt<90;attempt++){
      const state=await request(`${BASE}/zones/${ZONE}/operations/${operation.name}`);
      if(state.error)throw Error('scope_operation_failed');
      if(state.status==='DONE')return;
      await wait(2000);
    }
    throw Error('scope_operation_timeout');
  }
  // Recheck identity immediately before stop. Never silently replace its service account.
  const last=await request(INSTANCE);
  // gcloud SSH may install its ephemeral key. All other metadata must be unchanged.
  const protectedMetadata=vm=>JSON.stringify((vm.metadata?.items||[]).filter(x=>x.key!=='ssh-keys').sort((a,b)=>a.key.localeCompare(b.key)));
  validateInstance(last,await request(BASE),addresses,startup);
  if(last.id!==before.id || JSON.stringify(last.serviceAccounts)!==JSON.stringify(before.serviceAccounts) ||
    protectedMetadata(last)!==protectedMetadata(before) || last.status!=='RUNNING')throw Error('concurrent_vm_change');
  let failure;
  try{
    await operate('stop');
    const stopped=await request(INSTANCE);
    if(stopped.status!=='TERMINATED' || stopped.id!==before.id)throw Error('vm_stop_unverified');
    await operate('setServiceAccount',{email:identity.email,scopes:[...new Set([...identity.scopes,CLOUD_SCOPE])]});
  }catch(error){failure=error;}
  finally{
    // A rejected scope update must not leave the existing PBX stopped.
    let state=await request(INSTANCE);
    for(let attempt=0;state.status==='STOPPING' && attempt<60;attempt++){
      await wait(2000);state=await request(INSTANCE);
    }
    if(state.id!==before.id)throw Error('vm_identity_changed_during_repair');
    if(state.status==='TERMINATED')await operate('start');
    else if(state.status!=='RUNNING')throw Error('vm_recovery_requires_operator');
  }
  if(failure)throw failure;
  const after=await request(INSTANCE);
  const updated=validateInstance(after,project,addresses,startup);
  if(updated.email!==identity.email || !updated.scopes.includes(CLOUD_SCOPE))throw Error('scope_update_unverified');
  let recovered;
  for(let attempt=0;attempt<24;attempt++){
    try{recovered=await guard('after');if(recovered.result==='PASS')break;}catch{ /* SSH/Docker may still be starting; bounded recovery only. */ }
    await wait(5000);
  }
  if(recovered?.result!=='PASS' || JSON.stringify(recovered.containers)!==JSON.stringify(evidence.containers) ||
    recovered.configurationSha256!==evidence.configurationSha256)throw Error('runtime_recovery_unverified');
  return {...report,result:'PASS',changed:true,scopePresent:true,containerIdentityPreserved:true,configurationPreserved:true};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const output='pbx-scope-repair-evidence.json';
  try{
    const token=google(['auth','print-access-token']);
    const request=async(url,init={})=>{
      const r=await fetch(url,{...init,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});
      if(!r.ok)throw Error(`google_http_${r.status}`);
      return r.json();
    };
    const guard=async phase=>guardResult(spawnSync('gcloud',['compute','ssh',VM,'--project',PROJECT,'--zone',ZONE,'--quiet',
      `--command=sudo python3 - ${phase}`],{input:readFileSync('scripts/gcp/pbx-restart-guard.py','utf8'),encoding:'utf8',timeout:120000,maxBuffer:1048576}));
    const report=await repairScope({request,guard,startup:readFileSync('infra/pbx/google-startup.sh','utf8'),apply:process.argv.includes('--apply'),
      save:data=>writeFileSync('pbx-scope-rollback-evidence.json',JSON.stringify(data,null,2))});
    writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
    if(report.result!=='PASS')process.exitCode=1;
  }catch(error){
    const report={result:'BLOCKED',code:/^[a-z_0-9]+$/.test(error?.message||'')?error.message:'scope_repair_unavailable',observedAt:new Date().toISOString()};
    writeFileSync(output,JSON.stringify(report));console.error(JSON.stringify(report));process.exitCode=1;
  }
}
