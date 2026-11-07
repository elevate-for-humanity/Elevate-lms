import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {exerciseSelfCall,greetingMatch,summarizeSpeech,heardMenuDigits,recognitionProgram} from './exercise-paris-self-call.mjs';
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
test('handset exercise uses operator zero once without recording or treating completion as audible delivery',async()=>{
 const f=fixture();const result=await exerciseSelfCall(bindings,{...options(f),handsetTest:true,transcribe:async()=>{throw Error('must not record or transcribe handset');}});
 const creates=f.requests.filter(r=>r.url.endsWith('/Calls.json')&&r.options.method==='POST');assert.equal(creates.length,1);
 const params=new URLSearchParams(creates[0].options.body);
 assert.equal(params.get('To'),number);assert.equal(params.get('From'),number);assert.equal(params.get('TimeLimit'),'105');assert.equal(params.get('Record'),'false');
 assert.match(params.get('Twiml'),/<Play digits="w0"\/>/);assert.match(params.get('Twiml'),/authorized Elevate for Humanity handset test/);
 assert.equal(f.requests.some(r=>r.url.includes('/Recordings')),false);
 assert.equal(result.handsetRingingAcceptance,'REQUIRES_OWNER_CONFIRMATION');assert.equal(result.operatorTransferAcceptance,'REQUIRES_OWNER_CONFIRMATION');
 await assert.rejects(exerciseSelfCall(bindings,{...options(f),handsetTest:true,operatorTest:true}),/SCENARIO_INVALID/);
 const uncertain=fixture({createError:true});await assert.rejects(exerciseSelfCall(bindings,{...options(uncertain),handsetTest:true}),/network failed/);
 assert.equal(uncertain.requests.filter(r=>r.url.endsWith('/Calls.json')&&r.options.method==='POST').length,1);
});
test('a long stereo menu recording is recognized in bounded chunks with original channel and word timing',()=>{
 const samples=Buffer.alloc(75*8000*2*2,1),wav=Buffer.alloc(44+samples.length);
 wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length,40);samples.copy(wav,44);
 const harness=`import urllib.request,io,json,base64
calls=[]
def fake_open(req,timeout=None):
 if 'computeMetadata' in req.full_url:return io.BytesIO(json.dumps({'access_token':'test-token'}).encode())
 assert req.full_url=='https://speech.googleapis.com/v1/speech:recognize'
 body=json.loads(req.data);calls.append({'bytes':len(base64.b64decode(body['audio']['content'])),'channels':body['config']['audioChannelCount']})
 return io.BytesIO(json.dumps({'results':[{'channelTag':1,'alternatives':[{'transcript':'press seven','words':[{'word':'seven','startTime':'1s'}]}]}]}).encode())
urllib.request.urlopen=fake_open
exec(${JSON.stringify(recognitionProgram)})
print(json.dumps(calls))
`;
 const result=spawnSync('python3',['-c',harness],{input:JSON.stringify({audio:wav.toString('base64')}),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const [recognition,calls]=result.stdout.trim().split('\n').map(JSON.parse);
 assert.deepEqual(calls,[{bytes:45*32000,channels:2},{bytes:30*32000,channels:2}]);
 assert.deepEqual(recognition.segments.map(s=>s.channel),[1,1]);
 assert.deepEqual(recognition.segments.map(s=>s.lateWords),[[],['seven']]);
});
test('menu acceptance requires every announced choice on the PARIS greeting channel',()=>{
 const recognition={segments:[{channel:1,text:greeting+' For Administration press zero.'},{channel:2,text:'For Beauty press five.'}]};
 assert.equal(heardMenuDigits(['0','5'],recognition,greeting),false);
 recognition.segments.push({channel:1,text:'For Beauty press five.'});
 assert.equal(heardMenuDigits(['0','5'],recognition,greeting),true);
 assert.equal(heardMenuDigits(['0','5','7'],recognition,greeting),false);
});
test('menu-only self-call waits for the full opening without dialing staff or claiming a transfer',async()=>{
 const f=fixture();const result=await exerciseSelfCall(bindings,{...options(f),menuTest:true,expectedMenuDigits:['0','5'],transcribe:async()=>({segments:[{channel:1,text:greeting+' For Administration press zero. For Beauty press five.'}]})});
 const create=f.requests.filter(r=>r.url.endsWith('/Calls.json')&&r.options.method==='POST');
 assert.equal(create.length,1);
 const params=new URLSearchParams(create[0].options.body);
 assert.equal(params.get('To'),number);assert.equal(params.get('TimeLimit'),'80');
 assert.ok(params.get('Twiml').includes('Pause length="74"'));
 assert.ok(!params.get('Twiml').includes('digits='));
 assert.equal(result.liveMenuAcceptance,'PASS');
 assert.equal(result.operatorTransferAcceptance,'NOT_TESTED');
 assert.equal(result.voicemailDeliveryAcceptance,'NOT_TESTED');
});
test('menu self-call refuses missing, duplicate or injected options before placing a call',async()=>{
 for(const expectedMenuDigits of [[],['5','5'],['SIP/attacker']]){
  const f=fixture();await assert.rejects(exerciseSelfCall(bindings,{...options(f),menuTest:true,expectedMenuDigits}),/MENU_INVALID/);
  assert.equal(f.requests.length,0);
 }
});
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

test('spoken response must be on the PARIS greeting channel after the caller prompt, never the caller track',()=>{
 const heard={text:greeting+' audio test complete',segments:[{channel:1,text:greeting,lateWords:[]},{channel:2,text:'Please say audio test complete',lateWords:['audio','test','complete']}]};
 assert.equal(summarizeSpeech(greeting,heard).replyMarkerMatched,false);
 heard.segments.push({channel:1,text:'Audio test complete.',lateWords:['Audio','test','complete']});
 assert.equal(summarizeSpeech(greeting,heard).replyMarkerMatched,true);
 heard.segments[2].lateWords=[];assert.equal(summarizeSpeech(greeting,heard).replyMarkerMatched,false);
});
test('operator marker must be heard from the greeting channel, not the caller or a PARIS transfer announcement',()=>{
 const heard={text:greeting,segments:[{channel:1,text:greeting,lateWords:['I','will','connect','you','to','the','operator']},{channel:2,text:'operator audio test confirmed',lateWords:['operator','audio','test','confirmed']}]};
 assert.equal(summarizeSpeech(greeting,heard).operatorMarkerMatched,false);
 heard.segments.push({channel:1,text:'Operator audio test confirmed',lateWords:['Operator','audio','test','confirmed']});
 assert.equal(summarizeSpeech(greeting,heard).operatorMarkerMatched,true);
});
test('operator and voicemail scenarios stay bounded to the business DID and do not accept mixed scenarios',async()=>{
 const f=fixture();await exerciseSelfCall(bindings,{...options(f),operatorTest:true});
 const create=f.requests.find(r=>r.url.endsWith('/Calls.json')&&r.options.method==='POST');const params=new URLSearchParams(create.options.body);
 assert.equal(params.get('TimeLimit'),'60');assert.ok(params.get('Twiml').includes('connect me to the operator'));assert.equal(params.get('To'),number);
 const vm=fixture();const result=await exerciseSelfCall(bindings,{...options(vm),voicemailTest:true});
 const voicemailCreate=vm.requests.find(r=>r.url.endsWith('/Calls.json')&&r.options.method==='POST');const voicemailParams=new URLSearchParams(voicemailCreate.options.body);
 assert.equal(voicemailParams.get('TimeLimit'),'75');assert.equal(voicemailParams.get('Record'),'false');assert.equal(result.voicemailDeliveryAcceptance,'PENDING');
 await assert.rejects(exerciseSelfCall(bindings,{...options(f),operatorTest:true,voicemailTest:true}),/SCENARIO_INVALID/);
});


test('direct owned mailbox test cannot request or dial an operator device',async()=>{
 const f=fixture();await exerciseSelfCall(bindings,{...options(f),voicemailTest:true,directMailboxTest:true});
 const params=new URLSearchParams(f.requests.find(r=>r.url.endsWith('/Calls.json')&&r.options.method==='POST').options.body);
 assert.equal(params.get('To'),number);assert.equal(params.get('TimeLimit'),'75');
 assert.equal(params.get('Twiml').includes('connect me to the operator'),false);
 assert.equal(params.get('Twiml').includes('digits="w0"'),false);
 assert.equal(params.get('Twiml').includes('Voicemail routing test complete'),true);
 await assert.rejects(exerciseSelfCall(bindings,{...options(f),directMailboxTest:true}),/SCENARIO_INVALID/);
});
