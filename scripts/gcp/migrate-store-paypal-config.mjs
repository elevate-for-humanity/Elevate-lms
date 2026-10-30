import {pathToFileURL} from 'node:url';
import {cutoverStorePayPalWebhook} from './store-paypal-webhook-cutover.mjs';
import {google,loadGoogleConfig,validateConfig,configSecret,PROJECT} from './runtime-config.mjs';
export const PAYPAL_KEYS=['PAYPAL_CLIENT_ID','PAYPAL_CLIENT_SECRET','PAYPAL_ENVIRONMENT','PAYPAL_BILLING_WEBHOOK_ID'];
const fail=code=>{throw Error(code);};
export async function migrateStorePayPal({run=google,request=fetch,apply=false,routeMode='none',expectedSha,releaseAuthorized=false}={}){
 if(!['none','validate','apply'].includes(routeMode))fail('CUTOVER_MODE_INVALID');
 if(routeMode==='apply'&&!releaseAuthorized)fail('CUTOVER_RELEASE_HOLD');
 const original=loadGoogleConfig('store',run),source=loadGoogleConfig('marketing',run),env=source.runtimeEnvironment;
 if(env.NEXT_PUBLIC_SUPABASE_URL!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)fail('STORE_PAYPAL_SOURCE_UNVERIFIED');
 async function read(url,options={}){let r;try{r=await request(url,{...options,redirect:'error',signal:AbortSignal.timeout(15000)});}catch{fail('STORE_PAYPAL_PROVIDER_UNREACHABLE');}if(!r.ok)fail('STORE_PAYPAL_PROVIDER_HTTP_'+r.status);try{return await r.json();}catch{fail('STORE_PAYPAL_RESPONSE_INVALID');}}
 const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'};
 const values={};
 for(const key of PAYPAL_KEYS){
  const value=await read(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/get_platform_secret',{method:'POST',headers,body:JSON.stringify({p_key:key})});
  if(typeof value!=='string'||!value.trim()||value!==value.trim())fail('STORE_PAYPAL_CANONICAL_CONFIGURATION_INCOMPLETE');
  values[key]=value;
  if(original.runtimeEnvironment[key]&&original.runtimeEnvironment[key]!==value)fail('STORE_PAYPAL_EXISTING_CONFIGURATION_CONFLICT');
 }
 const mode=values.PAYPAL_ENVIRONMENT;
 if(!['production','sandbox'].includes(mode))fail('STORE_PAYPAL_ENVIRONMENT_INVALID');
 const base=mode==='production'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
 const existing=original.runtimeEnvironment;
 if(existing.PAYPAL_API_BASE&&existing.PAYPAL_API_BASE!==base)fail('STORE_PAYPAL_EXISTING_CONFIGURATION_CONFLICT');
 if(existing.PAYPAL_MODE&&!((mode==='production'&&['production','live'].includes(existing.PAYPAL_MODE))||existing.PAYPAL_MODE===mode))fail('STORE_PAYPAL_EXISTING_CONFIGURATION_CONFLICT');
 const token=await read(base+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(values.PAYPAL_CLIENT_ID+':'+values.PAYPAL_CLIENT_SECRET).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});
 if(typeof token.access_token!=='string'||!token.access_token.trim())fail('STORE_PAYPAL_AUTHORIZATION_UNVERIFIED');
 const hook=await read(base+'/v1/notifications/webhooks/'+encodeURIComponent(values.PAYPAL_BILLING_WEBHOOK_ID),{headers:{Authorization:'Bearer '+token.access_token,Accept:'application/json'}});
 if(hook.id!==values.PAYPAL_BILLING_WEBHOOK_ID||!Array.isArray(hook.event_types)||!hook.event_types.some(e=>e.name==='*'||e.name?.startsWith('BILLING.SUBSCRIPTION.')))fail('STORE_PAYPAL_WEBHOOK_UNVERIFIED');
 let url;try{url=new URL(hook.url);}catch{fail('STORE_PAYPAL_WEBHOOK_URL_INVALID');}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!(url.hostname==='elevateforhumanity.org'||url.hostname.endsWith('.elevateforhumanity.org')))fail('STORE_PAYPAL_WEBHOOK_URL_INVALID');
 let routing;
 if(routeMode!=='none'){
  if(PAYPAL_KEYS.some(key=>existing[key]!==values[key]))fail('CUTOVER_STORE_CONFIG_REQUIRED');
  routing=await cutoverStorePayPalWebhook({request,base,token:token.access_token,hook,expectedSha,apply:routeMode==='apply'});
 }
 const next={...original,runtimeEnvironment:{...existing,...values}};validateConfig(next,'store');
 const summary={...(routing?{routing}:{}),keys:PAYPAL_KEYS,environment:mode,providerAuthorizationVerified:true,webhookRegistrationVerified:true,webhookUsesStoreOrigin:routing?.webhookUsesStoreOrigin??(url.origin==='https://store.elevateforhumanity.org'),configurationChanged:false,applicationDeployed:false,trafficChanged:false,transactionsCreated:0,commerceAccepted:false};
 if(!apply||JSON.stringify(next)===JSON.stringify(original))return {...summary,mode:apply?'already-configured':'validate-only'};
 if(JSON.stringify(loadGoogleConfig('store',run))!==JSON.stringify(original)||JSON.stringify(loadGoogleConfig('marketing',run))!==JSON.stringify(source))fail('STORE_PAYPAL_CONFIG_CHANGED');
 // Re-read the exact canonical family to avoid archiving a rotated credential.
 for(const key of PAYPAL_KEYS){const current=await read(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/get_platform_secret',{method:'POST',headers,body:JSON.stringify({p_key:key})});if(current!==values[key])fail('STORE_PAYPAL_CANONICAL_CHANGED');}
 const receipt=JSON.parse(run(['secrets','versions','add',configSecret('store'),'--project='+PROJECT,'--data-file=-','--format=json'],JSON.stringify(next)));
 if(!/^projects\/(?:elegant-racer-299721|484736877039)\/secrets\/elevate-store-runtime-config\/versions\/\d+$/.test(receipt.name||''))fail('STORE_PAYPAL_CONFIG_VERSION_UNVERIFIED');
 const readback=JSON.parse(run(['secrets','versions','access',receipt.name.split('/').pop(),'--secret='+configSecret('store'),'--project='+PROJECT]));
 if(JSON.stringify(readback)!==JSON.stringify(next)||JSON.stringify(loadGoogleConfig('store',run))!==JSON.stringify(next))fail('STORE_PAYPAL_CONFIG_READBACK_FAILED');
 return {...summary,mode:'applied',configurationChanged:true,configurationVersion:receipt.name,previousVersionsPreserved:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(await migrateStorePayPal({apply:process.env.STORE_PAYPAL_APPLY==='true',routeMode:process.env.STORE_PAYPAL_ROUTE_MODE??'none',expectedSha:process.env.STORE_PAYPAL_EXPECTED_SHA??process.env.GITHUB_SHA,releaseAuthorized:process.env.GOOGLE_RELEASE_HOLD==='false'})));}catch(e){console.error(JSON.stringify({error:/^STORE_PAYPAL_[A-Z_0-9]+$/.test(e.message)?e.message:'STORE_PAYPAL_MIGRATION_FAILED',applicationDeployed:false,trafficChanged:false}));process.exitCode=1;}}
