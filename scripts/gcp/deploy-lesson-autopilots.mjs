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
 if(a?.taskCount!==1||a?.parallelism!==1||!isDeepStrictEqual(a?.template?.spec,e.template.spec))
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
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const token=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!token)throw Error('DATABASE_AUTH_REQUIRED');
 const ready=await fetch('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/rpc/ultimate_autopilot_ready',{
  method:'POST',headers:{apikey:token,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000),
 });
 if(!ready.ok || await ready.json()!==true)throw Error('ULTIMATE_AUTOPILOT_DATABASE_MIGRATION_REQUIRED');
 console.log(JSON.stringify(deployLessonAutopilots()));
}
