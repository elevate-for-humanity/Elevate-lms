import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
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
 container.env=container.env.filter(value=>value.name!=='DIRECT_RELEASE_SOURCE_SHA');
 container.env.push({name:'DIRECT_RELEASE_SOURCE_SHA',value:imageSha});
 // One task per preserved source snapshot. HVAC has a Core/Type I snapshot
 // and a supplementary snapshot for its remaining 14 canonical lessons.
 // Each task is finite and
 // cannot be retried by Cloud Run. Original job configuration stays intact.
 task.maxRetries=0;task.timeoutSeconds='21600';
 spec.template.spec.taskCount=4;spec.template.spec.parallelism=2;
 return {apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name:NAME,namespace:source.metadata?.namespace??PROJECT},spec};
}
export function launchDirectRelease({imageSha,run=google}){
 const source=JSON.parse(run(['run','jobs','describe','elevate-course-builder','--project='+PROJECT,'--region='+REGION,'--format=json']));
 const digest=run(['artifacts','docker','images','describe',`us-central1-docker.pkg.dev/${PROJECT}/elevate/ultimate-worker:${imageSha}`,'--project='+PROJECT,'--format=value(image_summary.digest)']).trim();
 const job=directJobTemplate(source,{imageSha,imageDigest:digest});
 let exists=false;
 try{run(['run','jobs','describe',NAME,'--project='+PROJECT,'--region='+REGION,'--format=value(metadata.name)']);exists=true;}catch(error){if(error.code!=='not_found')throw error;}
 if(exists){
  const executions=JSON.parse(run(['run','jobs','executions','list','--job='+NAME,'--project='+PROJECT,'--region='+REGION,'--format=json']));
  if(executions.some(execution=>!execution.status?.completionTime&&!execution.status?.conditions?.some(condition=>condition.type==='Completed'&&['True','False'].includes(condition.status))))return {state:'already-running'};
 }
 run(['run','jobs','replace','-','--project='+PROJECT,'--region='+REGION,'--quiet'],JSON.stringify(job));
 const saved=JSON.parse(run(['run','jobs','describe',NAME,'--project='+PROJECT,'--region='+REGION,'--format=json']));
 const savedTask=saved.spec?.template?.spec?.template?.spec;
 if(savedTask?.containers?.[0]?.image!==job.spec.template.spec.template.spec.containers[0].image||
  Number(savedTask.maxRetries??0)!==0||Number(saved.spec?.template?.spec?.taskCount)!==4||Number(saved.spec.template.spec.parallelism)!==2||
  JSON.stringify(savedTask.containers[0].args)!==JSON.stringify(job.spec.template.spec.template.spec.containers[0].args))throw Error('DIRECT_JOB_READBACK_FAILED');
 run(['run','jobs','execute',NAME,'--project='+PROJECT,'--region='+REGION,'--async','--quiet']);
 return {state:'started',job:NAME,imageDigest:digest,retries:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 console.log(JSON.stringify(launchDirectRelease({imageSha:process.env.DIRECT_RELEASE_SOURCE_SHA})));
}
