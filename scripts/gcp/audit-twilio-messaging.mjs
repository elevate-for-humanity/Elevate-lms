import {pathToFileURL} from 'node:url';
import {loadGoogleConfig} from './runtime-config.mjs';
import {verifiedTwilioBindings} from './bind-twilio-runtime.mjs';

export function voiceRouting(number) {
  let url;
  try { url = new URL(number.voice_url); } catch { /* A trunk/application may own routing. */ }
  const owned = url?.protocol === 'https:' && !url.username && !url.password &&
    ['admin.elevateforhumanity.org', 'app.elevateforhumanity.org', 'www.elevateforhumanity.org', 'elevateforhumanity.org', 'phone.elevateforhumanity.org'].includes(url.hostname);
  return {
    trunkConfigured: /^TK[a-f0-9]{32}$/i.test(number.trunk_sid || ''),
    applicationConfigured: /^AP[a-f0-9]{32}$/i.test(number.voice_application_sid || ''),
    webhookConfigured: Boolean(url),
    ownedHttpsWebhook: Boolean(owned),
    // Query strings and arbitrary third-party destinations can contain secrets.
    ownedWebhookOrigin: owned ? url.origin : null,
    ownedWebhookPath: owned && /^\/[a-zA-Z0-9_/-]*$/.test(url.pathname) ? url.pathname : null,
    method: ['POST', 'GET'].includes(number.voice_method) ? number.voice_method : 'UNVERIFIED',
    liveCallAcceptance: 'NOT_TESTED',
  };
}

// Read existing account resources only. Never submit registrations, change
// sender capabilities, send messages, or print credentials/contact content.
export async function auditMessaging(bindings, request=fetch) {
  const account=bindings.TWILIO_ACCOUNT_SID, token=bindings.TWILIO_AUTH_TOKEN;
  if(!/^AC[a-f0-9]{32}$/i.test(account||'') || !token)throw Error('TWILIO_AUDIT_CREDENTIALS_REQUIRED');
  const headers={Authorization:'Basic '+Buffer.from(account+':'+token).toString('base64')};
  async function get(url) {
    const parsed=new URL(url);
    if(!['https://api.twilio.com','https://messaging.twilio.com'].includes(parsed.origin) || parsed.username || parsed.password)
      throw Error('TWILIO_AUDIT_ORIGIN_REJECTED');
    let response;
    try {response=await request(url,{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(15000)});}
    catch {throw Error('TWILIO_AUDIT_NETWORK_FAILED');}
    if(!response.ok)throw Error('TWILIO_AUDIT_HTTP_'+response.status);
    return response.json();
  }
  async function list(url,key) {
    const rows=[];
    for(let page=0;url && page<5;page++) {
      const body=await get(url);
      if(!Array.isArray(body[key]))throw Error('TWILIO_AUDIT_RESPONSE_INVALID');
      rows.push(...body[key]);
      url=body.meta?.next_page_url||null;
    }
    if(url)throw Error('TWILIO_AUDIT_INVENTORY_INCOMPLETE');
    return rows;
  }
  const number=await get(`https://api.twilio.com/2010-04-01/Accounts/${account}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(bindings.TWILIO_PHONE_NUMBER)}&PageSize=50`);
  const owned=number.incoming_phone_numbers?.find(n=>n.account_sid===account && n.phone_number===bindings.TWILIO_PHONE_NUMBER);
  if(!owned || !/^PN[a-f0-9]{32}$/i.test(owned.sid||''))throw Error('TWILIO_AUDIT_NUMBER_NOT_VERIFIED');
  const voice = voiceRouting(owned);
  if (voice.applicationConfigured) {
    const application = await get(`https://api.twilio.com/2010-04-01/Accounts/${account}/Applications/${owned.voice_application_sid}.json`);
    if (application.account_sid !== account || application.sid !== owned.voice_application_sid) throw Error('TWILIO_AUDIT_APPLICATION_NOT_VERIFIED');
    voice.applicationRouting = voiceRouting(application);
  }
  const services=await list('https://messaging.twilio.com/v1/Services?PageSize=50','services');
  const matches=[];
  for(const service of services) {
    if(service.account_sid!==account || !/^MG[a-f0-9]{32}$/i.test(service.sid||''))throw Error('TWILIO_AUDIT_SERVICE_NOT_VERIFIED');
    const base=`https://messaging.twilio.com/v1/Services/${service.sid}`;
    const senders=await list(base+'/PhoneNumbers?PageSize=50','phone_numbers');
    if(!senders.some(n=>n.sid===owned.sid))continue;
    const campaigns=await list(base+'/Compliance/Usa2p?PageSize=50','us_app_to_person');
    const statuses=campaigns.map(c=>['VERIFIED','PENDING','IN_PROGRESS','FAILED'].includes(c.campaign_status)?c.campaign_status:'UNKNOWN');
    matches.push({numberAssigned:true,campaignStatuses:statuses});
  }
  return {numberOwnershipVerified:true,providerCapabilities:{sms:owned.capabilities?.sms===true,mms:owned.capabilities?.mms===true,voice:owned.capabilities?.voice===true},
    voiceRouting:voice,assignedMessagingServices:matches,verifiedCampaign:matches.some(s=>s.campaignStatuses.includes('VERIFIED')),messagesSent:0,configurationChanged:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  Promise.resolve().then(()=>verifiedTwilioBindings(loadGoogleConfig('admin')))
    .then(bindings=>auditMessaging(bindings)).then(result=>console.log(JSON.stringify(result)))
    .catch(error=>{console.error(/^TWILIO_AUDIT_[A-Z_0-9]+$/.test(error.message)?error.message:'TWILIO_MESSAGING_AUDIT_BLOCKED');process.exitCode=1;});
}
