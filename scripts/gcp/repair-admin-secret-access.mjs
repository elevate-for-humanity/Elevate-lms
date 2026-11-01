import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
const DEPLOY=`serviceAccount:elevate-github-deploy@${PROJECT}.iam.gserviceaccount.com`;
const ADMIN=`serviceAccount:elevate-admin-runtime@${PROJECT}.iam.gserviceaccount.com`;
const TARGETS=['elevate-admin-runtime-config','elevate-admin-github-token','paris-engineer-github-private-key'];
const PERMISSIONS=['secretmanager.secrets.get','secretmanager.secrets.getIamPolicy','secretmanager.secrets.setIamPolicy','secretmanager.versions.access'];
const ROLE='roles/secretmanager.secretAccessor';
export function addReader(policy,member){
 const next=structuredClone(policy);
 if(!next.etag)throw Error('SECRET_POLICY_ETAG_REQUIRED');
 next.version=3;
 next.bindings??=[];
 let binding=next.bindings.find(b=>b.role===ROLE&&!b.condition);
 if(binding?.members?.includes(member))return null;
 if(!binding){binding={role:ROLE,members:[]};next.bindings.push(binding);}
 binding.members??=[];binding.members.push(member);
 return next;
}
export async function repairAdminSecretAccess({token,request=fetch,apply=false}={}){
 const results=[];
 let billing={verified:false};
 try{
  const response=await request(`https://cloudbilling.googleapis.com/v1/projects/${PROJECT}/billingInfo`,{headers:{Authorization:`Bearer ${token}`},redirect:'error',signal:AbortSignal.timeout(15000)});
  const body=await response.json();
  billing={http:response.status,verified:response.ok,billingEnabled:response.ok&&typeof body.billingEnabled==='boolean'?body.billingEnabled:null,accountLinked:response.ok?Boolean(body.billingAccountName):null};
  if(response.ok&&/^billingAccounts\/[A-Za-z0-9-]+$/.test(body.billingAccountName||'')){
   const account=await request(`https://cloudbilling.googleapis.com/v1/${body.billingAccountName}`,{headers:{Authorization:`Bearer ${token}`},redirect:'error',signal:AbortSignal.timeout(15000)});
   const details=await account.json();billing.accountReadHttp=account.status;billing.accountOpen=account.ok&&typeof details.open==='boolean'?details.open:null;
  }
 }catch{billing={verified:false};}
 async function call(resource,payload){
  const response=await request(`https://secretmanager.googleapis.com/v1/projects/${PROJECT}/secrets/${resource}`,{method:payload?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined,redirect:'error',signal:AbortSignal.timeout(15000)});
  const body=await response.json();
  const info=body.error?.details?.find(d=>d['@type']==='type.googleapis.com/google.rpc.ErrorInfo');
  return {response,body,safe:{http:response.status,status:body.error?.status,reason:/^[A-Z_]{1,100}$/.test(info?.reason||'')?info.reason:undefined,permission:PERMISSIONS.includes(info?.metadata?.permission)?info.metadata.permission:undefined,consumer:/^projects\/[0-9]+$/.test(info?.metadata?.consumer||'')?info.metadata.consumer:undefined,service:/^[a-z]+\.googleapis\.com$/.test(info?.metadata?.service||'')?info.metadata.service:undefined}};
 }
 for(const secret of TARGETS){
  const probe=await call(secret+':testIamPermissions',{permissions:PERMISSIONS});
  const granted=probe.response.ok?probe.body.permissions||[]:[];
  const row={secret,permissionProbe:probe.safe,permissions:Object.fromEntries(PERMISSIONS.map(p=>[p,probe.response.ok?granted.includes(p):null])),changes:[]};
  if(apply&&granted.includes('secretmanager.secrets.getIamPolicy')&&granted.includes('secretmanager.secrets.setIamPolicy')){
   // No project-wide grant; no new identity or credential. Preserve conditions and etag.
   for(const member of secret==='paris-engineer-github-private-key'?[DEPLOY,ADMIN]:[DEPLOY]){
    const current=await call(secret+':getIamPolicy?options.requestedPolicyVersion=3');
    if(!current.response.ok){row.policyRead=current.safe;break;}
    const policy=addReader(current.body,member);
    if(!policy)continue;
    const write=await call(secret+':setIamPolicy',{policy});
    row.changes.push({member,...write.safe});
    if(!write.response.ok)break;
   }
  }
  const access=await call(secret+'/versions/latest:access');
  // Never emit payload.data, raw Google bodies, tokens, or policy members.
  row.access=access.safe;row.accessVerified=access.response.ok;
  const after=await call(secret+':testIamPermissions',{permissions:PERMISSIONS});
  row.permissionsAfter=Object.fromEntries(PERMISSIONS.map(p=>[p,after.response.ok?(after.body.permissions||[]).includes(p):null]));
  results.push(row);
 }
 return {project:PROJECT,identity:DEPLOY,billing,results,allAccessible:results.every(x=>x.accessVerified)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 repairAdminSecretAccess({token:google(['auth','print-access-token']),apply:process.argv.includes('--apply')}).then(r=>{console.log(JSON.stringify(r));if(!r.allAccessible)process.exitCode=1;}).catch(()=>{console.error('ADMIN_SECRET_ACCESS_REPAIR_FAILED');process.exitCode=1;});
}
