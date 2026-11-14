// Protocol-only test receiver. No customer UI, real microphone, or credential logging.
import {Web} from '/sip/index.js';
const state={registered:false,received:false,answered:false,remoteAudibleWindows:0,inboundBytes:0,outboundBytes:0,dtlsConnected:false,failed:false};
window.ownedPhoneTestState=state;
let phone,timer,audioContext,analyser;
window.startOwnedPhoneTest=async credential=>{
 const audio=document.querySelector('audio');
 phone=new Web.SimpleUser(credential.wsUrl,{
  aor:`sip:${credential.sipUsername}@${credential.sipDomain}`,
  media:{constraints:{audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false},remote:{audio}},
  registererOptions:{expires:120},
  userAgentOptions:{authorizationUsername:credential.sipUsername,authorizationPassword:credential.sipPassword,logBuiltinEnabled:false,logConfiguration:false,
   sessionDescriptionHandlerFactoryOptions:{peerConnectionConfiguration:{iceServers:credential.iceServers,iceTransportPolicy:'relay'}}},
 });
 phone.delegate={
  onRegistered:()=>{state.registered=true;},
  onUnregistered:()=>{state.registered=false;},
  onCallReceived:async()=>{
   const number=String(phone.session?.remoteIdentity?.uri?.user||'').replace(/[^0-9]/g,'');
   if(number!=='14632401404'&&number!=='4632401404'){state.failed=true;await phone.hangup().catch(()=>{});return;}
   state.received=true;
   try{await phone.answer();}catch{state.failed=true;}
  },
  onCallAnswered:()=>{state.answered=true;},
  onServerDisconnect:()=>{state.registered=false;},
 };
 timer=setInterval(async()=>{
  try{
   const stream=phone.remoteMediaStream;
   if(stream&&!analyser){
    audioContext=new AudioContext();await audioContext.resume();
    analyser=audioContext.createAnalyser();analyser.fftSize=1024;
    const mute=audioContext.createGain();mute.gain.value=0;
    audioContext.createMediaStreamSource(stream).connect(analyser);analyser.connect(mute);mute.connect(audioContext.destination);
   }
   if(analyser){const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);if(Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length)>.002)state.remoteAudibleWindows++;}
   const pc=phone.session?.sessionDescriptionHandler?.peerConnection;
   if(pc)for(const report of (await pc.getStats()).values()){
    if(report.type==='inbound-rtp'&&(report.kind==='audio'||report.mediaType==='audio'))state.inboundBytes=Math.max(state.inboundBytes,report.bytesReceived||0);
    if(report.type==='outbound-rtp'&&(report.kind==='audio'||report.mediaType==='audio'))state.outboundBytes=Math.max(state.outboundBytes,report.bytesSent||0);
    if(report.type==='transport'&&report.dtlsState==='connected')state.dtlsConnected=true;
   }
  }catch{ /* Require positive media evidence; a closed-call stats poll adds none. */ }
 },100);
 await phone.connect();await phone.register();
};
window.stopOwnedPhoneTest=async()=>{
 clearInterval(timer);
 if(phone?.session)await phone.hangup().catch(()=>{});
 if(phone){await phone.unregister().catch(()=>{});await phone.disconnect().catch(()=>{});}
 await audioContext?.close().catch(()=>{});
};
