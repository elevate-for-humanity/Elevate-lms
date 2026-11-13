import {google,PROJECT} from './runtime-config.mjs';
import {courseWorkerBoundary} from './sync-course-worker-regions.mjs';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';

export const LESSON_ROLE_JOBS=Object.freeze({
 instruction:{name:'elevate-course-instruction',cpu:'1',memory:'2Gi'},
 media:{name:'elevate-course-media'}, // Retain the approved rendering resources.
 quality:{name:'elevate-course-quality',cpu:'2',memory:'6Gi'},
});
export const LESSON_ROLE_REGION='us-east1';
export function lessonRoleDefinition(source,role){
 const config=LESSON_ROLE_JOBS[role];if(!config)throw Error('ULTIMATE_AUTOPILOT_ROLE_CONFIGURATION_INVALID');
 courseWorkerBoundary(source);
 const spec=structuredClone(source.spec),task=spec.template.spec.template.spec;
 spec.template.spec.taskCount=1;spec.template.spec.parallelism=1;task.maxRetries=0;
 const container=task.containers[0];
 container.env=(container.env??[]).filter(item=>!['ULTIMATE_AUTOPILOT_ROLE','ULTIMATE_WORKER_ID','ULTIMATE_WORKER_ONCE','EXTERNAL_COURSE_ATTEMPT_ID','ULTIMATE_OWNER_PREVIEW_JOB_ID'].includes(item.name));
 container.env.push({name:'ULTIMATE_AUTOPILOT_ROLE',value:role},{name:'ULTIMATE_WORKER_ONCE',value:'true'},{name:'ULTIMATE_WORKER_ID',value:'autopilot-'+role});
 if(config.cpu)container.resources={...container.resources,limits:{...container.resources.limits,cpu:config.cpu,memory:config.memory}};
 return {apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name:config.name,labels:{'elevate-role-pool':'three-role-v1'}},spec};
}
export function verifyLessonRoleJob(actual,expected){
 const a=actual?.spec?.template?.spec,e=expected.spec.template.spec;
 const normalize=task=>task?{...task,maxRetries:Number(task.maxRetries??0),containers:task.containers?.map(container=>({...container,
  env:[...(container.env??[])].sort((x,y)=>x.name.localeCompare(y.name))}))}:task;
 if(Number(a?.taskCount)!==1||Number(a?.parallelism)!==1||!isDeepStrictEqual(normalize(a?.template?.spec),normalize(e.template.spec)))
  throw Error('ULTIMATE_AUTOPILOT_CONFIGURATION_READBACK_FAILED');
 return {name:expected.metadata.name,role:a.template.spec.containers[0].env.find(item=>item.name==='ULTIMATE_AUTOPILOT_ROLE')?.value,
  image:a.template.spec.containers[0].image,resources:a.template.spec.containers[0].resources.limits};
}
export function deployLessonAutopilots({run=google}={}){
 const scope=['--project='+PROJECT,'--region='+LESSON_ROLE_REGION];
 const source=JSON.parse(run(['run','jobs','describe','elevate-course-builder-parallel',...scope,'--format=json']));
 const directory=mkdtempSync(join(tmpdir(),'lesson-autopilot-'));
 try{
  const verified=[];
  for(const role of Object.keys(LESSON_ROLE_JOBS)){
   const definition=lessonRoleDefinition(source,role),path=join(directory,role+'.json');
   // This file contains the existing runtime environment; never print it.
   writeFileSync(path,JSON.stringify(definition),{mode:0o600});
   run(['run','jobs','replace',path,...scope,'--quiet']);
   const actual=JSON.parse(run(['run','jobs','describe',definition.metadata.name,...scope,'--format=json']));
   verified.push(verifyLessonRoleJob(actual,definition));
  }
  return {verified:true,region:LESSON_ROLE_REGION,jobs:verified};
 }finally{rmSync(directory,{recursive:true,force:true});}
}
export const AUTOPILOT_RPC_ATTEMPTS=3;
export const AUTOPILOT_RPC_RETRY_MS=2000;
export const AUTOPILOT_RPC_TIMEOUT_MS=15000;
const TRANSIENT_TRANSPORT_CODES=new Set(['ENOTFOUND','EAI_AGAIN','ECONNRESET','ECONNREFUSED','ETIMEDOUT','EPIPE','ENETUNREACH','EHOSTUNREACH','UND_ERR_SOCKET','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT']);
// An unanswered read is a connectivity fault, not a database verdict. Only
// transport faults are retried; an HTTP status or a parsed body is a real
// answer and must never be retried.
export function transientAutopilotTransportError(error){
 if(error?.name==='AbortError')return false;
 for(let current=error,depth=0;current&&depth<4;depth++,current=current.cause)
  if(TRANSIENT_TRANSPORT_CODES.has(current.code)||current.name==='TimeoutError'||current.name==='ConnectTimeoutError')return true;
 return false;
}
/** Read-only verdict, retried only while the read is unanswered. A fresh
 * request is built per attempt so a spent timeout deadline is never reused. */
export async function autopilotRpcVerdict(url,optionsFor,{request=fetch,attempts=AUTOPILOT_RPC_ATTEMPTS,
 wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 for(let attempt=1;;attempt++){
  try{
   const response=await request(url,optionsFor());
   // A status answered the read: report it without spending another attempt.
   if(!response.ok)return {answered:true,value:null,status:response.status};
   return {answered:true,value:await response.json(),status:response.status};
  }catch(error){
   if(attempt>=attempts||!transientAutopilotTransportError(error))throw error;
   await wait(AUTOPILOT_RPC_RETRY_MS*attempt);
  }
 }
}
// Runtime registration UPSERTs data; ambiguous network errors must not retry.
export function autopilotRpcWriteOnce(url,optionsFor,{request=fetch}={}){
 return autopilotRpcVerdict(url,optionsFor,{request,attempts:1});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const token=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!token)throw Error('DATABASE_AUTH_REQUIRED');
 const optionsFor=body=>()=>({method:'POST',
  headers:{apikey:token,Authorization:'Bearer '+token,'Content-Type':'application/json'},body,signal:AbortSignal.timeout(AUTOPILOT_RPC_TIMEOUT_MS)});
 const ready=await autopilotRpcVerdict('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/rpc/ultimate_autopilot_ready',optionsFor('{}'));
 if(!ready.answered||ready.value!==true)throw Error('ULTIMATE_AUTOPILOT_DATABASE_MIGRATION_REQUIRED');
 const sha=process.env.IMAGE_SHA;if(!/^[a-f0-9]{40}$/.test(sha??''))throw Error('VERIFIED_REPAIR_IMAGE_REQUIRED');
 const registry='us-central1-docker.pkg.dev/'+PROJECT+'/elevate/ultimate-worker';
 const digest=google(['artifacts','docker','images','describe',registry+':'+sha,'--project='+PROJECT,'--format=value(image_summary.digest)']).trim();
 const verified=deployLessonAutopilots();
 if(verified.jobs.some(job=>job.image!==registry+'@'+digest))throw Error('ULTIMATE_AUTOPILOT_RUNTIME_IMAGE_MISMATCH');
 // The ledger RPC is a write: never replay after an ambiguous transport failure.
 const recorded=await autopilotRpcWriteOnce('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/rpc/register_ultimate_autopilot_runtime',optionsFor(JSON.stringify({p_image_sha:sha,p_image_digest:digest,p_roles:verified.jobs})));
 if(!recorded.answered||recorded.value!==true)throw Error('ULTIMATE_AUTOPILOT_RUNTIME_NOT_RECORDED');
 console.log(JSON.stringify(verified));
}
