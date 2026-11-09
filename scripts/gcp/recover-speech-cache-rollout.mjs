import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {google,PROJECT} from './runtime-config.mjs';
import {activateTestedRevision} from './activate-tested-public-revision.mjs';
const service='elevate-marketing-migration';
const bad='4e32ccff1b09d020c9eaed3a9bc5bec525082de2';
const previous='38fa72efea936554e964b10849ac4f66e5942964';
export async function recoverSpeech({run=google,request=fetch,activate=activateTestedRevision,checkDecoder=()=>{if(spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status!==0)throw Error('SPEECH_DECODER_UNAVAILABLE');},decode=bytes=>spawnSync('ffmpeg',['-v','error','-i','pipe:0','-f','null','-'],{input:bytes}).status===0}={}){
 const read=args=>JSON.parse(run([...args,'--project='+PROJECT,'--format=json']));
 const state=read(['run','services','describe',service,'--region=us-central1']);
 const active=(state.status?.traffic||[]).filter(t=>t.percent>0);
 if(active.length!==1||active[0].percent!==100||!active[0].revisionName?.startsWith(service+'-r4e32ccff-'))return {changed:false,reason:'newer_or_different_release_protected'};
 const canonical=state.status.url;
 const health=await request(canonical+'/api/health',{signal:AbortSignal.timeout(20000)});
 if(!health.ok||(await health.json()).commit!==bad)return {changed:false,reason:'exact_failed_release_not_serving'};
 const voice=async base=>{
  const response=await request(base+'/api/voice/natural',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Welcome to Elevate for Humanity.'}),signal:AbortSignal.timeout(45000)});
  const audio=Buffer.from(await response.arrayBuffer());
  return {status:response.status,passed:response.ok&&/^audio\/mpeg\b/i.test(response.headers.get('content-type')||'')&&audio.length>1000&&decode(audio)};
 };
 checkDecoder(); // A missing verification tool must fail before any synthesis charge.
 const current=await voice(canonical);
 if(current.passed)return {changed:false,reason:'speech_already_works'};
 if(current.status!==503)throw Error('SPEECH_FAILURE_NOT_THE_KNOWN_CACHE_REGRESSION');
 const revisions=read(['run','revisions','list','--service='+service,'--region=us-central1']);
 const candidates=revisions.filter(r=>r.metadata?.name?.startsWith(service+'-r38fa72ef-')&&r.status?.conditions?.some(c=>c.type==='Ready'&&c.status==='True'));
 if(candidates.length!==1)throw Error('SPEECH_ROLLBACK_REVISION_UNVERIFIED');
 const result=await activate({service,revision:candidates[0].metadata.name,commit:previous,fetcher:async(url,options)=>{
  const response=await request(url,options);
  // Finish the short health fetch before the separate, longer audio probe.
  // Its abort signal must not invalidate an unread body during synthesis.
  const body=await response.arrayBuffer();
  if(url.endsWith('/api/health')&&!(await voice(new URL(url).origin)).passed)throw Error('SPEECH_ROLLBACK_AUDIO_UNVERIFIED');
  return new Response(body,{status:response.status,headers:{'Content-Type':'application/json'}});
 }});
 const acceptance=await voice(canonical);
 if(!acceptance.passed)throw Error('SPEECH_ROLLBACK_PUBLIC_AUDIO_UNVERIFIED');
 return {changed:true,action:'temporary_known_good_speech_rollback',commit:previous,revision:result.revision,traffic:result.traffic,publicAudioVerified:true,cacheReuseVerified:false,correctedReleasePending:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(await recoverSpeech()));}catch(error){console.error(JSON.stringify({changed:null,error:/^SPEECH_[A-Z_]+$/.test(error.message||'')?error.message:error.code||'SPEECH_RECOVERY_NEEDS_REVIEW'}));process.exitCode=1;}}
