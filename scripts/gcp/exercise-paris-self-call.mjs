import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {loadGoogleConfig} from './runtime-config.mjs';
import {verifiedTwilioBindings} from './bind-twilio-runtime.mjs';
const NUMBER='+14632401404',ACCOUNT='AC75bcca01e19767614252902185ed948f';
const DOMAIN='elevate-4632401404.pstn.twilio.com';
const SYSTEM='341f59a3-b1d6-4360-8463-0ce0402f86fe';
const words=text=>String(text).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);
export function greetingMatch(expected,actual){
 const wanted=words(expected),heard=new Set(words(actual));
 return wanted.length>=10?wanted.filter(word=>heard.has(word)).length/wanted.length:0;
}
export async function exerciseSelfCall(bindings,{expectedGreeting,transcribe,request=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms)),report=()=>{}}){
 if(bindings.TWILIO_ACCOUNT_SID!==ACCOUNT||bindings.TWILIO_PHONE_NUMBER!==NUMBER||!bindings.TWILIO_AUTH_TOKEN||words(expectedGreeting).length<10)throw Error('SELF_CALL_IDENTITY_REQUIRED');
 const base=`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT}`;
 const headers={Authorization:'Basic '+Buffer.from(ACCOUNT+':'+bindings.TWILIO_AUTH_TOKEN).toString('base64')};
 async function api(url,values){
  if(!['https://api.twilio.com','https://trunking.twilio.com'].includes(new URL(url).origin))throw Error('SELF_CALL_API_ORIGIN_REJECTED');
  const response=await request(url,{method:values?'POST':'GET',headers:values?{...headers,'Content-Type':'application/x-www-form-urlencoded'}:headers,...(values?{body:new URLSearchParams(values).toString()}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok){let code;try{code=(await response.json()).code;}catch{}throw Error('SELF_CALL_PROVIDER_'+response.status+(/^[0-9]{3,6}$/.test(String(code))?'_'+code:''));}
  return response.json();
 }
 const inventory=await api(base+'/IncomingPhoneNumbers.json?PhoneNumber=%2B14632401404&PageSize=20');
 const number=inventory.incoming_phone_numbers?.find(n=>n.account_sid===ACCOUNT&&n.phone_number===NUMBER);
 if(!number||!/^TK[a-f0-9]{32}$/i.test(number.trunk_sid||''))throw Error('SELF_CALL_TRUNK_REQUIRED');
 const trunk=await api('https://trunking.twilio.com/v1/Trunks/'+number.trunk_sid);
 const origins=await api('https://trunking.twilio.com/v1/Trunks/'+number.trunk_sid+'/OriginationUrls?PageSize=100');
 if(trunk.account_sid!==ACCOUNT||trunk.domain_name!==DOMAIN||trunk.secure!==true||origins.meta?.next_page_url||origins.origination_urls?.length!==1||origins.origination_urls[0].enabled!==true||origins.origination_urls[0].sip_url!=='sip:phone.elevateforhumanity.org:5061;transport=tls')throw Error('SELF_CALL_ROUTE_UNVERIFIED');
 for(const status of ['queued','ringing','in-progress']){const active=await api(base+'/Calls.json?Status='+status+'&PageSize=100');if(active.next_page_uri||!Array.isArray(active.calls)||active.calls.length)throw Error('SELF_CALL_ACTIVE_CALLS_PRESENT');}
 // Exactly one bounded call to the verified business number. Never retry creation.
 const created=await api(base+'/Calls.json',{To:NUMBER,From:NUMBER,Timeout:'15',TimeLimit:'45',Record:'true',RecordingChannels:'mono',RecordingTrack:'inbound',Twiml:'<Response><Say>This is an authorized automated phone system test.</Say><Pause length="25"/><Hangup/></Response>'});
 if(!/^CA[a-f0-9]{32}$/i.test(created.sid||'')||created.account_sid!==ACCOUNT||created.to!==NUMBER||created.from!==NUMBER)throw Error('SELF_CALL_CREATION_UNVERIFIED');
 const sid=created.sid;report({selfCallCreated:true,callSid:sid,onlyVerifiedBusinessNumber:true,maxDurationSeconds:45});
 let call;
 try{
  for(let n=0;n<40;n++){call=await api(base+'/Calls/'+sid+'.json');if(['completed','failed','busy','no-answer','canceled'].includes(call.status))break;await wait(2000);}
  if(call?.status!=='completed')throw Error('SELF_CALL_NOT_COMPLETED');
 }finally{
  if(!call||!['completed','failed','busy','no-answer','canceled'].includes(call.status))await api(base+'/Calls/'+sid+'.json',{Status:'completed'});
 }
 let recording;
 for(let n=0;n<12;n++){
  const recordings=await api(base+'/Calls/'+sid+'/Recordings.json?PageSize=20');
  if(recordings.next_page_uri||!Array.isArray(recordings.recordings)||recordings.recordings.some(r=>r.account_sid!==ACCOUNT||r.call_sid!==sid))throw Error('SELF_CALL_RECORDING_SCOPE_INVALID');
  recording=recordings.recordings.find(r=>r.status==='completed');if(recording)break;await wait(2500);
 }
 if(!recording||!/^RE[a-f0-9]{32}$/i.test(recording.sid)||Number(recording.duration)>50)throw Error('SELF_CALL_RECORDING_UNAVAILABLE');
 let audio=await request(base+'/Recordings/'+recording.sid+'.wav',{headers,redirect:'manual',signal:AbortSignal.timeout(20000)});
 if([301,302,303,307,308].includes(audio.status)){
  const location=new URL(audio.headers.get('location'));
  if(location.protocol!=='https:'||location.username||location.password||!['twilio.com','twiliocdn.com','amazonaws.com','cloudfront.net'].some(d=>location.hostname===d||location.hostname.endsWith('.'+d)))throw Error('SELF_CALL_MEDIA_ORIGIN_REJECTED');
  audio=await request(location.href,{redirect:'error',signal:AbortSignal.timeout(20000)}); // Never forward provider credentials to storage.
 }
 if(!audio.ok||Number(audio.headers.get('content-length')||0)>2000000)throw Error('SELF_CALL_MEDIA_UNAVAILABLE');
 const wav=Buffer.from(await audio.arrayBuffer());
 if(wav.length>2000000||wav.subarray(0,4).toString()!=='RIFF'||wav.subarray(8,12).toString()!=='WAVE')throw Error('SELF_CALL_AUDIO_INVALID');
 const transcript=await transcribe(wav),ratio=greetingMatch(expectedGreeting,transcript);
 return {callSid:sid,callStatus:call.status,callDurationSeconds:Number(call.duration),recordingDurationSeconds:Number(recording.duration),receivedAudioBytes:wav.length,speechWordCount:words(transcript).length,savedGreetingWordMatch:Math.round(ratio*100)/100,savedGreetingAudioMatched:ratio>=0.75,liveGreetingAcceptance:ratio>=0.75?'PASS':'FAIL',operatorTransferAcceptance:'NOT_TESTED',voicemailDeliveryAcceptance:'NOT_TESTED'};
}
export async function inspectSelfCall(bindings,sid,{request=fetch}={}){
 if(bindings.TWILIO_ACCOUNT_SID!==ACCOUNT||bindings.TWILIO_PHONE_NUMBER!==NUMBER||!/^CA[a-f0-9]{32}$/i.test(sid||''))throw Error('SELF_CALL_INSPECTION_SCOPE_INVALID');
 const base=`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT}`,headers={Authorization:'Basic '+Buffer.from(ACCOUNT+':'+bindings.TWILIO_AUTH_TOKEN).toString('base64')};
 async function get(path){const r=await request(base+path,{headers,redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('SELF_CALL_INSPECTION_HTTP_'+r.status);return r.json();}
 const call=await get('/Calls/'+sid+'.json');
 if(call.account_sid!==ACCOUNT||call.to!==NUMBER||call.from!==NUMBER)throw Error('SELF_CALL_INSPECTION_IDENTITY_INVALID');
 const records=await get('/Calls/'+sid+'/Recordings.json?PageSize=100');
 const notifications=await get('/Calls/'+sid+'/Notifications.json?PageSize=100');
 let insights={available:false};
 const summary=await request('https://insights.twilio.com/v1/Voice/'+sid+'/Summary',{headers,redirect:'error',signal:AbortSignal.timeout(15000)});
 if(summary.ok){const data=await summary.json();if(data.call_sid!==sid||data.account_sid!==ACCOUNT)throw Error('SELF_CALL_INSIGHTS_SCOPE_INVALID');insights={available:true,callState:data.call_state,callType:data.call_type,lastSipResponse:data.properties?.last_sip_response_num,disconnectedBy:data.properties?.disconnected_by,tags:(data.tags||[]).filter(t=>/^[a-z_]{1,40}$/.test(t)),sipEdgeMetrics:data.sip_edge?.metrics,carrierEdgeMetrics:data.carrier_edge?.metrics};}
 else insights.httpStatus=summary.status;
 return {insights,readOnly:true,callsPlaced:0,callSid:sid,status:call.status,durationSeconds:Number(call.duration),direction:call.direction,
  recordingStatuses:(records.recordings||[]).map(r=>({status:r.status,duration:Number(r.duration),channels:r.channels,source:r.source})),
  providerNotifications:(notifications.notifications||[]).map(n=>({errorCode:Number(n.error_code),messageSignals:Object.fromEntries(['SIP','TLS','certificate','SRTP','busy','timeout','media','audio','registration','routing'].map(label=>[label,new RegExp(label,'i').test(String(n.message_text||''))]))}))};
}
const recognitionProgram=`import json,sys,urllib.request,urllib.error
try:
 data=json.load(sys.stdin)
 req=urllib.request.Request('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',headers={'Metadata-Flavor':'Google'})
 token=json.load(urllib.request.urlopen(req,timeout=5))['access_token']
 body={'config':{'encoding':'LINEAR16','languageCode':'en-US','model':'phone_call'},'audio':{'content':data['audio']}}
 req=urllib.request.Request('https://speech.googleapis.com/v1/speech:recognize',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 reply=json.load(urllib.request.urlopen(req,timeout=60))
 print(json.dumps({'text':' '.join(r['alternatives'][0]['transcript'] for r in reply.get('results',[]) if r.get('alternatives'))}))
except Exception:print(json.dumps({'error':'self_call_speech_unavailable'}));sys.exit(1)
`;
function transcribeOnPbx(wav){
 const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";
 const result=spawnSync('gcloud',['compute','ssh','elevate-pbx','--project=elegant-racer-299721','--zone=us-central1-a','--quiet','--command','sudo python3 -c '+quote(recognitionProgram)],{input:JSON.stringify({audio:wav.toString('base64')}),encoding:'utf8',timeout:90000,maxBuffer:1000000});
 if(result.status!==0)throw Error('SELF_CALL_SPEECH_UNAVAILABLE');
 let body;try{body=JSON.parse(result.stdout.trim());}catch{throw Error('SELF_CALL_SPEECH_UNAVAILABLE');}
 if(typeof body.text!=='string')throw Error('SELF_CALL_SPEECH_UNAVAILABLE');return body.text;
}
async function main(){
 if(process.env.AUTHORIZED_SELF_TEST_DID!==NUMBER)throw Error('SELF_CALL_AUTHORIZATION_REQUIRED');
 const config=loadGoogleConfig('admin'),env=config.runtimeEnvironment,bindings=await verifiedTwilioBindings(config);
 if(process.env.SELF_CALL_MODE==='inspect'){console.log(JSON.stringify(await inspectSelfCall(bindings,process.env.INSPECT_SELF_CALL_SID)));return;}
 if(process.env.SELF_CALL_MODE!=='greeting-call')throw Error('SELF_CALL_MODE_REQUIRED');
 const db=env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL;
 if(db!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('SELF_CALL_SETTINGS_SCOPE_INVALID');
 const response=await fetch(db+'/rest/v1/phone_systems?id=eq.'+SYSTEM+'&select=greeting',{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},redirect:'error'});
 const rows=response.ok?await response.json():[];if(rows.length!==1)throw Error('SELF_CALL_SETTINGS_UNAVAILABLE');
 const result=await exerciseSelfCall(bindings,{expectedGreeting:rows[0].greeting,transcribe:transcribeOnPbx,report:v=>console.log(JSON.stringify(v))});console.log(JSON.stringify(result));if(result.liveGreetingAcceptance!=='PASS')process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(/^SELF_CALL_[A-Z_0-9]+$/.test(e.message)?e.message:'SELF_CALL_FAILED');process.exitCode=1;});
