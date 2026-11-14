import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseLegacyNumber,inspectActiveVoice} from './retire-legacy-phone.mjs';
const record={id:'3050756061020554451',phone_number:'+13179999620',status:'active'};
const json=(data,status=200)=>new Response(JSON.stringify({data}),{status});
test('releases only the verified old number and checks carrier readback',async()=>{
 const methods=[];const request=async(url,options)=>{assert.equal(url,'https://api.telnyx.com/v2/phone_numbers/3050756061020554451');methods.push(options.method);return methods.length===1?json(record):methods.length===2?json({...record,status:'deleted'}):new Response(null,{status:404});};
 assert.deepEqual(await releaseLegacyNumber('private',request),{carrierNumberAbsent:true,alreadyAbsent:false});assert.deepEqual(methods,['GET','DELETE','GET']);
});
test('never releases a mismatched number or deletion-locked line',async()=>{
 for(const data of [{...record,phone_number:'+14632401404'},{...record,deletion_lock_enabled:true}]){
 let calls=0;await assert.rejects(releaseLegacyNumber('private',async()=>{calls++;return json(data);}),/IDENTITY_MISMATCH|DELETION_LOCKED/);assert.equal(calls,1);
 }
});
test('an absent legacy line is verified without a delete',async()=>{
 assert.equal((await releaseLegacyNumber('private',async()=>new Response(null,{status:404}))).alreadyAbsent,true);
});
test('HTTP success alone does not prove a release',async()=>{
 await assert.rejects(releaseLegacyNumber('private',async()=>json(record)),/NOT_CONFIRMED/);
});
test('missing credentials fail before external requests',async()=>{
 await assert.rejects(releaseLegacyNumber('',async()=>assert.fail('no request')),/CREDENTIAL_UNAVAILABLE/);
});
test('active voice inspection exposes only redacted routing facts',async()=>{
 const account='AC'+'a'.repeat(32);
 const result=await inspectActiveVoice({TWILIO_ACCOUNT_SID:account,TWILIO_AUTH_TOKEN:'private',TWILIO_PHONE_NUMBER:'+14632401404'},async()=>new Response(JSON.stringify({incoming_phone_numbers:[{account_sid:account,phone_number:'+14632401404',voice_url:'https://example.invalid/private?secret=value',voice_method:'POST'}]})));
 assert.equal(result.routing.ownedHttpsWebhook,false);assert.equal(JSON.stringify(result).includes('secret=value'),false);
});
