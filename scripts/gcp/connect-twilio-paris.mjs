import {pathToFileURL} from 'node:url';
import {loadGoogleConfig} from './runtime-config.mjs';
import {verifiedTwilioBindings} from './bind-twilio-runtime.mjs';
const NUMBER='+14632401404';
const DOMAIN='elevate-4632401404.pstn.twilio.com';
const SIP='sip:phone.elevateforhumanity.org:5061;transport=tls';
export async function connectTwilioParis(bindings,request=fetch) {
 const account=bindings.TWILIO_ACCOUNT_SID;
 if(bindings.TWILIO_PHONE_NUMBER!==NUMBER||!/^AC[a-f0-9]{32}$/i.test(account||''))throw Error('VOICE_ACCOUNT_IDENTITY_INVALID');
 const headers={Authorization:'Basic '+Buffer.from(account+':'+bindings.TWILIO_AUTH_TOKEN).toString('base64')};
 async function api(url,values) {
  const parsed=new URL(url);
  if(!['https://api.twilio.com','https://trunking.twilio.com'].includes(parsed.origin))throw Error('VOICE_API_ORIGIN_REJECTED');
  const response=await request(url,{method:values?'POST':'GET',headers:values?{...headers,'Content-Type':'application/x-www-form-urlencoded'}:headers,
   ...(values?{body:new URLSearchParams(values).toString()}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('VOICE_PROVIDER_HTTP_'+response.status);
  return response.json();
 }
 const accountBase=`https://api.twilio.com/2010-04-01/Accounts/${account}`;
 const list=await api(accountBase+'/IncomingPhoneNumbers.json?PhoneNumber=%2B14632401404&PageSize=20');
 const number=list.incoming_phone_numbers?.find(n=>n.account_sid===account&&n.phone_number===NUMBER);
 if(!number||!/^PN[a-f0-9]{32}$/i.test(number.sid||''))throw Error('VOICE_NUMBER_OWNERSHIP_UNVERIFIED');
 const inventory=await api('https://trunking.twilio.com/v1/Trunks?PageSize=100');
 if(!Array.isArray(inventory.trunks)||inventory.meta?.next_page_url)throw Error('VOICE_TRUNK_INVENTORY_INCOMPLETE');
 const matches=inventory.trunks.filter(t=>t.domain_name===DOMAIN);
 if(matches.length>1)throw Error('VOICE_TRUNK_AMBIGUOUS');
 let trunk=matches[0];
 if(!trunk)trunk=await api('https://trunking.twilio.com/v1/Trunks',{FriendlyName:'Elevate owned PBX 4632401404',DomainName:DOMAIN,Secure:'true'});
 if(trunk.account_sid!==account||trunk.domain_name!==DOMAIN||!/^TK[a-f0-9]{32}$/i.test(trunk.sid||''))throw Error('VOICE_TRUNK_OWNERSHIP_UNVERIFIED');
 if(number.trunk_sid&&number.trunk_sid!==trunk.sid||number.voice_application_sid)throw Error('VOICE_EXISTING_ROUTE_CHANGED_REVIEW_REQUIRED');
 const base='https://trunking.twilio.com/v1/Trunks/'+trunk.sid;
 const attached=await api(base+'/PhoneNumbers?PageSize=100');
 if(!Array.isArray(attached.phone_numbers)||attached.meta?.next_page_url||attached.phone_numbers.some(n=>n.sid!==number.sid))throw Error('VOICE_SHARED_TRUNK_REJECTED');
 if(trunk.secure!==true)trunk=await api(base,{Secure:'true'});
 if(trunk.secure!==true)throw Error('VOICE_SECURE_TRUNK_UNVERIFIED');
 const origins=await api(base+'/OriginationUrls?PageSize=100');
 if(!Array.isArray(origins.origination_urls)||origins.meta?.next_page_url||origins.origination_urls.some(u=>u.sip_url!==SIP))throw Error('VOICE_TRUNK_DESTINATION_REVIEW_REQUIRED');
 let origin=origins.origination_urls[0];
 if(!origin)origin=await api(base+'/OriginationUrls',{FriendlyName:'Elevate Google PBX',SipUrl:SIP,Priority:'10',Weight:'10',Enabled:'true'});
 else if(origin.enabled!==true)origin=await api(base+'/OriginationUrls/'+origin.sid,{Enabled:'true'});
 if(origin.sip_url!==SIP||origin.enabled!==true)throw Error('VOICE_ORIGINATION_UNVERIFIED');
 const url=accountBase+'/IncomingPhoneNumbers/'+number.sid+'.json';
 let changed=false;
 try {
  const prior=await api(url);
  if(prior.account_sid!==account||prior.phone_number!==NUMBER||prior.trunk_sid!==number.trunk_sid||prior.voice_application_sid!==number.voice_application_sid||prior.voice_url!==number.voice_url)
   throw Error('VOICE_CONCURRENT_ROUTE_CHANGE');
  if(number.trunk_sid!==trunk.sid){changed=true;await api(url,{TrunkSid:trunk.sid});}
  const verified=await api(url);
  if(verified.account_sid!==account||verified.phone_number!==NUMBER||verified.trunk_sid!==trunk.sid||verified.voice_application_sid)throw Error('VOICE_NUMBER_ROUTE_NOT_CONFIRMED');
  const finalOrigins=await api(base+'/OriginationUrls?PageSize=100');
  if(!finalOrigins.origination_urls?.some(u=>u.sip_url===SIP&&u.enabled===true))throw Error('VOICE_ORIGINATION_READBACK_FAILED');
  return {numberOwnershipVerified:true,secureTrunkVerified:true,ownedPbxDestinationVerified:true,carrierRouteChanged:changed,liveCallAcceptance:'NOT_TESTED'};
 } catch(error) {
  if(changed) {
   try {
    await api(url,{TrunkSid:number.trunk_sid||'',VoiceApplicationSid:number.voice_application_sid||'',VoiceUrl:number.voice_url||'',VoiceMethod:number.voice_method||'POST'});
    const restored=await api(url);
    if((restored.trunk_sid||'')!==(number.trunk_sid||'')||(restored.voice_application_sid||'')!==(number.voice_application_sid||'')||restored.voice_url!==number.voice_url)throw Error('mismatch');
   } catch {throw Error('VOICE_CUTOVER_ROLLBACK_UNCONFIRMED');}
  }
  throw error;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 if(process.env.AUTHORIZED_ACTIVE_PHONE!==NUMBER)throw Error('VOICE_CUTOVER_AUTHORIZATION_REQUIRED');
 Promise.resolve().then(()=>verifiedTwilioBindings(loadGoogleConfig('admin'))).then(bindings=>connectTwilioParis(bindings))
  .then(result=>console.log(JSON.stringify(result)))
  .catch(error=>{console.error(/^VOICE_[A-Z_0-9]+$/.test(error.message)?error.message:'VOICE_CUTOVER_NOT_CONFIRMED');process.exitCode=1;});
}
