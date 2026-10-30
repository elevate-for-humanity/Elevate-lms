import {pathToFileURL} from 'node:url';
import {google,loadGoogleConfig} from './runtime-config.mjs';
import {migrateStorePayPal} from './migrate-store-paypal-config.mjs';

// Verify the actual billing authority. This path creates no invoices, charges,
// subscriptions or webhook registrations and never mutates runtime settings.
export async function verifyActiveBilling({run=google,request=fetch,
 readConfig=()=>loadGoogleConfig('marketing',run),verifyPayPal=migrateStorePayPal}={}) {
 const base={ready:false,configurationChanged:false,transactionsCreated:0};
 try {
  const env=readConfig().runtimeEnvironment;
  if(env.NEXT_PUBLIC_SUPABASE_URL!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)
   return {...base,error:'BILLING_CONFIGURATION_UNVERIFIED'};
  const response=await request(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/platform_settings?select=key,value&key=eq.billing_provider',{
   method:'GET',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)return {...base,error:'BILLING_AUTHORITY_UNAVAILABLE'};
  const rows=await response.json();
  if(!Array.isArray(rows)||rows.length!==1||rows[0].key!=='billing_provider'||rows[0].value!=='quickbooks')
   return {...base,error:'BILLING_AUTHORITY_MISMATCH'};
  let invoices,recurring;
  try {
   const reply=await request('https://www.elevateforhumanity.org/api/health/quickbooks',{
    method:'GET',redirect:'error',signal:AbortSignal.timeout(30000)});
   const health=await reply.json();
   const ready=reply.ok&&health.service==='quickbooks'&&health.ready===true&&health.connected===true&&health.webhookVerifierConfigured===true;
   const reasons=new Set(['oauth_configuration_missing','oauth_reauthorization_required','webhook_verifier_missing','provider_access_denied','provider_request_failed','provider_timeout','connection_check_failed','production_environment_unverified','settings_lookup_failed','token_persistence_failed','oauth_response_invalid']);
   invoices={provider:'quickbooks',ready,connected:health.connected===true,webhookVerifierConfigured:health.webhookVerifierConfigured===true,
    ...(ready?{}:{reason:reasons.has(health.reason)?health.reason:'quickbooks_verification_unavailable'})};
  }catch{invoices={provider:'quickbooks',ready:false,reason:'quickbooks_verification_unavailable'};}
  try {
   const receipt=await verifyPayPal({run,request,apply:false,routeMode:'none'});
   const ready=receipt.environment==='production'&&receipt.providerAuthorizationVerified===true&&receipt.webhookRegistrationVerified===true&&receipt.webhookUsesStoreOrigin===true&&receipt.configurationChanged===false&&receipt.transactionsCreated===0;
   recurring={provider:'paypal',ready,production:receipt.environment==='production',providerAuthorizationVerified:receipt.providerAuthorizationVerified===true,
    webhookRegistrationVerified:receipt.webhookRegistrationVerified===true,webhookUsesStoreOrigin:receipt.webhookUsesStoreOrigin===true};
  }catch(error){recurring={provider:'paypal',ready:false,error:/^STORE_PAYPAL_[A-Z_0-9]+$/.test(error.message||'')?error.message:'PAYPAL_VERIFICATION_UNAVAILABLE'};}
  return {...base,primary:'quickbooks',providerSelectionVerified:true,invoices,recurring,ready:invoices.ready&&recurring.ready};
 }catch{return {...base,error:'BILLING_VERIFICATION_UNAVAILABLE'};}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=await verifyActiveBilling();console.log(JSON.stringify(result));if(!result.ready)process.exitCode=1;
}
