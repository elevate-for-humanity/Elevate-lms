import test from 'node:test';
import assert from 'node:assert/strict';
import {auditMessaging, voiceRouting} from './audit-twilio-messaging.mjs';
const account='AC'+'a'.repeat(32),phone='PN'+'b'.repeat(32),service='MG'+'c'.repeat(32);
const bindings={TWILIO_ACCOUNT_SID:account,TWILIO_AUTH_TOKEN:'private-token',TWILIO_PHONE_NUMBER:'+13175550100'};
function fixture({campaigns=['VERIFIED'],next=null}={}) {
 const calls=[];
 const request=async(url,options)=>{
  calls.push({url,method:options.method});
  const data=url.includes('IncomingPhoneNumbers')?{incoming_phone_numbers:[{sid:phone,phone_number:bindings.TWILIO_PHONE_NUMBER,account_sid:account,capabilities:{sms:true,mms:true,voice:true}}]}:
   url.includes('/PhoneNumbers')?{phone_numbers:[{sid:phone}]}:
   url.includes('/Compliance/')?{us_app_to_person:campaigns.map(campaign_status=>({campaign_status}))}:
   {services:[{sid:service,account_sid:account}],meta:{next_page_url:next}};
  return new Response(JSON.stringify(data));
 };
 return {calls,request};
}
test('reads number assignment and verified campaigns without writes or message delivery',async()=>{
 const f=fixture();const evidence=await auditMessaging(bindings,f.request);
 assert.equal(evidence.verifiedCampaign,true);assert.equal(evidence.messagesSent,0);assert.equal(evidence.configurationChanged,false);
 assert.ok(f.calls.every(c=>c.method==='GET'&&!c.url.includes('/Messages')));
 assert.equal(JSON.stringify(evidence).includes('private-token'),false);
 assert.equal(JSON.stringify(evidence).includes(bindings.TWILIO_PHONE_NUMBER),false);
});
test('hardware SMS capability cannot conceal missing carrier campaign approval',async()=>{
 const f=fixture({campaigns:['IN_PROGRESS']});const evidence=await auditMessaging(bindings,f.request);
 assert.equal(evidence.providerCapabilities.sms,true);assert.equal(evidence.verifiedCampaign,false);
});
test('untrusted pagination cannot receive account credentials',async()=>{
 const f=fixture({next:'https://attacker.example/secrets'});
 await assert.rejects(auditMessaging(bindings,f.request),/ORIGIN_REJECTED/);
 assert.equal(f.calls.length,2);
});
test('network and permission failures never expose provider response or credentials',async()=>{
 await assert.rejects(auditMessaging(bindings,async()=>{throw Error('private-token');}),/NETWORK_FAILED/);
 await assert.rejects(auditMessaging(bindings,async()=>new Response('private-token',{status:403})),/HTTP_403/);
});
test('voice routing reports the actual owned webhook but never its credentials or query',()=>{
 const evidence=voiceRouting({voice_url:'https://admin.elevateforhumanity.org/api/webhooks/twilio/voice?token=private-token',voice_method:'POST'});
 assert.equal(evidence.ownedWebhookPath,'/api/webhooks/twilio/voice');
 assert.equal(evidence.ownedHttpsWebhook,true);
 assert.equal(evidence.liveCallAcceptance,'NOT_TESTED');
 assert.doesNotMatch(JSON.stringify(evidence),/private-token|\?token/);
 for(const voice_url of ['https://attacker.example/private-token','https://user:private-token@admin.elevateforhumanity.org/voice']) {
  const result=voiceRouting({voice_url});
  assert.equal(result.ownedHttpsWebhook,false);
  assert.equal(result.ownedWebhookOrigin,null);
  assert.doesNotMatch(JSON.stringify(result),/private-token|attacker/);
 }
});
