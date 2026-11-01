import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium} from '@playwright/test';
import {AccessToken,RoomServiceClient} from 'livekit-server-sdk';
import {google,PROJECT} from './runtime-config.mjs';
export function meetingEndpoint(value){
 const url=new URL(value);
 if(!['wss:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname)||!['livekit.cloud','elevateforhumanity.org'].some(domain=>url.hostname===domain||url.hostname.endsWith('.'+domain)))throw Error('INVALID_ENDPOINT');
 url.protocol='wss:';return url.origin;
}
function servingCredentials(run){
 const flags=['--project',PROJECT,'--region','us-central1','--format=json'];
 const service=JSON.parse(run(['run','services','describe','elevate-admin-migration',...flags]));
 const traffic=(service.status?.traffic||[]).filter(row=>row.percent>0);
 if(traffic.length!==1||traffic[0].percent!==100)throw Error('AMBIGUOUS_REVISION');
 const revision=traffic[0].revisionName||(traffic[0].latestRevision?service.status?.latestReadyRevisionName:null);
 if(typeof revision!=='string'||!/^elevate-[a-z0-9-]+$/.test(revision))throw Error('INVALID_REVISION');
 const resource=JSON.parse(run(['run','revisions','describe',revision,...flags]));
 const env={};
 for(const row of resource.spec?.containers?.[0]?.env||[]){
  if(!['LIVEKIT_URL','LIVEKIT_API_KEY','LIVEKIT_API_SECRET'].includes(row.name))continue;
  const ref=row.valueFrom?.secretKeyRef;
  env[row.name]=typeof row.value==='string'?row.value:ref?run(['secrets','versions','access',ref.key||'latest','--secret',ref.name,'--project',PROJECT]):'';
 }
 if(!env.LIVEKIT_API_KEY||!env.LIVEKIT_API_SECRET)throw Error('MISSING_CREDENTIALS');
 return env;
}
export async function verifyLiveMeetingDelivery({run=google}={}){
 let browser,service,result,created=false,phase='configuration';
 const name='efh-integration-'+randomUUID();
 try{
  const env=servingCredentials(run),url=meetingEndpoint(env.LIVEKIT_URL);
  service=new RoomServiceClient(url.replace('wss:','https:'),env.LIVEKIT_API_KEY,env.LIVEKIT_API_SECRET);
  phase='isolated_test_room';await service.createRoom({name,maxParticipants:2,emptyTimeout:30,departureTimeout:10});created=true;
  async function token(identity){const t=new AccessToken(env.LIVEKIT_API_KEY,env.LIVEKIT_API_SECRET,{identity,ttl:'2m'});t.addGrant({roomJoin:true,room:name,canPublish:true,canSubscribe:true,canPublishData:true});return t.toJwt();}
  phase='browser_start';browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader']});
  const receiver=await browser.newPage(),sender=await browser.newPage();
  for(const page of [receiver,sender]){await page.setContent('<!doctype html><html><body><p>Synthetic meeting verification</p></body></html>');await page.addScriptTag({path:resolve('node_modules/livekit-client/dist/livekit-client.umd.js')});}
  phase='receiver_join';
  await receiver.evaluate(async({url,jwt})=>{
   const sdk=window.LivekitClient,room=new sdk.Room();window.testRoom=room;window.delivery={audio:false,video:false,screenShare:false,data:false};
   room.on(sdk.RoomEvent.TrackSubscribed,(track,publication)=>{
    if(track.kind==='video'){
     const video=track.attach();video.autoplay=true;video.muted=true;document.body.appendChild(video);
     video.requestVideoFrameCallback(()=>{window.delivery[publication.source===sdk.Track.Source.ScreenShare?'screenShare':'video']=true;});
    }else if(track.kind==='audio'){
     const context=new AudioContext();const source=context.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));const analyser=context.createAnalyser();source.connect(analyser);context.resume();
     const samples=new Float32Array(analyser.fftSize);const timer=setInterval(()=>{analyser.getFloatTimeDomainData(samples);if(samples.some(sample=>Math.abs(sample)>0.005)){window.delivery.audio=true;clearInterval(timer);}},20);
    }
   });
   room.on(sdk.RoomEvent.DataReceived,data=>{if(new TextDecoder().decode(data)==='EFH_SYNTHETIC_DELIVERY')window.delivery.data=true;});
   await room.connect(url,jwt,{autoSubscribe:true});
  },{url,jwt:await token('synthetic-receiver')});
  phase='publisher_join';
  await sender.evaluate(async({url,jwt})=>{
   const sdk=window.LivekitClient,room=new sdk.Room();window.testRoom=room;await room.connect(url,jwt,{autoSubscribe:true});
   const context=new AudioContext();await context.resume();const oscillator=context.createOscillator(),gain=context.createGain(),destination=context.createMediaStreamDestination();gain.gain.value=0.1;oscillator.frequency.value=440;oscillator.connect(gain);gain.connect(destination);oscillator.start();
   await room.localParticipant.publishTrack(destination.stream.getAudioTracks()[0],{source:sdk.Track.Source.Microphone,name:'synthetic-audio'});
   for(const [source,label] of [[sdk.Track.Source.Camera,'synthetic-video'],[sdk.Track.Source.ScreenShare,'synthetic-screen']]){
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const drawing=canvas.getContext('2d');let frame=0;
    setInterval(()=>{drawing.fillStyle=frame++%2?'#147d41':'#934ccc';drawing.fillRect(0,0,320,180);drawing.fillStyle='white';drawing.fillText(label+' '+frame,20,40);},33);
    await room.localParticipant.publishTrack(canvas.captureStream(15).getVideoTracks()[0],{source,name:label});
   }
   await room.localParticipant.publishData(new TextEncoder().encode('EFH_SYNTHETIC_DELIVERY'),{reliable:true});
  },{url,jwt:await token('synthetic-publisher')});
  phase='received_media_assertions';await receiver.waitForFunction(()=>Object.values(window.delivery).every(Boolean),undefined,{timeout:45000});
  const delivery=await receiver.evaluate(()=>window.delivery);
  return result={passed:true,syntheticDelivery:delivery,physicalDevicesCertified:false,participants:2,valuesExposed:false};
 }catch{return result={passed:false,phase,physicalDevicesCertified:false,valuesExposed:false};}
 finally{
  if(browser)await browser.close().catch(()=>{});
  if(created){
   try{await service.deleteRoom(name);if(result)result.testRoomCleanedUp=true;}
   catch{if(result){result.passed=false;result.phase='test_room_cleanup';result.testRoomCleanedUp=false;}}
  }
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=await verifyLiveMeetingDelivery();writeFileSync('live-meeting-delivery.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
}
