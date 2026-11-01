/**
 * PARIS media gateway for the existing Elevate business phone number.
 *
 * Asterisk Stasis(elevate-paris) -> ARI bridge -> loopback AudioSocket PCM/8k
 * -> authenticated PARIS_TURN_URL -> private PCM reply. The turn processor must return
 * real ulaw 8k audio and a conversation response; it is NOT provided by this file.
 * The service fails closed if its AI adapter is missing.
 *
 * Requires Node 22+, private ARI loopback, private media host, and a dedicated
 * least-privileged runtime identity. Do not expose ARI on the public internet.
 */
import { createServer } from 'node:net';
import {pcm16ToUlaw} from './turn-adapter.mjs';
import { randomBytes,randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import {privateTurn,privateTurnOptions} from './private-turn.mjs';

const ULAW_SILENCE=0xff, FRAME=160, RATE_MS=20;
const config = {
  ari: process.env.PARIS_ARI_URL || 'http://127.0.0.1:8088/ari',
  ws: process.env.PARIS_ARI_WS || 'ws://127.0.0.1:8088/ari/events',
  user: process.env.PARIS_ARI_USER,
  password: process.env.PARIS_ARI_PASSWORD,
  app: 'elevate-paris',
  bind: process.env.PARIS_RTP_BIND || '127.0.0.1',
  advertised: process.env.PARIS_RTP_ADVERTISED || '127.0.0.1',
  adapter: process.env.PARIS_TURN_URL,
  token: process.env.PARIS_TURN_TOKEN,
  minFrames: 35, // 0.7 seconds, require actual input before calling PARIS.
  maxFrames: 600, // 12 seconds maximum per turn.
  silenceFrames: 45, // 900 ms end-of-turn silence.
  threshold: 450,
};
const UUIDISH=/^[a-zA-Z0-9._:-]{1,128}$/;
const sessions=new Map();
const EXTERNAL_PREFIX='paris-media-';
export function isCallerStart(event){
  // externalMedia emits StasisStart too, with no appArgs in Asterisk 20.
  // Its event can arrive before the HTTP creation response. Reject by both the
  // preallocated ID namespace and the actual channel technology, not arguments.
  return event?.type==='StasisStart' && UUIDISH.test(event.channel?.id||'') &&
    !event.channel.id.startsWith(EXTERNAL_PREFIX) &&
    /^(PJSIP|Local)\//.test(event.channel?.name||'');
}
export async function createExternalChannel(session,host,request=ari){
  const peer=/^127[.]0[.]0[.]1:([0-9]{4,5})$/.exec(host);
  if(!peer || Number(peer[1])<1024 || Number(peer[1])>65535)throw Error('EXTERNAL_MEDIA_HOST_NOT_LOOPBACK');
  session.externalId=EXTERNAL_PREFIX+session.id;
  session.audioSocketId ||= randomUUID();
  const external=await request('/channels/externalMedia','POST',{
    channelId:session.externalId,app:config.app,external_host:host,format:'slin',
    direction:'both',transport:'tcp',encapsulation:'audiosocket',connection_type:'client',data:session.audioSocketId,
  });
  if(external.id!==session.externalId)throw Error('EXTERNAL_CHANNEL_ID_MISMATCH');
  return external;
}
export async function waitForOwnedMedia(session,request=ari,wait=sleep){
  if(!session.externalId?.startsWith(EXTERNAL_PREFIX) || !UUIDISH.test(session.externalId))throw Error('EXTERNAL_CHANNEL_ID_MISMATCH');
  for(let attempt=0;attempt<20;attempt++){
    const app=await request('/applications/'+config.app);
    if(app.channel_ids?.includes(session.externalId))return;
    await wait(50);
  }
  throw Error('EXTERNAL_CHANNEL_STASIS_NOT_READY');
}
export async function ownedMediaPeer(session,external,request=ari){
  if(!session.externalId?.startsWith(EXTERNAL_PREFIX) || !UUIDISH.test(session.externalId) || external?.id!==session.externalId)throw Error('EXTERNAL_CHANNEL_ID_MISMATCH');
  const values={...external.channelvars};
  for(const variable of ['UNICASTRTP_LOCAL_ADDRESS','UNICASTRTP_LOCAL_PORT']){
    if(values[variable]===undefined){
      const result=await request('/channels/'+encode(session.externalId)+'/variable?variable='+variable);
      values[variable]=result.value;
    }
  }
  const address=values.UNICASTRTP_LOCAL_ADDRESS,rawPort=values.UNICASTRTP_LOCAL_PORT;
  const port=Number(rawPort);
  if(!['127.0.0.1','0.0.0.0'].includes(address) || !/^[0-9]{4,5}$/.test(String(rawPort)) || !Number.isInteger(port) || port<1024 || port>65535)throw Error('EXTERNAL_MEDIA_PEER_NOT_LOOPBACK');
  return {address:'127.0.0.1',port};
}
// AudioSocket keeps the media leg on loopback without the UDP receive failure
// reproduced in this Asterisk image. Public carrier TLS/SRTP and WebRTC ICE stay
// independently configured. Authenticate the per-call UUID before accepting PCM.
export class AudioSocketParser {
  constructor(uuid,onAudio,onReady=()=>{}){
    if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(uuid))throw Error('AUDIO_SOCKET_ID_INVALID');
    this.expected=Buffer.from(uuid.replaceAll('-',''),'hex');this.onAudio=onAudio;this.onReady=onReady;
    this.pending=Buffer.alloc(0);this.voice=Buffer.alloc(0);this.ready=false;
  }
  push(chunk){
    if(this.pending.length+chunk.length>65536)throw Error('AUDIO_SOCKET_BUFFER_LIMIT');
    this.pending=Buffer.concat([this.pending,chunk]);
    while(this.pending.length>=3){
      const type=this.pending[0],size=this.pending.readUInt16BE(1);
      if(size>6400)throw Error('AUDIO_SOCKET_FRAME_LIMIT');
      if(this.pending.length<3+size)return;
      const body=this.pending.subarray(3,3+size);this.pending=this.pending.subarray(3+size);
      if(!this.ready){
        if(type!==1 || size!==16 || !body.equals(this.expected))throw Error('AUDIO_SOCKET_ID_MISMATCH');
        this.ready=true;this.onReady();continue;
      }
      if(type===0 || type===255)throw Error('AUDIO_SOCKET_PEER_ENDED');
      if(type===3 && size===1)continue; // Caller keypad routing remains ARI-owned.
      if(type!==16 || !size || size%2)throw Error('AUDIO_SOCKET_PCM_INVALID');
      const voice=Buffer.alloc(size/2);
      for(let i=0;i<voice.length;i++)voice[i]=pcm16ToUlaw(body.readInt16LE(i*2));
      this.voice=Buffer.concat([this.voice,voice]);
      while(this.voice.length>=FRAME){
        const frame=Buffer.from(this.voice.subarray(0,FRAME));this.voice=this.voice.subarray(FRAME);this.onAudio(frame);
      }
    }
  }
}
export function audioSocketFrame(ulaw){
  if(ulaw.length!==FRAME)throw Error('AUDIO_SOCKET_FRAME_SIZE');
  const frame=Buffer.alloc(3+FRAME*2);frame[0]=16;frame.writeUInt16BE(FRAME*2,1);
  for(let i=0;i<FRAME;i++)frame.writeInt16LE(ulawDecode(ulaw[i]),3+i*2);
  return frame;
}
export async function listenAudioSocket(session,onAudio,{finish=end}={}){
  session.audioSocketId ||= randomUUID();
  let accept,reject;
  const connected=new Promise((resolve,fail)=>{accept=resolve;reject=fail;});
  connected.catch(()=>{}); // Setup can fail before the caller awaits the handshake.
  const timer=setTimeout(()=>reject(Error('AUDIO_SOCKET_HANDSHAKE_TIMEOUT')),10000);timer.unref();
  session.mediaDeadline=timer;
  const fail=()=>{reject(Error('AUDIO_SOCKET_CONNECTION_FAILED'));if(!session.closed&&!session.transferring)void finish(session,'continue');};
  const server=createServer(socket=>{
    if(socket.remoteAddress!=='127.0.0.1' || session.socket || session.closed){socket.destroy();return;}
    session.socket=socket;socket.setNoDelay(true);server.close();
    const parser=new AudioSocketParser(session.audioSocketId,onAudio,()=>{
      clearTimeout(timer);session.remote={address:'127.0.0.1',port:socket.remotePort};
      session.writeAudio=payload=>new Promise((resolve,failWrite)=>socket.write(audioSocketFrame(payload),error=>error?failWrite(Error('AUDIO_SOCKET_WRITE_FAILED')):resolve()));
      accept();
    });
    socket.on('data',chunk=>{try{parser.push(chunk);}catch{socket.destroy();fail();}});
    socket.on('error',fail);socket.on('close',fail);
  });
  session.server=server;server.on('error',fail);
  await new Promise((resolve,failListen)=>{server.once('error',failListen);server.listen(0,'127.0.0.1',resolve);});
  return {host:'127.0.0.1:'+server.address().port,connected};
}
function required(){
  if (!config.user || !config.password || !config.token || !config.adapter) throw Error('PARIS_RUNTIME_CONFIG_INCOMPLETE');
  for(const [raw,protocol] of [[config.ari,'http:'],[config.ws,'ws:']]){
    const endpoint=new URL(raw);
    if(endpoint.protocol!==protocol || endpoint.hostname!=='127.0.0.1' || endpoint.username || endpoint.password)throw Error('ARI_MUST_BE_LOOPBACK');
  }
  if (config.bind !== '127.0.0.1' || config.advertised !== '127.0.0.1') throw Error('RTP_MUST_BE_LOOPBACK');
  privateTurnOptions(config.adapter,config.token);
}
function authHeader(){return 'Basic '+Buffer.from(config.user+':'+config.password).toString('base64');}
async function ari(path,method='GET',data){
  const url=new URL(config.ari+path);
  if(data)for(const [key,value] of Object.entries(data))url.searchParams.set(key,String(value));
  const response=await fetch(url,{method,headers:{Authorization:authHeader()},signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!response.ok)throw Error('ARI_'+method+'_'+response.status);
  const txt=await response.text();
  return txt?JSON.parse(txt):{};
}
const encode=encodeURIComponent;
export async function routeOperator(callId,route,request=ari){
  if(!UUIDISH.test(callId||'') || route?.type!=='operator' || route.extension!=='0')throw Error('ROUTE_NOT_ALLOWED');
  await request('/channels/'+encode(callId)+'/continue','POST',{
    context:'internal',extension:'0',priority:1,
  });
}
export async function routeApprovedExtension(callId,route,request=ari,allowed=process.env.PARIS_ALLOWED_EXTENSIONS || ''){
  const permitted=new Set(String(allowed).split(',').map(v=>v.trim()).filter(v=>/^[1-9]\d{2}$/.test(v)));
  if(!UUIDISH.test(callId||'') || route?.type!=='extension' || !permitted.has(route.extension))throw Error('ROUTE_NOT_ALLOWED');
  await request('/channels/'+encode(callId)+'/continue','POST',{
    context:'elevate-paris-directory',extension:route.extension,priority:1,
  });
}
export async function handleDtmf(event,active=sessions,{route=routeOperator,finish=end}={}){
  if(event?.type!=='ChannelDtmfReceived' || event.digit!=='0')return;
  const session=active.get(event.channel?.id);
  if(!session || session.closed || session.transferring)return;
  // Only the caller already owned by this gateway can request operator zero.
  // Ignore other digits until directory routing has an authoritative mapping.
  session.transferring=true;
  session.frames=[];session.quiet=0;session.heard=false;
  try{
    await route(session.callId,{type:'operator',extension:'0'});
  }catch{
    await finish(session,'continue');
    return;
  }
  // Successful handoff releases media without hanging up the caller leg.
  await finish(session);
}
export async function releaseCaller(callId,disposition,request=ari){
  if(!UUIDISH.test(callId||'') || !['continue','hangup'].includes(disposition))throw Error('CALL_RELEASE_NOT_ALLOWED');
  if(disposition==='continue'){
    try{
      // Resume after the original Stasis application, where the reviewed
      // dialplan owns fallback. Never invent a destination or leave a silent leg.
      await request('/channels/'+encode(callId)+'/continue','POST');
      return;
    }catch{ /* If fallback cannot resume, terminate only this owned caller leg. */ }
  }
  await request('/channels/'+encode(callId),'DELETE');
}
function ulawDecode(byte){
  byte=(~byte)&255;
  const sign=byte&128, exponent=(byte>>4)&7, mantissa=byte&15;
  const pcm=(((mantissa<<3)+132)<<exponent)-132;
  return sign?-pcm:pcm;
}
function isSpeech(pcmu){
  let energy=0;
  for(let i=0;i<pcmu.length;i++) energy+=Math.abs(ulawDecode(pcmu[i]));
  return energy/Math.max(1,pcmu.length)>config.threshold;
}
function parseRtp(packet){
  if(packet.length<12 || packet[0]>>6!==2)return null;
  const cc=packet[0]&15;const extension=Boolean(packet[0]&16);
  let offset=12+cc*4;if(offset>packet.length)return null;
  if(extension){if(offset+4>packet.length)return null;offset+=4+packet.readUInt16BE(offset+2)*4;}
  const pad=(packet[0]&32)?packet[packet.length-1]:0;
  if((packet[0]&32) && (pad===0 || pad>packet.length-offset))return null;
  if(offset>=packet.length-pad)return null;
  const payloadType=packet[1]&127;
  if(payloadType!==0)return null; // PCMU payload type 0 only.
  return {payload:packet.subarray(offset,packet.length-pad),ssrc:packet.readUInt32BE(8)};
}
function rtp(payload,session){
  const out=Buffer.allocUnsafe(12+payload.length);
  out[0]=0x80;out[1]=0;out.writeUInt16BE(session.seq,2);
  out.writeUInt32BE(session.timestamp>>>0,4);out.writeUInt32BE(session.ssrc,8);
  payload.copy(out,12);
  session.seq=(session.seq+1)&0xffff;session.timestamp=(session.timestamp+payload.length)>>>0;
  return out;
}
export async function speak(session,encoded,{clock=()=>performance.now(),wait=sleep}={}){
  const bytes=Buffer.from(encoded,'base64');
  if(bytes.length<FRAME || bytes.length>640000 || bytes.length%FRAME!==0)throw Error('INVALID_ULAW_AUDIO');
  if(!session.remote)throw Error('NO_RTP_PEER');
  session.playing=true;
  const startedAt=clock();
  try{
    for(let i=0;i<bytes.length&&!session.closed&&!session.transferring;i+=FRAME){
      const payload=bytes.subarray(i,i+FRAME);
      if(session.writeAudio)await session.writeAudio(payload);
      else { // Retained UDP codec harness; production sessions use authenticated TCP.
        const part=rtp(payload,session);
        await new Promise((resolve,reject)=>session.socket.send(part,session.remote.port,session.remote.address,e=>e?reject(e):resolve()));
      }
      // Send complete 20ms audio frames against a monotonic timeline. Socket
      // callbacks and event-loop work must not add delay to every frame.
      const delay=startedAt+(i/FRAME+1)*RATE_MS-clock();
      if(delay>0)await wait(delay);
    }
  }finally{session.playing=false;}
}
export async function greet(session,{request=privateTurn,play=speak,finish=end}={}){
  if(session.closed || session.transferring || session.greetingStarted || !session.bridgeReady || !session.remote)return;
  session.greetingStarted=true;session.busy=true;
  process.stderr.write('PARIS_GREETING_REQUESTED\n');
  clearTimeout(session.greetingDeadline);
  try{
    const body=await request(config.adapter,{callId:session.callId,sessionId:session.id,sequence:session.turn++,event:'greeting',encoding:'PCMU',sampleRate:8000},config.token);
    if(session.closed || session.transferring)return;
    if(typeof body.replyAudioUlawBase64!=='string')throw Error('PARIS_GREETING_AUDIO_MISSING');
    process.stderr.write('PARIS_GREETING_AUDIO_READY\n');
    await play(session,body.replyAudioUlawBase64);
    if(!session.closed)process.stderr.write('PARIS_GREETING_SENT\n');
  }catch{
    process.stderr.write('PARIS_GREETING_FAILED\n');
    if(!session.closed && !session.transferring)await finish(session,'continue');
  }finally{session.busy=false;}
}
export async function turn(session,{request=privateTurn,play=speak,finish=end}={}){
  if(session.closed || session.transferring || session.busy || session.playing)return;
  const voice=Buffer.concat(session.frames);session.frames=[];session.quiet=0;session.heard=false;
  if(voice.length<config.minFrames*FRAME)return;
  session.busy=true;
  process.stderr.write('PARIS_TURN_REQUESTED\n');
  try{
    const body=await request(config.adapter,{callId:session.callId,sessionId:session.id,sequence:session.turn++,encoding:'PCMU',sampleRate:8000,audioBase64:voice.toString('base64')},config.token);
    if(session.closed || session.transferring)return;
    if(typeof body.replyAudioUlawBase64!=='string')throw Error('PARIS_TURN_AUDIO_MISSING');
    process.stderr.write('PARIS_TURN_AUDIO_READY\n');
    await play(session,body.replyAudioUlawBase64);
    if(!session.closed)process.stderr.write('PARIS_TURN_SENT\n');
    if(session.closed || session.transferring)return;
    if(body.requestedRoute?.type==='operator' || body.requestedRoute?.type==='extension') {
      // Operator 0 must first exist in the reviewed live Asterisk dialplan.
      // Resume the allowlisted dialplan route without changing channel technology.
      if(body.requestedRoute.type==='operator')await routeOperator(session.callId,body.requestedRoute);
      else await routeApprovedExtension(session.callId,body.requestedRoute);
      await finish(session);
    } else if(body.endCall===true) await finish(session,'hangup');
  }catch(e){
    if(session.closed || session.transferring)return;
    // Fail closed: do not claim the caller was served when the AI is unavailable.
    process.stderr.write('PARIS_TURN_FAILED\n');
    await finish(session,'continue');
  }finally{session.busy=false;}
}
async function cleanupMedia(s){
  for(const id of [s.externalId,s.bridgeId]) {
    if(!id)continue;
    try{await ari(id===s.bridgeId?'/bridges/'+encode(id):'/channels/'+encode(id),'DELETE');}catch{ /* Best-effort ARI cleanup; original hangup remains dialplan-owned. */ }
  }
}
async function end(s,disposition='released'){
  if(s.closed)return;s.closed=true;sessions.delete(s.callId);
  clearTimeout(s.deadline);
  clearTimeout(s.greetingDeadline);clearTimeout(s.mediaDeadline);
  try{s.server?.close();}catch{}
  try{if(s.socket?.destroy)s.socket.destroy();else s.socket?.close();}catch{ /* Binding may have failed before cleanup. */ }
  await cleanupMedia(s);
  if(disposition!=='released'){
    try{await releaseCaller(s.callId,disposition);}
    catch{process.stderr.write('PARIS_CALL_RELEASE_FAILED\n');}
  }
}
async function begin(call){
  const callId=call?.id;
  if(!UUIDISH.test(callId||'') || sessions.has(callId))return;
  if(sessions.size>=16){
    try{await releaseCaller(callId,'continue');}catch{process.stderr.write('PARIS_CALL_RELEASE_FAILED\n');}
    return;
  }
  const session={id:randomBytes(12).toString('hex'),callId,socket:null,closed:false,busy:false,playing:false,
    frames:[],quiet:0,heard:false,remote:null,seq:randomBytes(2).readUInt16BE(0),
    timestamp:randomBytes(4).readUInt32BE(0),ssrc:randomBytes(4).readUInt32BE(0),turn:0};
  sessions.set(callId,session);
  session.deadline=setTimeout(()=>void end(session,'continue'),15*60*1000);
  session.deadline.unref();
  try{
    if(call.state!=='Up')await ari('/channels/'+encode(callId)+'/answer','POST');
    if(session.closed)return;
    const media=await listenAudioSocket(session,payload=>{
      if(session.closed || session.transferring || session.playing || session.busy || !session.bridgeReady)return;
      const speech=isSpeech(payload);
      if(speech)session.heard=true;
      if(!session.heard)return;
      session.frames.push(payload);
      session.quiet=speech?0:session.quiet+1;
      if(session.frames.length>=config.maxFrames || (session.frames.length>=config.minFrames && session.quiet>=config.silenceFrames))void turn(session);
    });
    const bridge=await ari('/bridges','POST',{type:'mixing,proxy_media',name:'paris-'+session.id});
    session.bridgeId=bridge.id;
    if(session.closed){await cleanupMedia(session);return;}
    const external=await createExternalChannel(session,media.host);
    await media.connected;
    await waitForOwnedMedia(session);
    if(session.closed){await cleanupMedia(session);return;}
    await ari('/bridges/'+encode(bridge.id)+'/addChannel?channel='+encode(callId+','+external.id),'POST');
    if(session.closed){await cleanupMedia(session);return;}
    session.bridgeReady=true;
    // Start after the authenticated private media handshake and bridge join.
    // No caller speech is required to start the saved greeting.
    void greet(session);
  }catch(e){
    process.stderr.write('PARIS_BRIDGE_FAILED\n');
    await end(session,'continue');
  }
}
export function createEventSocket(settings,Socket=WebSocket){
  const url=new URL(settings.ws);
  if(url.protocol!=='ws:' || url.hostname!=='127.0.0.1' || url.username || url.password || !settings.user || !settings.password)throw Error('ARI_MUST_BE_LOOPBACK');
  url.searchParams.set('app',settings.app);
  // Native Node WebSocket follows the browser constructor and has no header
  // option. ARI supports api_key authentication on its private event socket.
  url.searchParams.set('api_key',settings.user+':'+settings.password);
  return new Socket(url);
}
export async function serveGateway(){
  required();
  while(true){
    const socket=createEventSocket(config);
    try{
      await new Promise((resolve,reject)=>{
        socket.addEventListener('open',resolve,{once:true});
        socket.addEventListener('error',reject,{once:true});
      });
      await new Promise(resolve=>{
        socket.addEventListener('message',event=>{
          let payload;try{payload=JSON.parse(event.data);}catch{return;}
          if(isCallerStart(payload))void begin(payload.channel);
          if(payload.type==='ChannelDtmfReceived')void handleDtmf(payload).catch(()=>{
            process.stderr.write('PARIS_KEYPAD_HANDOFF_FAILED\n');
          });
          if(payload.type==='StasisEnd' && payload.channel?.id){const s=sessions.get(payload.channel.id);if(s)void end(s);}
        });
        socket.addEventListener('close',resolve,{once:true});
      });
    }catch{process.stderr.write('PARIS_ARI_DISCONNECTED\n');}
    for(const s of [...sessions.values()])await end(s,'continue');
    await sleep(2000);
  }
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href) serveGateway().catch(()=>{console.error('PARIS_RUNTIME_STARTUP_FAILED');process.exitCode=1;});
export {parseRtp,rtp,isSpeech,required};
