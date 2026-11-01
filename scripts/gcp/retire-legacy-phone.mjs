import {pathToFileURL} from 'node:url';
import {loadGoogleConfig} from './runtime-config.mjs';
import {verifiedTwilioBindings} from './bind-twilio-runtime.mjs';
import {voiceRouting} from './audit-twilio-messaging.mjs';
const LEGACY_ID='3050756061020554451';
const LEGACY_NUMBER='+13179999620';

/** Explicitly authorized disposal of this one retired line; never bulk-release an account. */
export async function releaseLegacyNumber(token,request=fetch) {
  if(typeof token!=='string'||!token.trim())throw Error('LEGACY_CARRIER_CREDENTIAL_UNAVAILABLE');
  const url='https://api.telnyx.com/v2/phone_numbers/'+LEGACY_ID;
  const options={headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(15000)};
  const before=await request(url,{...options,method:'GET'});
  if(before.status===404)return {carrierNumberAbsent:true,alreadyAbsent:true};
  if(!before.ok)throw Error('LEGACY_CARRIER_INSPECTION_HTTP_'+before.status);
  const record=(await before.json()).data;
  if(record?.id!==LEGACY_ID||record.phone_number!==LEGACY_NUMBER)throw Error('LEGACY_CARRIER_IDENTITY_MISMATCH');
  if(record.deletion_lock_enabled===true)throw Error('LEGACY_CARRIER_DELETION_LOCKED');
  if(record.status==='deleted')return {carrierNumberAbsent:true,alreadyAbsent:true};
  const deleted=await request(url,{...options,method:'DELETE',signal:AbortSignal.timeout(15000)});
  if(!deleted.ok)throw Error('LEGACY_CARRIER_RELEASE_HTTP_'+deleted.status);
  const after=await request(url,{...options,method:'GET',signal:AbortSignal.timeout(15000)});
  const absent=after.status===404||(after.ok&&(await after.json()).data?.status==='deleted');
  if(!absent)throw Error('LEGACY_CARRIER_RELEASE_NOT_CONFIRMED');
  return {carrierNumberAbsent:true,alreadyAbsent:false};
}

export async function inspectActiveVoice(bindings,request=fetch) {
  const account=bindings.TWILIO_ACCOUNT_SID;
  if(bindings.TWILIO_PHONE_NUMBER!=='+14632401404'||!/^AC[a-f0-9]{32}$/i.test(account||''))throw Error('ACTIVE_VOICE_IDENTITY_INVALID');
  const headers={Authorization:'Basic '+Buffer.from(account+':'+bindings.TWILIO_AUTH_TOKEN).toString('base64')};
  const numberResponse=await request(`https://api.twilio.com/2010-04-01/Accounts/${account}/IncomingPhoneNumbers.json?PhoneNumber=%2B14632401404&PageSize=20`,{headers,redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!numberResponse.ok)throw Error('ACTIVE_VOICE_INSPECTION_HTTP_'+numberResponse.status);
  const body=await numberResponse.json();
  const number=body.incoming_phone_numbers?.find(n=>n.account_sid===account&&n.phone_number==='+14632401404');
  if(!number)throw Error('ACTIVE_VOICE_NUMBER_NOT_VERIFIED');
  const routing=voiceRouting(number);
  // No caller identifiers, phone numbers, recordings, or provider payloads are emitted.
  return {numberOwnershipVerified:true,routing,callsPlaced:0,configurationChanged:false};
}
async function canonicalLegacyCredential(config,request=fetch) {
  const env=config.runtimeEnvironment;
  if(env.TELNYX_API_KEY?.trim())return env.TELNYX_API_KEY.trim();
  const base=env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL;
  if(base!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('LEGACY_CARRIER_CREDENTIAL_UNAVAILABLE');
  const response=await request(base+'/rest/v1/rpc/get_platform_secret',{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_key:'TELNYX_API_KEY'}),redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('LEGACY_CARRIER_CREDENTIAL_UNAVAILABLE');
  return response.json();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  if(process.env.AUTHORIZED_LEGACY_PHONE_REMOVAL!==LEGACY_NUMBER)throw Error('LEGACY_REMOVAL_AUTHORIZATION_REQUIRED');
  const config=loadGoogleConfig('admin');
  const jobs={legacyCarrier:async()=>releaseLegacyNumber(await canonicalLegacyCredential(config)),activeVoice:async()=>inspectActiveVoice(await verifiedTwilioBindings(config))};
  for(const [action,job] of Object.entries(jobs)) {
    try {console.log(JSON.stringify({action,result:await job()}));}
    catch(error){console.error(JSON.stringify({action,error:/^(LEGACY_CARRIER_|ACTIVE_VOICE_)[A-Z_0-9]+$/.test(error.message)?error.message:'PHONE_PROVIDER_OPERATION_NOT_CONFIRMED'}));process.exitCode=1;}
  }
}
