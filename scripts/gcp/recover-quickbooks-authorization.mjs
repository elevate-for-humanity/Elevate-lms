import {pathToFileURL} from 'node:url';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {google,loadGoogleConfig,configSecret,PROJECT} from './runtime-config.mjs';
const SOURCE='https://cuxzzpsyufcewtmicszk.supabase.co';
const TOKEN='https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const allowedErrors=new Set(['invalid_grant','invalid_client','unauthorized_client','invalid_request','temporarily_unavailable','server_error']);
export async function recoverQuickBooksAuthorization({run=google,request=fetch}={}) {
 const configs=['admin','marketing','lms','store'].map(component=>({component,config:loadGoogleConfig(component,run)}));
 const bootstrap=configs[0].config.runtimeEnvironment;
 if((bootstrap.SUPABASE_URL||bootstrap.NEXT_PUBLIC_SUPABASE_URL||'').replace(/\/$/,'')!==SOURCE||!bootstrap.SUPABASE_SERVICE_ROLE_KEY)throw Error('SOURCE_CONFIGURATION_UNAVAILABLE');
 const headers={apikey:bootstrap.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+bootstrap.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'};
 async function database(path,body) {
  const response=await request(SOURCE+'/rest/v1/'+path,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('DATABASE_OPERATION_REJECTED');return response.json();
 }
 async function settings(){return Object.fromEntries((await database('app_settings?select=key,value&key=in.(QB_CLIENT_ID,QB_CLIENT_SECRET,QB_REFRESH_TOKEN,QB_REALM_ID,QB_REDIRECT_URI)')).map(row=>[row.key,row.value]));}
 const saved=await settings();
 const canonical={};for(const key of ['QB_CLIENT_ID','QB_CLIENT_SECRET'])canonical[key]=await database('rpc/get_platform_secret',{p_key:key});
 const candidates=[{source:'canonical-vault',env:canonical},{source:'saved-settings',env:saved},...configs.map(row=>({source:'google-'+row.component,env:row.config.runtimeEnvironment}))];
 const seen=new Set(),attempts=[];
 for(const {source,env} of candidates){
  const id=env.QB_CLIENT_ID,secret=env.QB_CLIENT_SECRET;
  if(!id||!secret)continue;
  const identity=JSON.stringify([id,secret]);if(seen.has(identity))continue;seen.add(identity);
  const current=await settings();if(!current.QB_REFRESH_TOKEN||!/^\d+$/.test(current.QB_REALM_ID||''))throw Error('SAVED_AUTHORIZATION_UNAVAILABLE');
  const response=await request(TOKEN,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:current.QB_REFRESH_TOKEN}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
  const body=await response.json().catch(()=>null);
  if(!response.ok){attempts.push({source,status:response.status,error:allowedErrors.has(body?.error)?body.error:'refresh_rejected'});if(response.status===429||response.status>=500)break;continue;}
  if(typeof body?.access_token!=='string'||!body.access_token||typeof body?.refresh_token!=='string'||!body.refresh_token||!Number.isFinite(body.expires_in)||body.expires_in<=0||body.expires_in>86400)throw Error('INVALID_TOKEN_RESPONSE');
  const realm=current.QB_REALM_ID;
  const company=await request('https://quickbooks.api.intuit.com/v3/company/'+realm+'/companyinfo/'+realm+'?minorversion=75',{headers:{Authorization:'Bearer '+body.access_token,Accept:'application/json'},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
  const info=await company.json().catch(()=>null);
  if(!company.ok||String(info?.CompanyInfo?.Id||'')!==realm){
   const code=String(info?.Fault?.Error?.[0]?.code||'');
   attempts.push({source,status:company.status,error:'company_verification_failed',providerFaultCode:/^\d{1,6}$/.test(code)?code:undefined,realmMatched:String(info?.CompanyInfo?.Id||'')===realm});
   continue;
  }
  const stored=await database('rpc/save_verified_quickbooks_authorization',{p_expected_refresh_token:current.QB_REFRESH_TOKEN,p_client_id:id,p_client_secret:secret,p_realm_id:realm,p_tokens:body});
  if(stored!==true)throw Error('NEWER_AUTHORIZATION_PRESERVED');
  const directory=mkdtempSync(join(tmpdir(),'qb-verified-'));
  try{
   for(const {component,config} of configs){
    const next=structuredClone(config);Object.assign(next.runtimeEnvironment,{QB_CLIENT_ID:id,QB_CLIENT_SECRET:secret,QB_ENVIRONMENT:'production'});
    if(JSON.stringify(next)===JSON.stringify(config))continue;
    const file=join(directory,component+'.json');writeFileSync(file,JSON.stringify(next),{mode:0o600});
    run(['secrets','versions','add',configSecret(component),'--project',PROJECT,'--data-file',file,'--format=value(name)']);
    if(JSON.stringify(loadGoogleConfig(component,run))!==JSON.stringify(next))throw Error('RUNTIME_CONFIG_READBACK_FAILED');
   }
  }finally{rmSync(directory,{recursive:true,force:true});}
  return {recovered:true,companyVerified:true,tokensSaved:true,issuingClientSource:source,attempts,valuesExposed:false};
 }
 return {recovered:false,companyVerified:false,attempts,consentRequired:attempts.length>0&&attempts.every(row=>row.error==='invalid_grant'),valuesExposed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const result=await recoverQuickBooksAuthorization();console.log(JSON.stringify(result));if(!result.recovered)process.exitCode=1;}
 catch(error){console.error(JSON.stringify({recovered:false,error:/^[A-Z_]+$/.test(error.message)?error.message:'RECOVERY_UNAVAILABLE',valuesExposed:false}));process.exitCode=1;}
}
