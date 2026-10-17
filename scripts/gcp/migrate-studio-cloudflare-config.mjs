import {pathToFileURL} from 'node:url';
import {google,loadGoogleConfig,validateConfig,configSecret,PROJECT} from './runtime-config.mjs';
export const KEYS=['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_AI_MODEL','CLOUDFLARE_AI_API_TOKEN'];
const fail=code=>{throw new Error(code);};
// Copies only the three existing runtime keys. No IAM, container, traffic,
// pricing, source-store mutation or plaintext temporary file is involved.
export async function migrateStudioCloudflare({run=google,request=fetch,apply=false}={}){
 const original=loadGoogleConfig('admin',run);
 const env=original.runtimeEnvironment;
 const root=env.NEXT_PUBLIC_SUPABASE_URL||env.SUPABASE_URL;
 if(root!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)fail('STUDIO_SECRET_SOURCE_UNVERIFIED');
 const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'};
 const read=async(url,options={})=>{
  let response;try{response=await request(url,{...options,redirect:'error',signal:AbortSignal.timeout(20000)});}catch{fail('STUDIO_SECRET_PROVIDER_UNREACHABLE');}
  if(!response.ok)fail('STUDIO_SECRET_PROVIDER_REJECTED');
  try{return await response.json();}catch{fail('STUDIO_SECRET_PROVIDER_RESPONSE_INVALID');}
 };
 const rows=await read(root+'/rest/v1/platform_secrets?select=key,scope&scope=eq.runtime&key=in.('+KEYS.join(',')+')',{headers});
 if(!Array.isArray(rows)||rows.length!==KEYS.length||!KEYS.every(key=>rows.some(row=>row.key===key&&row.scope==='runtime')))fail('STUDIO_SECRET_INVENTORY_INCOMPLETE');
 const values={};
 for(const key of KEYS){
  const value=await read(root+'/rest/v1/rpc/get_platform_secret',{method:'POST',headers,body:JSON.stringify({p_key:key})});
  if(typeof value!=='string'||!value.trim()||value!==value.trim())fail('STUDIO_SECRET_VALUE_INVALID');
  if(env[key]&&env[key]!==value)fail('STUDIO_GOOGLE_CONFIG_CONFLICT');
  values[key]=value;
 }
 if(!/^[a-f0-9]{32}$/.test(values.CLOUDFLARE_ACCOUNT_ID)||!/^@cf\/[a-zA-Z0-9._/-]+$/.test(values.CLOUDFLARE_AI_MODEL))fail('STUDIO_PROVIDER_IDENTITY_INVALID');
 const url=new URL('https://api.cloudflare.com/client/v4/accounts/'+values.CLOUDFLARE_ACCOUNT_ID+'/ai/models/search');
 url.searchParams.set('search',values.CLOUDFLARE_AI_MODEL);url.searchParams.set('per_page','50');
 const catalog=await read(url,{headers:{Authorization:'Bearer '+values.CLOUDFLARE_AI_API_TOKEN,Accept:'application/json'}});
 if(catalog.success!==true||!Array.isArray(catalog.result)||!catalog.result.some(model=>model.name===values.CLOUDFLARE_AI_MODEL))fail('STUDIO_PROVIDER_MODEL_UNVERIFIED');
 const next={...original,runtimeEnvironment:{...env,...values}};validateConfig(next,'admin');
 const changed=KEYS.some(key=>env[key]!==values[key]);
 const summary={keys:KEYS,source:'canonical-runtime',providerVerified:true,configurationChanged:false,applicationDeployed:false,trafficChanged:false};
 if(!apply||!changed)return {...summary,mode:apply?'already-configured':'validate-only'};
 if(JSON.stringify(loadGoogleConfig('admin',run))!==JSON.stringify(original))fail('STUDIO_CONFIG_CHANGED_DURING_VALIDATION');
 const receipt=JSON.parse(run(['secrets','versions','add',configSecret('admin'),'--project='+PROJECT,'--data-file=-','--format=json'],JSON.stringify(next)));
 // CLI can return the numeric Google project ID in its resource name.
 if(!/^projects\/(?:elegant-racer-299721|484736877039)\/secrets\/elevate-admin-runtime-config\/versions\/\d+$/.test(receipt.name||''))fail('STUDIO_CONFIG_VERSION_UNVERIFIED');
 const readback=JSON.parse(run(['secrets','versions','access',receipt.name.split('/').pop(),'--secret='+configSecret('admin'),'--project='+PROJECT]));
 if(JSON.stringify(readback)!==JSON.stringify(next))fail('STUDIO_CONFIG_READBACK_FAILED');
 if(JSON.stringify(loadGoogleConfig('admin',run))!==JSON.stringify(next))fail('STUDIO_CONFIG_LATEST_CHANGED');
 return {...summary,mode:'applied',configurationChanged:true,configurationVersion:receipt.name,previousVersionsPreserved:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await migrateStudioCloudflare({apply:process.env.STUDIO_CONFIG_APPLY==='true'})));}
 catch(error){console.error(JSON.stringify({error:/^STUDIO_[A-Z_]+$/.test(error.message)?error.message:'STUDIO_CONFIG_MIGRATION_FAILED',applicationDeployed:false,trafficChanged:false}));process.exitCode=1;}
}
