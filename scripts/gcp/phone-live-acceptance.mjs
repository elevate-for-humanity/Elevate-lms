import {createServer} from 'node:http';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash,createHmac,randomUUID} from 'node:crypto';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {loadGoogleConfig} from './runtime-config.mjs';
import {verifiedTwilioBindings} from './bind-twilio-runtime.mjs';
import {exerciseSelfCall,transcribeOnPbx} from './exercise-paris-self-call.mjs';
const SYSTEM='341f59a3-b1d6-4360-8463-0ce0402f86fe',PROFILE='964dc85a-bce8-4e67-92eb-198ffafb2384',EXTENSION='ea5439e0-014b-4020-8e25-e305f20c53d6';
const ORIGIN='https://phone.elevateforhumanity.org',DB='https://cuxzzpsyufcewtmicszk.supabase.co';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const report=value=>console.log(JSON.stringify(value));
export function verifyOwner(system,extension,profile){
 if(system?.id!==SYSTEM||system.status!=='active'||system.admin_extension!=='0'||system.voicemail_enabled!==true||extension?.id!==EXTENSION||extension.profile_id!==PROFILE||extension.extension!=='0'||extension.enabled!==true||extension.webrtc_provider!=='asterisk'||profile?.id!==PROFILE||profile.email?.toLowerCase()!=='curvaturebodysculpting@gmail.com'||profile.full_name!=='Elizabeth Greene')throw Error('PHONE_ACCEPTANCE_OWNER_UNVERIFIED');
}
export function verifyCredential(value,identity){
 const endpoint='pwa-'+createHash('sha256').update(identity.profileId+':'+identity.deviceId).digest('hex').slice(0,40);
 if(value?.provider!=='asterisk'||value.endpointId!==endpoint||value.sipUsername!==endpoint||value.extensionId!==EXTENSION||value.extension!=='0'||value.sipDomain!=='phone.elevateforhumanity.org'||value.wsUrl!=='wss://phone.elevateforhumanity.org/ws'||!/^[A-Za-z0-9_-]{43}$/.test(value.sipPassword||''))throw Error('PHONE_ACCEPTANCE_DEVICE_UNVERIFIED');
 return value;
}
function remoteProgram(name){
 const script=readFileSync(new URL('./'+name,import.meta.url),'utf8');
 const r=spawnSync('gcloud',['compute','ssh','elevate-pbx','--project=elegant-racer-299721','--zone=us-central1-a','--quiet','--command','sudo python3 -'],{input:script,encoding:'utf8',timeout:60000,maxBuffer:2000000});
 if(r.status!==0)throw Error('PHONE_ACCEPTANCE_VM_PROBE_FAILED');
 try{return JSON.parse(r.stdout.trim());}catch{throw Error('PHONE_ACCEPTANCE_VM_RESULT_INVALID');}
}
export function operatorAudioPassed(call,device){
 return call.liveGreetingAcceptance==='PASS'&&call.operatorTransferAcceptance==='PASS'&&device.received===true&&device.answered===true&&device.dtlsConnected===true&&device.inboundBytes>1000&&device.outboundBytes>1000&&device.remoteAudibleWindows>=5&&!device.failed;
}
async function receiver(credential,wavPath){
 const modules=process.env.PHONE_TEST_MODULE_ROOT||'/tmp/elevate-phone-protocol/node_modules';
 if(!/^\/tmp\/elevate-phone-(protocol|acceptance)\/node_modules$/.test(modules))throw Error('PHONE_ACCEPTANCE_MODULE_ROOT_INVALID');
 for(const [name,version] of [['sip.js','0.21.2'],['playwright','1.57.0']])if(JSON.parse(await readFile(join(modules,name,'package.json'),'utf8')).version!==version)throw Error('PHONE_ACCEPTANCE_DEPENDENCY_VERSION_INVALID');
 const sipRoot=resolve(modules,'sip.js/lib');
 const html='<!doctype html><html><body><audio autoplay></audio><script type="module" src="/receiver.mjs"></script></body></html>';
 const server=createServer(async(req,res)=>{
  try{
   if(req.method!=='GET')throw Error();
   if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
   if(req.url==='/receiver.mjs'){res.setHeader('Content-Type','text/javascript');res.end(await readFile(new URL('./owned-phone-test-receiver.mjs',import.meta.url)));return;}
   if(!req.url?.startsWith('/sip/')||!req.url.endsWith('.js'))throw Error();
   const path=resolve(sipRoot,decodeURIComponent(req.url.slice(5)));
   if(!path.startsWith(sipRoot+sep))throw Error();
   res.setHeader('Content-Type','text/javascript');res.end(await readFile(path));
  }catch{res.statusCode=404;res.end();}
 });
 await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
 let browser;
 try{
  const {chromium}=await import(pathToFileURL(join(modules,'playwright/index.mjs')).href);
  browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required','--use-file-for-fake-audio-capture='+wavPath]});
  const context=await browser.newContext({permissions:['microphone']});const page=await context.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>typeof window.startOwnedPhoneTest==='function',{},{timeout:30000});
  await page.evaluate(value=>window.startOwnedPhoneTest(value),credential);
  await page.waitForFunction(()=>window.ownedPhoneTestState.registered||window.ownedPhoneTestState.failed,{},{timeout:30000});
  if(!(await page.evaluate(()=>window.ownedPhoneTestState.registered)))throw Error('PHONE_ACCEPTANCE_REGISTRATION_FAILED');
  return {state:()=>page.evaluate(()=>({...window.ownedPhoneTestState})),close:async()=>{await page.evaluate(()=>window.stopOwnedPhoneTest()).catch(()=>{});await browser.close();await new Promise(r=>server.close(r));}};
 }catch{await browser?.close();await new Promise(r=>server.close(r));throw Error('PHONE_ACCEPTANCE_RECEIVER_UNAVAILABLE');}
}
async function main(){
 const mode=process.env.PHONE_ACCEPTANCE_MODE;
 if(!['preflight','operator','voicemail'].includes(mode)||process.env.AUTHORIZED_SELF_TEST_DID!=='+14632401404')throw Error('PHONE_ACCEPTANCE_AUTHORIZATION_REQUIRED');
 const config=loadGoogleConfig('admin'),env=config.runtimeEnvironment;
 if((env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL)!==DB||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('PHONE_ACCEPTANCE_DATABASE_UNVERIFIED');
 async function db(path,{method='GET',body}={}){
  if(!/^[a-z_]+[?]/.test(path)&&!(/^[a-z_]+$/.test(path)))throw Error('PHONE_ACCEPTANCE_QUERY_INVALID');
  const response=await fetch(DB+'/rest/v1/'+path,{method,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('PHONE_ACCEPTANCE_DATABASE_HTTP_'+response.status);return response.json();
 }
 const systems=await db('phone_systems?id=eq.'+SYSTEM+'&select=id,status,admin_extension,voicemail_enabled,greeting');
 const extensions=await db('communication_extensions?id=eq.'+EXTENSION+'&select=id,workspace_id,profile_id,extension,enabled,webrtc_provider');
 const profiles=await db('profiles?id=eq.'+PROFILE+'&select=id,email,full_name');
 if(systems.length!==1||extensions.length!==1||profiles.length!==1)throw Error('PHONE_ACCEPTANCE_OWNER_UNVERIFIED');
 verifyOwner(systems[0],extensions[0],profiles[0]);
 const workspaces=await db('communication_workspaces?id=eq.'+extensions[0].workspace_id+'&phone_system_id=eq.'+SYSTEM+'&select=id');if(workspaces.length!==1)throw Error('PHONE_ACCEPTANCE_WORKSPACE_UNVERIFIED');
 const preflight=remoteProgram('phone-acceptance-preflight.py');report(preflight);
 const sourceHash=createHash('sha256').update(readFileSync(new URL('../../infra/pbx/paris/ari-media.mjs',import.meta.url))).digest('hex');
 if(!preflight.idle||!preflight.operatorEntryVerified||!preflight.operatorDeviceRouteVerified||!preflight.operatorVoicemailFallbackVerified||!preflight.operatorMailboxConfigured||!preflight.voicemailWorkerActive||preflight.sourceSha256?.gateway!==sourceHash)throw Error('PHONE_ACCEPTANCE_PREFLIGHT_NOT_READY');
 if(mode==='preflight'){report({phoneAcceptance:'PREFLIGHT_PASS',callsPlaced:0,recipientVerified:true});return;}
 if(mode!=='operator')throw Error('PHONE_ACCEPTANCE_MODE_NOT_IMPLEMENTED');
 if(preflight.operatorRegisteredContacts!==0||preflight.operatorLeasedEndpointCount!==0)throw Error('PHONE_ACCEPTANCE_OTHER_OPERATOR_DEVICES_PRESENT');
 const token=env.PBX_PROVISIONING_TOKEN;
 if(!token||token.length<32)throw Error('PHONE_ACCEPTANCE_CONTROL_BINDING_MISSING');
 const identity={profileId:PROFILE,extensionId:EXTENSION,deviceId:'asterisk_acceptance_'+randomUUID().replaceAll('-','')};
 async function control(action){
  const response=await fetch(ORIGIN+'/internal/pbx/devices'+action,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(identity),redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('PHONE_ACCEPTANCE_CONTROL_HTTP_'+response.status);return response.json();
 }
 let phone,folder,deviceSaved=false;const rowId=randomUUID();
 try{
  const credential=verifyCredential(await control(''),identity);
  deviceSaved=true;
  await db('phone_webrtc_devices',{method:'POST',body:{id:rowId,extension_id:EXTENSION,profile_id:PROFILE,device_id:identity.deviceId,provider:'asterisk',provider_credential_id:credential.endpointId,sip_username:credential.sipUsername,status:'active',registration_state:'unregistered',connection_state:'disconnected',last_seen_at:null}});
  const mediaEnv=loadGoogleConfig('lms').runtimeEnvironment;
  if(!mediaEnv.PBX_TURN_SHARED_SECRET||mediaEnv.PBX_TURN_SHARED_SECRET.length<32)throw Error('PHONE_ACCEPTANCE_RELAY_BINDING_MISSING');
  const urls=String(mediaEnv.PBX_TURN_URLS||'').split(',').map(s=>s.trim());
  if(!urls.length||urls.some(url=>!/^turn:phone[.]elevateforhumanity[.]org:3478[?]transport=(udp|tcp)$/.test(url)))throw Error('PHONE_ACCEPTANCE_RELAY_UNVERIFIED');
  const username=Math.floor(Date.now()/1000)+300+':'+credential.endpointId;
  credential.iceServers=[{urls,username,credential:createHmac('sha1',mediaEnv.PBX_TURN_SHARED_SECRET).update(username).digest('base64')}];
  const audio=remoteProgram('phone-acceptance-test-audio.py');const bytes=Buffer.from(audio.audioContent||'','base64');
  if(bytes.length<44||bytes.subarray(0,4).toString()!=='RIFF'||bytes.length>2000000)throw Error('PHONE_ACCEPTANCE_SYNTHETIC_AUDIO_INVALID');
  folder=await mkdtemp(join(tmpdir(),'elevate-phone-audio-'));const wavPath=join(folder,'operator.wav');await writeFile(wavPath,bytes,{mode:0o600});
  phone=await receiver(credential,wavPath);
  let status;
  for(let n=0;n<15;n++){status=await control('/status');if(status.registered&&status.connectionState==='connected')break;await wait(1000);}
  if(!status?.registered||status.connectionState!=='connected')throw Error('PHONE_ACCEPTANCE_CONTACT_NOT_REACHABLE');
  await db('phone_webrtc_devices?id=eq.'+rowId+'&profile_id=eq.'+PROFILE,{method:'PATCH',body:{registration_state:'registered',connection_state:'connected',last_seen_at:status.observedAt,registration_verified_at:status.observedAt}});
  report({operatorTestDeviceRegistered:true,reachableContactCount:status.reachableContactCount,credentialsEmitted:false});
  const bindings=await verifiedTwilioBindings(config);
  const call=await exerciseSelfCall(bindings,{expectedGreeting:systems[0].greeting,transcribe:transcribeOnPbx,operatorTest:true,report,monitor:async()=>{await wait(5000);return {operatorTestDevice:await phone.state()};}});
  const device=await phone.state();const passed=operatorAudioPassed(call,device);
  report({phoneAcceptance:'OPERATOR',...call,operatorTestDevice:device,operatorTwoWayAudioAcceptance:passed?'PASS':'FAIL'});
  if(!passed)throw Error('PHONE_ACCEPTANCE_OPERATOR_AUDIO_FAILED');
 }finally{
  await phone?.close().catch(()=>{});
  let revoked=false;
  for(let n=0;n<3&&!revoked;n++){try{revoked=(await control('/revoke')).revoked===true;}catch{}if(!revoked)await wait(500);}
  let registryClean=true;
  if(deviceSaved){try{const rows=await db('phone_webrtc_devices?id=eq.'+rowId+'&profile_id=eq.'+PROFILE,{method:'PATCH',body:{status:'revoked',registration_state:'unregistered',connection_state:'disconnected',updated_at:new Date().toISOString()}});registryClean=rows.length===0||rows.every(r=>r.status==='revoked'&&r.connection_state==='disconnected');}catch{registryClean=false;}}
  if(folder)await rm(folder,{recursive:true,force:true}).catch(()=>{});
  report({operatorTestDeviceCleanupVerified:revoked&&registryClean,credentialRevoked:revoked,registryInactive:registryClean});if(!revoked||!registryClean)throw Error('PHONE_ACCEPTANCE_CLEANUP_UNVERIFIED');
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(/^PHONE_ACCEPTANCE_[A-Z0-9_]+$/.test(error.message)?error.message:'PHONE_ACCEPTANCE_FAILED');process.exitCode=1;});
