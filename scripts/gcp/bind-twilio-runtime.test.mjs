import assert from 'node:assert/strict';
import test from 'node:test';
import {mergeTwilioBindings,verifiedTwilioBindings} from './bind-twilio-runtime.mjs';
const account='AC75bcca01e19767614252902185ed948f';
const config={version:1,component:'admin',runtimeEnvironment:{SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-store-credential',PRESERVE:'yes'},runtimeFiles:{},volumes:[]};
test('verified encrypted-store binding preserves unrelated settings and refuses credential replacement',()=>{
  const next=mergeTwilioBindings(config,{TWILIO_ACCOUNT_SID:account,TWILIO_AUTH_TOKEN:'a'.repeat(32),TWILIO_PHONE_NUMBER:'+14632401404'});
  assert.equal(next.runtimeEnvironment.PRESERVE,'yes');assert.equal(config.runtimeEnvironment.TWILIO_AUTH_TOKEN,undefined);
  assert.throws(()=>mergeTwilioBindings(next,{TWILIO_AUTH_TOKEN:'b'.repeat(32)}),/requires review/);
});
test('verify the exact purchased number using credentials in memory without placing calls',async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push(url);
    if(url.includes('/rpc/'))return new Response(JSON.stringify(JSON.parse(options.body).p_key==='TWILIO_ACCOUNT_SID'?account:'a'.repeat(32)));
    return new Response(JSON.stringify({account_sid:account,sid:'PN98930da7084d809ab410e1ece0115632',phone_number:'+14632401404'}));
  };
  const values=await verifiedTwilioBindings(config,fetchImpl);
  assert.equal(values.TWILIO_PHONE_NUMBER,'+14632401404');
  assert.equal(calls.length,3);assert.ok(calls[2].includes('/IncomingPhoneNumbers/'));
});
test('wrong-account credentials cannot be bound or used against a number',async()=>{
  let requests=0;
  await assert.rejects(verifiedTwilioBindings(config,async(_url,options)=>{
    requests++;return new Response(JSON.stringify(JSON.parse(options.body).p_key==='TWILIO_ACCOUNT_SID'?'AC'+'b'.repeat(32):'a'.repeat(32)));
  }),/approved account/);
  assert.equal(requests,2);
});
