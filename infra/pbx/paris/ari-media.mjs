/**
 * Independent PARIS media gateway (staged; not a public-number cutover).
 *
 * Asterisk Stasis(elevate-paris) -> ARI bridge -> externalMedia RTP (PCMU/8k)
 * -> authenticated PARIS_TURN_URL -> RTP reply. The turn processor must return
 * real ulaw 8k audio and a conversation response; it is NOT provided by this file.
 * The service fails closed if its AI adapter is missing.
 *
 * Requires Node 22+, private ARI loopback, private RTP host, and a dedicated
 * least-privileged runtime identity. Do not expose ARI on the public internet.
 */
import { createSocket } from 'node:dgram';
import { randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

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
function required(){
  if (!config.user || !config.password || !config.token || !config.adapter) throw Error('PARIS_RUNTIME_CONFIG_INCOMPLETE');
  if (!config.ari.startsWith('http://127.0.0.1:') || !config.ws.startsWith('ws://127.0.0.1:')) throw Error('ARI_MUST_BE_LOOPBACK');
  if (config.bind !== '127.0.0.1' || config.advertised !== '127.0.0.1') throw Error('RTP_MUST_BE_LOOPBACK');
  const u=new URL(config.adapter);
  if(u.protocol!=='https:' || u.username || u.password) throw Error('TURN_ADAPTER_REQUIRES_PRIVATE_HTTPS');
}
function authHeader(){return 'Basic '+Buffer.from(config.user+':'+config.password).toString('base64');}
async function ari(path,method='GET',data){
  const url=new URL(config.ari+path);
  if(data)for(const [key,value] of Object.entries(data))url.searchParams.set(key,String(value));
  const response=await fetch(url,{method,headers:{Authorization:authHeader()},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('ARI_'+method+'_'+response.status);
  const txt=await response.text();
  return txt?JSON.parse(txt):{};
}
const encode=encodeURIComponent;
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
  if(offset>packet.length-pad)return null;
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
async function speak(session,encoded){
  const bytes=Buffer.from(encoded,'base64');
  if(bytes.length<FRAME || bytes.length>160000 || bytes.length%FRAME!==0)throw Error('INVALID_ULAW_AUDIO');
  if(!session.remote)throw Error('NO_RTP_PEER');
  session.playing=true;
  try{
    for(let i=0;i<bytes.length&&!session.closed;i+=FRAME){
      const part=rtp(bytes.subarray(i,i+FRAME),session);
      await new Promise((resolve,reject)=>session.socket.send(part,session.remote.port,session.remote.address,e=>e?reject(e):resolve()));
      await sleep(RATE_MS);
    }
  }finally{session.playing=false;}
}
async function turn(session){
  if(session.closed || session.busy || session.playing)return;
  const voice=Buffer.concat(session.frames);session.frames=[];session.quiet=0;
  if(voice.length<config.minFrames*FRAME)return;
  session.busy=true;
  try{
    const response=await fetch(config.adapter,{method:'POST',redirect:'error',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.token},
      body:JSON.stringify({callId:session.callId,sessionId:session.id,sequence:session.turn++,encoding:'PCMU',sampleRate:8000,audioBase64:voice.toString('base64')}),
      signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error('PARIS_TURN_HTTP_'+response.status);
    const body=await response.json();
    if(typeof body.replyAudioUlawBase64!=='string')throw Error('PARIS_TURN_AUDIO_MISSING');
    await speak(session,body.replyAudioUlawBase64);
    if(body.requestedRoute?.type==='operator') {
      // Operator 0 must first exist in the reviewed live Asterisk dialplan.
      // The ARI redirect is deliberately limited to the internal context.
      if(body.requestedRoute.extension!=='0') throw Error('ROUTE_NOT_ALLOWED');
      const path='/channels/'+encode(session.callId)+'/redirect?endpoint='+encode('Local/0@internal');
      await ari(path,'POST');
      await end(session);
    } else if(body.endCall===true) await end(session);
  }catch(e){
    // Fail closed: do not claim the caller was served when the AI is unavailable.
    process.stderr.write('PARIS_TURN_FAILED '+String(e?.message||'unknown')+'\n');
    await end(session);
  }finally{session.busy=false;}
}
async function end(s){
  if(s.closed)return;s.closed=true;sessions.delete(s.callId);
  s.socket.close();
  for(const id of [s.externalId,s.bridgeId]) {
    if(!id)continue;
    try{await ari(id===s.bridgeId?'/bridges/'+encode(id):'/channels/'+encode(id),'DELETE');}catch{ /* Best-effort ARI cleanup; original hangup remains dialplan-owned. */ }
  }
  // Leave the original channel's hangup handling to the owning dialplan.
}
async function begin(call){
  const callId=call?.id;
  if(!UUIDISH.test(callId||'') || sessions.has(callId))return;
  const socket=createSocket('udp4');
  const session={id:randomBytes(12).toString('hex'),callId,socket,closed:false,busy:false,playing:false,
    frames:[],quiet:0,heard:false,remote:null,seq:randomBytes(2).readUInt16BE(0),
    timestamp:randomBytes(4).readUInt32BE(0),ssrc:randomBytes(4).readUInt32BE(0),turn:0};
  sessions.set(callId,session);
  try{
    await new Promise((resolve,reject)=>{socket.once('error',reject);socket.bind(0,config.bind,resolve);});
    socket.on('message',(packet,rinfo)=>{
      if(session.closed || session.playing || session.busy)return;
      // Only accept packets from the established Asterisk loopback interface.
      if(rinfo.address!=='127.0.0.1')return;
      const frame=parseRtp(packet);if(!frame)return;
      if(!session.remote)session.remote={address:rinfo.address,port:rinfo.port};
      if(rinfo.port!==session.remote.port)return;
      const speech=isSpeech(frame.payload);
      if(speech)session.heard=true;
      if(!session.heard)return;
      session.frames.push(Buffer.from(frame.payload));
      session.quiet=speech?0:session.quiet+1;
      if(session.frames.length>=config.maxFrames || (session.frames.length>=config.minFrames && session.quiet>=config.silenceFrames))void turn(session);
    });
    const bridge=await ari('/bridges','POST',{type:'mixing',name:'paris-'+session.id});
    session.bridgeId=bridge.id;
    const host=config.advertised+':'+socket.address().port;
    const external=await ari('/channels/externalMedia','POST',{app:config.app,external_host:host,format:'ulaw',direction:'both',transport:'udp',encapsulation:'rtp',connection_type:'client',appArgs:'external'});
    session.externalId=external.id;
    await ari('/bridges/'+encode(bridge.id)+'/addChannel?channel='+encode(callId+','+external.id),'POST');
  }catch(e){
    process.stderr.write('PARIS_BRIDGE_FAILED '+String(e?.message||'unknown')+'\n');
    await end(session);
  }
}
async function main(){
  required();
  while(true){
    const url=new URL(config.ws);url.searchParams.set('app',config.app);
    // ARI WebSocket Basic auth; credentials stay server-side, never logged.
    const socket=new WebSocket(url,{headers:{Authorization:authHeader()}});
    try{
      await new Promise((resolve,reject)=>{
        socket.addEventListener('open',resolve,{once:true});
        socket.addEventListener('error',reject,{once:true});
      });
      await new Promise(resolve=>{
        socket.addEventListener('message',event=>{
          let payload;try{payload=JSON.parse(event.data);}catch{return;}
          if(payload.type==='StasisStart' && payload.channel?.id && !payload.args?.includes('external'))void begin(payload.channel);
          if(payload.type==='StasisEnd' && payload.channel?.id){const s=sessions.get(payload.channel.id);if(s)void end(s);}
        });
        socket.addEventListener('close',resolve,{once:true});
      });
    }catch(e){process.stderr.write('PARIS_ARI_DISCONNECTED '+String(e?.message||'unknown')+'\n');}
    for(const s of [...sessions.values()])await end(s);
    await sleep(2000);
  }
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href) main().catch(e=>{console.error(e.message);process.exitCode=1;});
export {parseRtp,rtp,isSpeech,required};
