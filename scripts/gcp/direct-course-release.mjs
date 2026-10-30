import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
const REGION='us-central1',NAME='elevate-direct-course-release';
export function directJobTemplate(source,{imageSha,imageDigest}) {
 if(!/^[a-f0-9]{40}$/.test(imageSha??'')||!/^sha256:[a-f0-9]{64}$/.test(imageDigest??''))throw Error('DIRECT_TESTED_IMAGE_REQUIRED');
 const spec=structuredClone(source.spec);
 const task=spec?.template?.spec?.template?.spec;
 if(!task?.serviceAccountName||task.containers?.length!==1)throw Error('DIRECT_SOURCE_RUNTIME_REQUIRED');
 const container=task.containers[0];
 if(!Array.isArray(container.env)||!container.env.some(value=>value.name==='SUPABASE_SERVICE_ROLE_KEY'))throw Error('DIRECT_SOURCE_DATABASE_CONNECTION_REQUIRED');
 container.image=`us-central1-docker.pkg.dev/${PROJECT}/elevate/ultimate-worker@${imageDigest}`;
 container.command=['node'];container.args=['--import=tsx','workers/direct-course-release.ts'];
 container.env=container.env.filter(value=>!['DIRECT_RELEASE_SOURCE_SHA','ULTIMATE_PHOTO_REGION'].includes(value.name));
 container.env.push({name:'DIRECT_RELEASE_SOURCE_SHA',value:imageSha},{name:'ULTIMATE_PHOTO_REGION',value:'global'});
 // One task processes course groups sequentially. HVAC's two preserved
 // snapshots stay together before another course starts. The task is finite and
 // cannot be retried by Cloud Run. Original job configuration stays intact.
 task.maxRetries=0;task.timeoutSeconds='21600';
 spec.template.spec.taskCount=1;spec.template.spec.parallelism=1;
 return {apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name:NAME,namespace:source.metadata?.namespace??PROJECT},spec};
}
// One owner-authorized replacement for the obsolete text-card producer.
// Unknown/current executions retain the ordinary no-overlap protection.
const OBSOLETE_PHOTO_EXECUTION='elevate-direct-course-release-mcf87';
const OBSOLETE_PHOTO_SOURCE='3ae82989396abe436d503a694c02f54396d80bb4';
const OBSOLETE_PHOTO_DIGEST='sha256:ef30b16e9cb3ea4e3517aab3ef6633db9d7dbf3aac56bb24489a10eb98194480';
const activeExecution=execution=>!execution.status?.completionTime&&!execution.status?.conditions?.some(condition=>condition.type==='Completed'&&['True','False'].includes(condition.status));
export function knownObsoletePhotoExecution(execution) {
 const container=execution?.spec?.template?.spec?.containers?.[0];
 const source=container?.env?.find(entry=>entry.name==='DIRECT_RELEASE_SOURCE_SHA')?.value;
 // This exact intermediate image restores photographs but lacks the inspected
 // JPEG reader and still uses the capacity-constrained US image endpoint.
 const obsoleteDigests={
  '79dc886bd59385d2f42069fe22c216211d8f00b9':'b131064b00050f336357b40ffaab88362d9d90932c8ebadb18cd75461a830bb8',
  '80eb6455d0bfff9178306fcaedc9b88c84390e73':'85ac9b7f7b4bdd4760e8032fc03dc5922c26dc6449d4671582a8987c36873ca3',
 };
 const superseded=Boolean(obsoleteDigests[source]) &&
  container?.image===`us-central1-docker.pkg.dev/${PROJECT}/elevate/ultimate-worker@sha256:${obsoleteDigests[source]}` &&
  new RegExp('^'+NAME+'-[a-z0-9]+$').test(execution?.metadata?.name??'');
 if(superseded)return activeExecution(execution);
 return execution?.metadata?.name===OBSOLETE_PHOTO_EXECUTION && activeExecution(execution) &&
  container?.image===`us-central1-docker.pkg.dev/${PROJECT}/elevate/ultimate-worker@${OBSOLETE_PHOTO_DIGEST}` &&
  container?.env?.some(entry=>entry.name==='DIRECT_RELEASE_SOURCE_SHA'&&entry.value===OBSOLETE_PHOTO_SOURCE)===true;
}
export async function launchDirectRelease({imageSha,run=google,inspect=inspectRegionalCapacity,retireKnownTextCardExecution=false}){
 const source=JSON.parse(run(['run','jobs','describe','elevate-course-builder','--project='+PROJECT,'--region='+REGION,'--format=json']));
 const digest=run(['artifacts','docker','images','describe',`us-central1-docker.pkg.dev/${PROJECT}/elevate/ultimate-worker:${imageSha}`,'--project='+PROJECT,'--format=value(image_summary.digest)']).trim();
 const job=directJobTemplate(source,{imageSha,imageDigest:digest});
 let exists=false;
 try{run(['run','jobs','describe',NAME,'--project='+PROJECT,'--region='+REGION,'--format=value(metadata.name)']);exists=true;}catch(error){if(error.code!=='not_found')throw error;}
 if(exists){
  const executions=JSON.parse(run(['run','jobs','executions','list','--job='+NAME,'--project='+PROJECT,'--region='+REGION,'--format=json']));
  const active=executions.filter(activeExecution);
  if(active.length){
   if(!retireKnownTextCardExecution||active.length!==1||!new RegExp('^'+NAME+'-[a-z0-9]+$').test(active[0].metadata?.name??'')||imageSha===OBSOLETE_PHOTO_SOURCE)return {state:'already-running'};
   const executionName=active[0].metadata.name;
   const execution=JSON.parse(run(['run','jobs','executions','describe',executionName,'--project='+PROJECT,'--region='+REGION,'--format=json']));
   if(!knownObsoletePhotoExecution(execution)||execution.spec?.template?.spec?.containers?.[0]?.env?.some(entry=>entry.name==='DIRECT_RELEASE_SOURCE_SHA'&&entry.value===imageSha))return {state:'already-running'};
   // Cancellation retains database checkpoints and all saved media. Never
   // replace configuration until readback proves the old task is terminal.
   run(['run','jobs','executions','cancel',executionName,'--project='+PROJECT,'--region='+REGION,'--quiet']);
   const after=JSON.parse(run(['run','jobs','executions','list','--job='+NAME,'--project='+PROJECT,'--region='+REGION,'--format=json']));
   if(after.some(activeExecution))return {state:'obsolete-source-cancelling'};
  }
 }
 const capacity=await inspect({region:REGION,run,task:job.spec.template.spec.template.spec,taskCount:1});
 if(capacity.fits!==true)throw Error('DIRECT_RELEASE_REGIONAL_CAPACITY_UNAVAILABLE');
 run(['run','jobs','replace','-','--project='+PROJECT,'--region='+REGION,'--quiet'],JSON.stringify(job));
 const saved=JSON.parse(run(['run','jobs','describe',NAME,'--project='+PROJECT,'--region='+REGION,'--format=json']));
 const savedTask=saved.spec?.template?.spec?.template?.spec;
 if(savedTask?.containers?.[0]?.image!==job.spec.template.spec.template.spec.containers[0].image||
  Number(savedTask.maxRetries??0)!==0||Number(saved.spec?.template?.spec?.taskCount)!==1||Number(saved.spec.template.spec.parallelism)!==1||
  JSON.stringify(savedTask.containers[0].args)!==JSON.stringify(job.spec.template.spec.template.spec.containers[0].args))throw Error('DIRECT_JOB_READBACK_FAILED');
 run(['run','jobs','execute',NAME,'--project='+PROJECT,'--region='+REGION,'--async','--quiet']);
 return {state:'started',job:NAME,imageDigest:digest,retries:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 launchDirectRelease({imageSha:process.env.DIRECT_RELEASE_SOURCE_SHA,retireKnownTextCardExecution:true})
  .then(result=>console.log(JSON.stringify(result)))
  .catch(error=>{console.error(JSON.stringify({state:'blocked',code:error.code??error.message?.match(/^[A-Z][A-Z0-9_]+/)?.[0]??'DIRECT_RELEASE_FAILED'}));process.exitCode=1;});
}
