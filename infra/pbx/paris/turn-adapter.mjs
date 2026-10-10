import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';

const PROJECT='elegant-racer-299721';
const MAX_BODY=220000;
const sessions=new Map();
const SYSTEM='You are PARIS, the Elevate for Humanity telephone receptionist. Speak briefly and naturally. Provide only facts verified by approved program data; when not available, explain that admissions will confirm. Do not claim an action, booking, transfer, eligibility, or payment occurred unless a trusted system confirms it. Never solicit SSNs, passwords, card details or medical information. Ask one question at a time.';

export function pcm16ToUlaw(sample) {
  const negative=sample<0;
  let magnitude=Math.min(32635,Math.abs(sample));
  magnitude+=132;
  let exponent=7;
  for(let expMask=0x4000;exponent>0 && !(magnitude&expMask);exponent--,expMask>>=1){ /* Find the first set magnitude bit. */ }
  const mantissa=(magnitude>>(exponent+3))&15;
  return (~((negative?0x80:0)|(exponent<<4)|mantissa))&255;
}
export function wavToUlaw(wav) {
  if(wav.length<44||wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE')throw Error('INVALID_TTS_WAV');
  let offset=12,format=null,data=null;
  while(offset+8<=wav.length){
    const tag=wav.toString('ascii',offset,offset+4),length=wav.readUInt32LE(offset+4);
    if(offset+8+length>wav.length)throw Error('TRUNCATED_WAV');
    const chunk=wav.subarray(offset+8,offset+8+length);
    if(tag==='fmt ')format={code:chunk.readUInt16LE(0),channels:chunk.readUInt16LE(2),rate:chunk.readUInt32LE(4),bits:chunk.readUInt16LE(14)};
    if(tag==='data')data=chunk;
    offset+=8+length+(length%2);
  }
  if(!format||!data||format.code!==1||format.channels!==1||format.rate!==8000||format.bits!==16||data.length%2)throw Error('TTS_AUDIO_FORMAT_MISMATCH');
  const output=Buffer.alloc(data.length/2);
  for(let i=0;i<output.length;i++)output[i]=pcm16ToUlaw(data.readInt16LE(i*2));
  const pad=(160-output.length%160)%160;
  return pad?Buffer.concat([output,Buffer.alloc(pad,0xff)]):output;
}
async function accessToken(){
  const res=await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'},signal:AbortSignal.timeout(5000)});
  if(!res.ok)throw Error('WORKLOAD_IDENTITY_UNAVAILABLE');
  const token=(await res.json()).access_token;
  if(!token)throw Error('WORKLOAD_IDENTITY_UNAVAILABLE');
  return token;
}
async function googleJson(url,body){
  const res=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+await accessToken(),'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000),redirect:'error'});
  if(!res.ok)throw Error('GOOGLE_VOICE_BACKEND_'+res.status);
  return res.json();
}
export async function recognize(audioBase64,request=googleJson){
  const data=await request('https://speech.googleapis.com/v1/speech:recognize',{config:{encoding:'MULAW',sampleRateHertz:8000,languageCode:'en-US',enableAutomaticPunctuation:true,model:'phone_call'},audio:{content:audioBase64}});
  const phrase=(data.results||[]).map(x=>x.alternatives?.[0]?.transcript||'').join(' ').trim();
  return phrase.slice(0,1500);
}
export async function converse(history,request=googleJson){
  const model=process.env.PARIS_VERTEX_MODEL||'gemini-2.5-flash';
  if(!/^[a-zA-Z0-9._-]+$/.test(model))throw Error('INVALID_MODEL');
  const url='https://us-central1-aiplatform.googleapis.com/v1/projects/'+PROJECT+'/locations/us-central1/publishers/google/models/'+model+':generateContent';
  const data=await request(url,{systemInstruction:{parts:[{text:SYSTEM}]},contents:history.map(h=>({role:h.role,parts:[{text:h.text}]})),generationConfig:{temperature:0.25,maxOutputTokens:240}});
  const result=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('').trim();
  if(!result)throw Error('EMPTY_PARIS_ANSWER');
  return result.slice(0,1200);
}
// Routing is driven by a caller's explicit request, not by generated model text.
// No external dial string or arbitrary extension can be routed by this service.
export function callerRouteIntent(transcript){
  const text=String(transcript||'').toLowerCase().trim();
  const asked=/(?:\b(?:transfer|connect|speak|talk|reach|put me through)\b.{0,48}\b(?:operator|administrator|human|person|representative|front desk)\b|\b(?:operator|administrator)\b.{0,28}\bplease\b)/i;
  return asked.test(text)?{type:'operator',extension:'0'}:null;
}

export async function synthesize(text,request=googleJson){
  const data=await request('https://texttospeech.googleapis.com/v1/text:synthesize',{input:{text},voice:{languageCode:'en-US',name:process.env.PARIS_TTS_VOICE||'en-US-Neural2-F'},audioConfig:{audioEncoding:'LINEAR16',sampleRateHertz:8000}});
  if(!data.audioContent)throw Error('EMPTY_TTS_AUDIO');
  return wavToUlaw(Buffer.from(data.audioContent,'base64')).toString('base64');
}
function authorized(given,expected){
  if(!given?.startsWith('Bearer ')||!expected)return false;
  const a=Buffer.from(given.slice(7)),b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
}
export function makeTurnHandler({stt=recognize,llm=converse,tts=synthesize,token=process.env.PARIS_TURN_TOKEN}={}){
  if(!token || token.length<32)throw Error('PARIS_TURN_TOKEN_MISSING');
  return async(req,res)=>{
    const fail=(code,status)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:code}));};
    if(req.method!=='POST'||req.url!=='/internal/paris/turn')return fail('NOT_FOUND',404);
    if(!authorized(req.headers.authorization,token))return fail('UNAUTHORIZED',401);
    let bytes=0,chunks=[];
    try{
      for await(const chunk of req){bytes+=chunk.length;if(bytes>MAX_BODY)return fail('INPUT_TOO_LARGE',413);chunks.push(chunk);}
      const body=JSON.parse(Buffer.concat(chunks).toString());
      if(!/^[a-f0-9]{24}$/.test(body.sessionId||'')||!Number.isSafeInteger(body.sequence)||body.sequence<0||body.encoding!=='PCMU'||body.sampleRate!==8000) return fail('INVALID_TURN',400);
      if(typeof body.callId!=='string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(body.callId))return fail('INVALID_CALL',400);
      if(typeof body.audioBase64!=='string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.audioBase64))return fail('INVALID_AUDIO',400);
      const audio=Buffer.from(body.audioBase64,'base64');
      if(audio.length<160||audio.length>100000||audio.length%160) return fail('INVALID_AUDIO',400);
      const key=body.sessionId;
      const prior=sessions.get(key)||{history:[],sequence:-1,locked:false,updated:Date.now(),callId:body.callId};
      if(prior.callId!==body.callId)return fail('CALL_SESSION_MISMATCH',409);
      if(prior.locked||body.sequence!==prior.sequence+1)return fail('SEQUENCE_CONFLICT',409);
      prior.locked=true;sessions.set(key,prior);
      try{
        const words=await stt(body.audioBase64);
        if(!words)return fail('NO_SPEECH',422);
        const history=[...prior.history,{role:'user',text:words}].slice(-12);
        const route=callerRouteIntent(words);
        const reply=route?'I will connect you to the operator now.':await llm(history);
        const audioReply=await tts(reply);
        prior.history=[...history,{role:'model',text:reply}].slice(-12);
        prior.sequence=body.sequence;prior.updated=Date.now();
        res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
        res.end(JSON.stringify({replyAudioUlawBase64:audioReply,endCall:false,...(route?{requestedRoute:route}:{})}));
      }finally{prior.locked=false;}
    }catch(err){
      // Log stable error codes, not caller speech, audio, credentials, or model output.
      process.stderr.write('PARIS_TURN_ERROR '+String(err?.message||'UNEXPECTED').replace(/[^A-Z0-9_ -]/gi,'').slice(0,70)+'\n');
      return fail('VOICE_PROCESSING_UNAVAILABLE',503);
    }
  };
}
export function serve(){
  const handler=makeTurnHandler();
  const host=process.env.PARIS_TURN_BIND||'127.0.0.1';
  if(host!=='127.0.0.1')throw Error('PRIVATE_BIND_REQUIRED');
  const port=Number(process.env.PARIS_TURN_PORT||8091);
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error('INVALID_PORT');
  const timer=setInterval(()=>{for(const [k,v] of sessions)if(Date.now()-v.updated>600000)sessions.delete(k);},60000);
  timer.unref();
  const server=createServer(handler);server.listen(port,host);
  return server;
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)serve();
