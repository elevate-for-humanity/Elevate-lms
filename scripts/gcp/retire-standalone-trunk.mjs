import {pathToFileURL} from 'node:url';
import {loadGoogleConfig} from './runtime-config.mjs';
import {verifiedTwilioBindings} from './bind-twilio-runtime.mjs';
const RETIRED_DOMAIN='elevate-standalone.pstn.twilio.com';
export async function retireStandaloneTrunk(bindings,request=fetch) {
 const account=bindings.TWILIO_ACCOUNT_SID;
 if(bindings.TWILIO_PHONE_NUMBER!=='+14632401404'||!/^AC[a-f0-9]{32}$/i.test(account||''))throw Error('VOICE_RETIRE_ACCOUNT_UNVERIFIED');
 const headers={Authorization:'Basic '+Buffer.from(account+':'+bindings.TWILIO_AUTH_TOKEN).toString('base64')};
 const get=async url=>{
  const response=await request(url,{headers,redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('VOICE_RETIRE_PROVIDER_HTTP_'+response.status);
  return response.json();
 };
 const inventory=await get('https://trunking.twilio.com/v1/Trunks?PageSize=100');
 if(!Array.isArray(inventory.trunks)||inventory.meta?.next_page_url)throw Error('VOICE_RETIRE_INVENTORY_INCOMPLETE');
 const matches=inventory.trunks.filter(trunk=>trunk.domain_name===RETIRED_DOMAIN);
 if(!matches.length)return {legacyStandaloneAbsent:true,alreadyAbsent:true};
 if(matches.length!==1||!/^TK[a-f0-9]{32}$/i.test(matches[0].sid||''))throw Error('VOICE_RETIRE_TRUNK_AMBIGUOUS');
 const url='https://trunking.twilio.com/v1/Trunks/'+matches[0].sid;
 const trunk=await get(url);
 if(trunk.sid!==matches[0].sid||trunk.account_sid!==account||trunk.domain_name!==RETIRED_DOMAIN)throw Error('VOICE_RETIRE_OWNERSHIP_UNVERIFIED');
 const numbers=await get(url+'/PhoneNumbers?PageSize=100');
 if(!Array.isArray(numbers.phone_numbers)||numbers.meta?.next_page_url||numbers.phone_numbers.length)throw Error('VOICE_RETIRE_ATTACHED_NUMBERS_REQUIRE_MIGRATION');
 for(const status of ['queued','ringing','in-progress']) {
  const calls=await get(`https://api.twilio.com/2010-04-01/Accounts/${account}/Calls.json?Status=${status}&PageSize=100`);
  if(!Array.isArray(calls.calls)||calls.next_page_uri||calls.calls.length)throw Error('VOICE_ACTIVE_CALLS_PREVENT_RETIREMENT');
 }
 const deleted=await request(url,{method:'DELETE',headers,redirect:'error',signal:AbortSignal.timeout(15000)});
 if(deleted.status!==204)throw Error('VOICE_RETIRE_DELETE_NOT_CONFIRMED');
 const verified=await request(url,{headers,redirect:'error',signal:AbortSignal.timeout(15000)});
 if(verified.status!==404)throw Error('VOICE_RETIRE_ABSENCE_NOT_CONFIRMED');
 return {legacyStandaloneAbsent:true,alreadyAbsent:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 if(process.env.AUTHORIZED_RETIRED_TRUNK!==RETIRED_DOMAIN)throw Error('VOICE_RETIRE_AUTHORIZATION_REQUIRED');
 Promise.resolve().then(()=>verifiedTwilioBindings(loadGoogleConfig('admin'))).then(bindings=>retireStandaloneTrunk(bindings))
  .then(result=>console.log(JSON.stringify(result)))
  .catch(error=>{console.error(/^VOICE_[A-Z_0-9]+$/.test(error.message)?error.message:'VOICE_RETIRE_NOT_CONFIRMED');process.exitCode=1;});
}
