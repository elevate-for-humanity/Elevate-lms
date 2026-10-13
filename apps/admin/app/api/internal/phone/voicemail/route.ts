// pre-auth-registry: exempt - authenticated private PBX ingestion; constant-time server token and configured phone-system scope.
import {NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {hydrateProcessEnv} from '@/lib/secrets';
import {requireAdminClient} from '@/lib/supabase/admin';
import {notifyAssignee} from '@/lib/phone/message-notifications';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function readBody(request:Request){
 const reader=request.body?.getReader();if(!reader)throw Error('missing_body');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>2*1024*1024)throw Error('body_too_large');chunks.push(next.value);}}
 finally{await reader.cancel().catch(()=>{});}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function speech(audio:Buffer){
 const identity=await fetch('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'},redirect:'error',signal:AbortSignal.timeout(5000)});
 if(!identity.ok)throw Error('voice_identity_unavailable');
 const token=(await identity.json()).access_token;if(typeof token!=='string')throw Error('voice_identity_unavailable');
 const response=await fetch('https://speech.googleapis.com/v1/speech:recognize',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({config:{languageCode:'en-US',model:'phone_call',enableAutomaticPunctuation:true},audio:{content:audio.toString('base64')}}),redirect:'error',signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('voice_transcription_unavailable');
 const result=await response.json();return (result.results||[]).map((part:any)=>part.alternatives?.[0]?.transcript||'').join(' ').trim().slice(0,20000);
}
export async function POST(request:Request){
 try{
  await hydrateProcessEnv();
  const expected=process.env.PBX_PROVISIONING_TOKEN||'';
  const given=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
  if(expected.length<32 || given.length!==expected.length || !timingSafeEqual(Buffer.from(given),Buffer.from(expected)))return NextResponse.json({error:'Unauthorized'},{status:401});
  if(process.env.ELEVATE_RUNTIME_CONFIG_PROVIDER!=='google-secret-manager' || !UUID.test(process.env.PBX_PHONE_SYSTEM_ID||''))return NextResponse.json({error:'Owned voicemail is not configured.'},{status:503});
  const body=await readBody(request);
  if(!UUID.test(body.id||'')||!/^(0|[1-9][0-9]{2})$/.test(body.extension||'')||typeof body.audioBase64!=='string'||body.audioBase64.length>1500000)return NextResponse.json({error:'Invalid voicemail.'},{status:400});
  const audio=Buffer.from(body.audioBase64,'base64');
  if(audio.length<44||audio.length>1100000||audio.toString('ascii',0,4)!=='RIFF'||audio.toString('ascii',8,12)!=='WAVE')return NextResponse.json({error:'A bounded WAV recording is required.'},{status:400});
  const duration=Number(body.durationSeconds);const createdAt=new Date(body.createdAt);
  if(!Number.isFinite(duration)||duration<0||duration>60||!Number.isFinite(createdAt.getTime())||createdAt.getTime()>Date.now()+60000)return NextResponse.json({error:'Invalid voicemail timing.'},{status:400});
  const db=await requireAdminClient();const systemId=process.env.PBX_PHONE_SYSTEM_ID!;
  const {data:system,error:systemError}=await db.from('phone_systems').select('id,status,admin_extension,voicemail_enabled').eq('id',systemId).maybeSingle();
  if(systemError)throw Error('system_lookup_unavailable');
  if(!system||system.status!=='active'||!system.voicemail_enabled)return NextResponse.json({error:'Voicemail is disabled.'},{status:409});
  const {data:workspace,error:workspaceError}=await db.from('communication_workspaces').select('id').eq('phone_system_id',systemId).maybeSingle();
  if(workspaceError||!workspace)throw Error('workspace_lookup_unavailable');
  const {data:extension,error:extensionError}=await db.from('communication_extensions').select('id,profile_id,display_name,department').eq('workspace_id',workspace.id).eq('extension',body.extension).eq('enabled',true).maybeSingle();
  if(extensionError)throw Error('extension_lookup_unavailable');
  if(!extension?.profile_id)return NextResponse.json({error:'No recipient is assigned to this extension.'},{status:404});
  const caller=String(body.caller||'unknown').trim();
  if(!/^(unknown|[0-9]{1,3}|[+][1-9][0-9]{7,14})$/.test(caller))return NextResponse.json({error:'Invalid caller identifier.'},{status:400});
  const {data:previous,error:previousError}=await db.from('voicemails').select('transcription').eq('id',body.id).maybeSingle();
  if(previousError)throw Error('voicemail_lookup_unavailable');
  const transcript=previous?.transcription||await speech(audio);
  const {data:bucket,error:bucketLookupError}=await db.storage.getBucket('phone-voicemails');
  if(bucketLookupError && !bucket){
    const {error:createError}=await db.storage.createBucket('phone-voicemails',{public:false,fileSizeLimit:1100000,allowedMimeTypes:['audio/wav']});
    if(createError)throw Error('private_audio_storage_unavailable');
  }else if(bucket?.public)throw Error('voicemail_bucket_must_be_private');
  const key=body.id+'.wav';const location='supabase://phone-voicemails/'+key;
  const {error:audioError}=await db.storage.from('phone-voicemails').upload(key,audio,{contentType:'audio/wav',upsert:true});
  if(audioError)throw Error('audio_persistence_unavailable');
  const callId=body.id;
  const {error:callError}=await db.from('phone_calls').upsert({id:callId,phone_system_id:systemId,provider:'asterisk',provider_call_id:'voicemail-'+body.id,direction:'inbound',from_number:caller,to_number:body.extension,status:'completed',started_at:createdAt.toISOString(),ended_at:new Date(createdAt.getTime()+duration*1000).toISOString(),duration_seconds:Math.round(duration),recording_url:location,assigned_extension_id:extension.id,assigned_profile_id:extension.profile_id},{onConflict:'id'});
  if(callError)throw Error('call_persistence_unavailable');
  const {error:voicemailError}=await db.from('voicemails').upsert({id:body.id,user_id:extension.profile_id,phone_system_id:systemId,call_id:callId,extension_id:extension.id,assigned_profile_id:extension.profile_id,phone_number:caller,recording_url:location,duration_seconds:Math.round(duration),transcription:transcript||null,summary:transcript.slice(0,1000)||'No speech was detected. Open the recording to listen.',created_at:createdAt.toISOString()},{onConflict:'id'});
  if(voicemailError)throw Error('voicemail_persistence_unavailable');
  const {error:taskError}=await db.from('phone_callback_tasks').upsert({id:body.id,call_id:callId,extension_id:extension.id,assigned_profile_id:extension.profile_id,source:'voicemail',callback_number:caller,program_or_department:extension.department,transcript:transcript||null,summary:transcript.slice(0,1000)||'No speech was detected. Open the recording to listen.',recording_url:location,created_at:createdAt.toISOString()},{onConflict:'id'});
  if(taskError)throw Error('callback_persistence_unavailable');
  await notifyAssignee(db,{profileId:extension.profile_id,taskId:body.id,caller,urgency:'normal',source:'voicemail',transcript:transcript||undefined,summary:transcript?undefined:'No speech was detected. Open the recording to listen.'},system);
  return NextResponse.json({saved:true,transcriptAvailable:Boolean(transcript)});
 }catch{return NextResponse.json({error:'Voicemail processing is unavailable; retry without discarding the original recording.'},{status:503});}
}
