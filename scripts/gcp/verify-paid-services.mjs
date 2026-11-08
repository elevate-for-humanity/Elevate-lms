import {mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const project='elegant-racer-299721',checks=[];
async function check(name,probe){
 try{const evidence=await probe();checks.push({name,...evidence});}
 catch{checks.push({name,passed:false,reason:'functional_probe_unavailable'});}
}
const request=(url,options={})=>fetch(url,{...options,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(45000)});
for(const [component,host] of Object.entries({marketing:'www',admin:'admin',lms:'app',store:'store'})){
 for(const path of ['/api/health','/api/ready'])await check(component+path,async()=>{
  const response=await request('https://'+host+'.elevateforhumanity.org'+path),body=await response.json();
  const passed=response.ok&&body.service===component&&(path.endsWith('health')?body.healthy===true&&body.dependencies?.supabase?.ok===true:body.ready===true);
  return {passed,httpStatus:response.status,commit:body.commitSha||body.commit||null,dependencyVerified:path.endsWith('health')&&body.dependencies?.supabase?.ok===true};
 });
}
await check('saved speech playback and reuse',async()=>{
 const samples=[];
 for(let i=0;i<2;i++){
  const response=await request('https://www.elevateforhumanity.org/api/voice/natural',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Welcome to Elevate for Humanity.',voice:'warm'})});
  const bytes=Buffer.from(await response.arrayBuffer());
  let decoded=false;
  if(response.ok&&response.headers.get('content-type')?.includes('audio/mpeg')){
   const folder=mkdtempSync(join(tmpdir(),'speech-proof-'));
   try{const file=join(folder,'voice.mp3');writeFileSync(file,bytes);execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{stdio:['ignore','pipe','pipe'],timeout:20000});decoded=true;}
   finally{rmSync(folder,{recursive:true,force:true});}
  }
  samples.push({httpStatus:response.status,cache:response.headers.get('x-elevate-speech-cache'),bytes:bytes.length,hash:createHash('sha256').update(bytes).digest('hex'),audio:decoded});
  if(!samples.at(-1).audio)break;
 }
 return {passed:samples.length===2&&samples.every(x=>x.audio)&&samples[1].cache==='hit'&&samples[0].hash===samples[1].hash,samples};
});
const cli=args=>JSON.parse(execFileSync('gcloud',[...args,'--project='+project,'--format=json'],{encoding:'utf8',maxBuffer:32*1024*1024,timeout:120000,stdio:['ignore','pipe','pipe']}));
for(const region of ['us-central1','us-east1']){
 await check('Cloud Run paid services '+region,async()=>{
  const services=cli(['run','services','list','--region='+region]);
  const rows=[];
  for(const service of services){
   const name=service.metadata?.name;
   rows.push({name,ready:service.status?.conditions?.some(x=>x.type==='Ready'&&x.status==='True'),revision:service.status?.latestReadyRevisionName,minimumInstances:service.metadata?.annotations?.['run.googleapis.com/minScale']||0,revisionMinimum:service.spec?.template?.metadata?.annotations?.['autoscaling.knative.dev/minScale']||0,limits:service.spec?.template?.spec?.containers?.[0]?.resources?.limits,
    functionalAcceptance:['elevate-marketing-migration','elevate-admin-migration','elevate-lms-migration','elevate-store-migration'].includes(name)?'see public probes':'authenticated work sample still required'});
   if(/studio-browser/.test(name||'')&&service.status?.url){
    await check(name+' browser and persistent storage',async()=>{
     const response=await request(service.status.url+'/health'),body=await response.json();
     return {passed:response.ok&&body.service==='studio-browser'&&body.ready===true&&body.browserConnected===true,httpStatus:response.status,activeSessions:body.activeSessions,commit:body.commit,scope:'browser connection and storage readiness; user session actions not exercised'};
    });
   }
  }
  return {passed:rows.every(x=>x.ready),scope:'infrastructure readiness only; not proof of functional work',services:rows};
 });
 await check('Course job execution '+region,async()=>{
  const jobs=cli(['run','jobs','list','--region='+region]);
  const evidence=[];
  for(const job of jobs){
   const name=job.metadata?.name;
   const executions=cli(['run','jobs','executions','list','--job='+name,'--region='+region,'--limit=1']);
   const latest=executions[0],condition=latest?.status?.conditions?.find(x=>x.type==='Completed');
   evidence.push({name,execution:latest?.metadata?.name||null,completed:condition?.status==='True',completedAt:latest?.status?.completionTime||null,scope:'execution receipt; lesson quality and publication require independent acceptance'});
  }
  return {passed:evidence.length>0&&evidence.every(x=>x.completed),jobs:evidence};
 });
}
mkdirSync('audit-reports',{recursive:true});
const report={checkedAt:new Date().toISOString(),checks,allProbesPassed:checks.every(x=>x.passed),limitations:['Cloud Run Ready is not functional acceptance','No VM is stopped merely because it appears unused','Vertex output quality, registry pullability and each VM workload need independent evidence']};
writeFileSync('audit-reports/service-acceptance.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(!report.allProbesPassed)process.exitCode=1;
