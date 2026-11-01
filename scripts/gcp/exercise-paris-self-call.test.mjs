import test from 'node:test';
import assert from 'node:assert/strict';
import {exerciseSelfCall,greetingMatch} from './exercise-paris-self-call.mjs';
const account='AC75bcca01e19767614252902185ed948f',number='+14632401404',sid='CA'+'a'.repeat(32),trunk='TK'+'b'.repeat(32),recording='RE'+'c'.repeat(32);
const greeting='Thank you for calling Elevate for Humanity. I am Paris your virtual assistant. How can I help you with your career training today?';
const bindings={TWILIO_ACCOUNT_SID:account,TWILIO_PHONE_NUMBER:number,TWILIO_AUTH_TOKEN:'private-test-token'};
function fixture({active=false,secure=true,createError=false,callStatus='completed',absent=false}={}){
 const requests=[];const wav=Buffer.alloc(44);wav.write('RIFF',0);wav.write('WAVE',8);
 const request=async(url,options={})=>{
  url=String(url);requests.push({url,options});
  if(url.includes('/IncomingPhoneNumbers.json'))return Response.json({incoming_phone_numbers:[{account_sid:account,phone_number:number,trunk_sid:trunk}]});
  if(url.includes('/OriginationUrls?'))return Response.json({origination_urls:[{enabled:true,sip_url:'sip:phone.elevateforhumanity.org:5061;transport=tls'}]});
  if(url.endsWith('/Trunks/'+trunk))return Response.json({account_sid:account,domain_name:'elevate-4632401404.pstn.twilio.com',secure});
  if(url.includes('/Calls.json?'))return Response.json({calls:active?[{}]:[]});
  if(url.endsWith('/Calls.json')){if(createError)throw Error('network failed');return Response.json({sid,account_sid:account,to:number,from:number,status:'queued'});}
  if(url.endsWith('/Calls/'+sid+'.json'))return Response.json({sid,status:options.method==='POST'?'completed':callStatus,duration:'31'});
  if(url.includes('/Calls/'+sid+'/Recordings.json'))return Response.json({recordings:[{sid:recording,account_sid:account,call_sid:sid,status:absent?'absent':'completed',duration:absent?'-1':'30',error_code:absent?16101:null}]});
  if(url.endsWith('/Recordings/'+recording+'.wav'))return new Response(wav);
  throw Error('Unexpected request');
 };
 return {requests,request};
}
const options=f=>({request:f.request,wait:async()=>{},expectedGreeting:greeting,transcribe:async()=>greeting});
test('places exactly one bounded self-call and verifies only received greeting audio',async()=>{
 const f=fixture();const result=await exerciseSelfCall(bindings,options(f));assert.equal(result.liveGreetingAcceptance,'PASS');
 const creates=f.requests.filter(r=>r.url.endsWith('/Calls.json')&&r.options.method==='POST');assert.equal(creates.length,1);
 const params=new URLSearchParams(creates[0].options.body);assert.equal(params.get('To'),number);assert.equal(params.get('From'),number);assert.equal(params.get('TimeLimit'),'45');assert.equal(params.get('RecordingTrack'),'both');assert.equal(params.get('RecordingChannels'),'dual');assert.ok(!params.get('Twiml').includes('operator'));
 assert.equal(result.operatorTransferAcceptance,'NOT_TESTED');assert.equal(result.voicemailDeliveryAcceptance,'NOT_TESTED');assert.ok(!JSON.stringify(result).includes('private-test-token'));
});
for(const change of [{TWILIO_PHONE_NUMBER:'+15550000000'},{TWILIO_ACCOUNT_SID:'AC'+'d'.repeat(32)}])test('rejects unverified self-call identity '+Object.keys(change)[0],async()=>{
 const f=fixture();await assert.rejects(exerciseSelfCall({...bindings,...change},options(f)),/IDENTITY_REQUIRED/);assert.equal(f.requests.length,0);
});
for(const variant of [{active:true},{secure:false}])test('refuses calls before idle secure-route verification '+JSON.stringify(variant),async()=>{
 const f=fixture(variant);await assert.rejects(exerciseSelfCall(bindings,options(f)),/ACTIVE_CALLS_PRESENT|ROUTE_UNVERIFIED/);assert.ok(!f.requests.some(r=>r.options.method==='POST'));
});
test('uncertain call creation is never retried',async()=>{
 const f=fixture({createError:true});await assert.rejects(exerciseSelfCall(bindings,options(f)),/network failed/);assert.equal(f.requests.filter(r=>r.options.method==='POST').length,1);
});
test('poll timeout hangs up only the verified self-call',async()=>{
 const f=fixture({callStatus:'in-progress'});await assert.rejects(exerciseSelfCall(bindings,options(f)),/NOT_COMPLETED/);const stops=f.requests.filter(r=>r.options.method==='POST'&&!r.url.endsWith('/Calls.json'));assert.equal(stops.length,1);assert.ok(stops[0].url.endsWith('/Calls/'+sid+'.json'));
});
test('a fallback mailbox greeting cannot certify the saved PARIS script',()=>{
 assert.ok(greetingMatch(greeting,'Thank you for calling Elevate for Humanity. Please leave a message after the beep.')<0.75);
 assert.equal(greetingMatch(greeting,greeting),1);
});

test('known caller-side test speech alone cannot certify the PARIS greeting',async()=>{
 const f=fixture();const result=await exerciseSelfCall(bindings,{...options(f),transcribe:async()=> 'This is an authorized automated phone system test.'});assert.equal(result.liveGreetingAcceptance,'FAIL');
});
test('an absent recording reports its provider code without repeated polling or transcription',async()=>{
 const f=fixture({absent:true});let waits=0;await assert.rejects(exerciseSelfCall(bindings,{...options(f),wait:async()=>{waits++;},transcribe:async()=>assert.fail('absent recording must not be heard')}),/RECORDING_ABSENT_16101/);assert.equal(waits,0);
});
