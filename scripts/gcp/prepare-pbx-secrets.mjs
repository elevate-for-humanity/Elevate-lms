import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {google,PROJECT,loadGoogleConfig} from './runtime-config.mjs';

export const SECRET_NAMES={provisioner:'elevate-pbx-provisioning-token',supabase:'elevate-pbx-supabase-service-role',
  turn:'elevate-paris-turn-token',ari:'elevate-paris-ari-password'};
export const PREPARE_PERMISSIONS=['secretmanager.secrets.create','secretmanager.secrets.getIamPolicy',
  'secretmanager.secrets.setIamPolicy','secretmanager.versions.add','serviceusage.services.enable','resourcemanager.projects.setIamPolicy'];
export async function prepareSecrets({request,run=google,entropy=()=>randomBytes(32).toString('base64url'),apply=false}){
  const permissions=await request(`https://cloudresourcemanager.googleapis.com/v3/projects/${PROJECT}:testIamPermissions`,
    {method:'POST',body:JSON.stringify({permissions:PREPARE_PERMISSIONS})});
  const missing=PREPARE_PERMISSIONS.filter(p=>!permissions.permissions?.includes(p));
  if(missing.length)return {result:'BLOCKED',code:'pbx_secret_bootstrap_permissions_missing',missing,changed:false};
  if(!apply)return {result:'NOT TESTED',code:'bootstrap_requires_apply',changed:false};
  const vm=JSON.parse(run(['compute','instances','describe','elevate-pbx','--project',PROJECT,'--zone','us-central1-a','--format=json(name,serviceAccounts)']));
  const identity=vm.serviceAccounts?.[0]?.email;
  if(vm.name!=='elevate-pbx' || vm.serviceAccounts?.length!==1 || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.gserviceaccount\.com$/.test(identity||''))throw Error('pbx_identity_unverified');
  // Reuse the existing application system of record. Fetch only into memory; no secret log/file.
  const source=loadGoogleConfig('lms',run).runtimeEnvironment;
  if(source.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'')!=='https://cuxzzpsyufcewtmicszk.supabase.co' ||
    typeof source.SUPABASE_SERVICE_ROLE_KEY!=='string' || source.SUPABASE_SERVICE_ROLE_KEY.length<32)throw Error('supabase_source_unverified');
  const listed=JSON.parse(run(['secrets','list','--project',PROJECT,'--format=json(name,labels)']));
  // Validate the complete namespace before the first mutation. Never adopt an unrelated secret.
  for(const name of Object.values(SECRET_NAMES)){
    const existing=listed.find(x=>x.name.split('/').at(-1)===name);
    if(existing && existing.labels?.elevate_component!=='pbx')throw Error('existing_pbx_secret_ownership_requires_review');
  }
  run(['services','enable','secretmanager.googleapis.com','speech.googleapis.com','texttospeech.googleapis.com','aiplatform.googleapis.com','--project',PROJECT,'--quiet']);
  const versions={};
  for(const [key,name] of Object.entries(SECRET_NAMES)){
    if(!listed.some(x=>x.name.split('/').at(-1)===name))run(['secrets','create',name,'--project',PROJECT,'--replication-policy=automatic','--labels=elevate_component=pbx','--quiet']);
    let version=run(['secrets','versions','list',name,'--project',PROJECT,'--filter=state=ENABLED','--sort-by=~createTime','--limit=1','--format=value(name)']);
    if(!version){
      const value=key==='supabase'?source.SUPABASE_SERVICE_ROLE_KEY:entropy();
      version=run(['secrets','versions','add',name,'--project',PROJECT,'--data-file=-','--format=value(name)','--quiet'],value);
    }
    const number=version.split('/').at(-1);
    if(!/^[0-9]+$/.test(number))throw Error('secret_version_unverified');
    versions[key]=`projects/${PROJECT}/secrets/${name}/versions/${number}`;
    run(['secrets','add-iam-policy-binding',name,'--project',PROJECT,'--member',`serviceAccount:${identity}`,
      '--role=roles/secretmanager.secretAccessor','--condition=None','--quiet']);
    if(key==='provisioner')run(['secrets','add-iam-policy-binding',name,'--project',PROJECT,
      '--member',`serviceAccount:elevate-lms-runtime@${PROJECT}.iam.gserviceaccount.com`,
      '--role=roles/secretmanager.secretAccessor','--condition=None','--quiet']);
  }
  for(const role of ['roles/speech.client','roles/aiplatform.user','roles/serviceusage.serviceUsageConsumer']){
    run(['projects','add-iam-policy-binding',PROJECT,'--member',`serviceAccount:${identity}`,`--role=${role}`,'--condition=None','--quiet']);
  }
  return {result:'PASS',scope:'secret_bootstrap_only',identity,versions,changed:true,callAcceptance:'NOT TESTED'};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  let report;
  try{
    const token=google(['auth','print-access-token']);
    const request=async(url,init)=>{
      const r=await fetch(url,{...init,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});
      if(!r.ok)throw Error(`google_http_${r.status}`);return r.json();
    };
    report=await prepareSecrets({request,apply:process.argv.includes('--apply')});
  }catch(error){report={result:'BLOCKED',code:/^[a-z_0-9]+$/.test(error?.message||'')?error.message:(error?.code==='permission_denied'?'google_permission_denied':'pbx_secret_bootstrap_unavailable')};}
  report.observedAt=new Date().toISOString();
  writeFileSync('pbx-secret-bootstrap-evidence.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  if(report.result!=='PASS')process.exitCode=1;
}
