import {pathToFileURL} from 'node:url';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {google,loadGoogleConfig,configSecret,PROJECT} from './runtime-config.mjs';
export const SOURCE='https://cuxzzpsyufcewtmicszk.supabase.co';
export const REDIRECT='https://www.elevateforhumanity.org/api/auth/quickbooks/callback';
export function productionCredentials(env=process.env){
 const clientId=env.QB_CLIENT_ID||'',clientSecret=env.QB_CLIENT_SECRET||'';
 if(clientId!=='AB36wjMVx59aNggdTvM8qhnTGgmvuRPkx3a4efcXCkmeo6mFWL'||!/^[A-Za-z0-9]{20,256}$/.test(clientSecret))throw Error('PRODUCTION_CREDENTIALS_INVALID');
 return {clientId,clientSecret};
}
export async function configureDatabase({env=process.env,request=fetch}={}){
 const {clientId,clientSecret}=productionCredentials(env);
 if(!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('DATABASE_CREDENTIAL_MISSING');
 async function rpc(name,body){
  const response=await request(SOURCE+'/rest/v1/rpc/'+name,{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!response.ok)throw Error('DATABASE_CONFIGURATION_REJECTED');return response.json();
 }
 const changed=await rpc('configure_quickbooks_oauth_application',{p_client_id:clientId,p_client_secret:clientSecret,p_redirect_uri:REDIRECT});
 if(typeof changed!=='boolean')throw Error('DATABASE_CONFIGURATION_UNVERIFIED');
 for(const [key,expected] of Object.entries({QB_CLIENT_ID:clientId,QB_CLIENT_SECRET:clientSecret,QB_REDIRECT_URI:REDIRECT,QB_ENVIRONMENT:'production'})){
  if(await rpc('get_platform_secret',{p_key:key})!==expected)throw Error('DATABASE_READBACK_FAILED');
 }
 return {databaseConfigured:true,applicationChanged:changed,companyAuthorizationVerified:false,valuesExposed:false};
}
export function configureGoogle({env=process.env,run=google}={}){
 const {clientId,clientSecret}=productionCredentials(env),services=[];
 const folder=mkdtempSync(join(tmpdir(),'qb-production-bindings-'));
 try{
  for(const component of ['admin','marketing','lms','store']){
   const config=loadGoogleConfig(component,run),next=structuredClone(config);
   const updates={QB_CLIENT_ID:clientId,QB_CLIENT_SECRET:clientSecret,QB_REDIRECT_URI:REDIRECT,QB_ENVIRONMENT:'production'};
   Object.assign(next.runtimeEnvironment,updates);
   const retired=['QB_ACCESS_TOKEN','QB_REFRESH_TOKEN','QB_TOKEN_EXPIRES','QB_REALM_ID'];
   for(const key of retired)delete next.runtimeEnvironment[key];
   if(JSON.stringify(next)!==JSON.stringify(config)){
    const file=join(folder,component+'.json');writeFileSync(file,JSON.stringify(next),{mode:0o600});
    run(['secrets','versions','add',configSecret(component),'--project',PROJECT,'--data-file',file,'--format=value(name)']);
    if(JSON.stringify(loadGoogleConfig(component,run))!==JSON.stringify(next))throw Error('GOOGLE_CONFIG_READBACK_FAILED');
   }
   const flags=join(folder,component+'-env.json');writeFileSync(flags,JSON.stringify({'--update-env-vars':updates,'--remove-env-vars':retired.join(',')}),{mode:0o600});
   const service='elevate-'+component+'-migration';
   run(['run','services','update',service,'--project',PROJECT,'--region','us-central1','--flags-file',flags,'--quiet','--format=value(status.latestReadyRevisionName)']);
   const current=JSON.parse(run(['run','services','describe',service,'--project',PROJECT,'--region','us-central1','--format=json']));
   const traffic=(current.status?.traffic||[]).filter(row=>row.percent>0);
   if(traffic.length!==1||traffic[0].percent!==100)throw Error('SERVING_REVISION_AMBIGUOUS');
   const revision=JSON.parse(run(['run','revisions','describe',traffic[0].revisionName,'--project',PROJECT,'--region','us-central1','--format=json']));
   const active=Object.fromEntries((revision.spec.containers[0].env||[]).map(row=>[row.name,row.value]));
   if(Object.entries(updates).some(([key,value])=>active[key]!==value)||retired.some(key=>active[key]!==undefined))throw Error('SERVING_CONFIGURATION_UNVERIFIED');
   services.push({component,configurationVerified:true});
  }
  return {services,companyAuthorizationVerified:false,valuesExposed:false};
 }finally{rmSync(folder,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(process.argv.includes('--google')?configureGoogle():await configureDatabase()));}
 catch(error){console.error(JSON.stringify({error:/^[A-Z_]+$/.test(error.message)?error.message:error.code||'QUICKBOOKS_CONFIGURATION_FAILED',valuesExposed:false}));process.exitCode=1;}
}
