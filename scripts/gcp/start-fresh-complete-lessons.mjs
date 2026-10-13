import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity,isTerminalExecution} from './regional-capacity.mjs';
const region='us-east1',name='elevate-course-builder-parallel',expectedSha=process.env.COMPLETE_LESSON_IMAGE_SHA;
if(!/^[a-f0-9]{40}$/.test(expectedSha??''))throw Error('EXACT_COMPLETE_LESSON_IMAGE_REQUIRED');
const read=(args,r=region)=>JSON.parse(google([...args,'--project='+PROJECT,'--region='+r,'--format=json']));
const source=read(['run','jobs','describe','elevate-course-builder'],'us-central1');
const task=source.spec.template.spec.template.spec;
const expected=JSON.parse(google(['artifacts','docker','images','describe','us-central1-docker.pkg.dev/'+PROJECT+'/elevate/ultimate-worker:'+expectedSha,'--format=json']));
if(!task.containers[0].image.endsWith('@'+expected.image_summary.digest))throw Error('CORRECTED_WORKER_DEPLOYMENT_REQUIRED');
const token=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!token)throw Error('DATABASE_AUTH_REQUIRED');
const headers={apikey:token,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'};
async function rest(path,method='GET',body){
 const r=await fetch('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('DATABASE_HTTP_'+r.status);return r.status===204?[]:r.json();
}
const ids=['a9b85487-5465-4bc0-bed0-9fc3411c4e50'];
const builds=await rest('ultimate_course_builds?select=id,profile&id=in.(572cca43-6bd6-4a91-b385-a8b576209c4e)');
if(builds.length!==1||builds.some(b=>b.profile.lessonCompletionPolicy!=='complete-before-advance-v1'||b.profile.sourcePolicy!=='frozen-reference-v1'))throw Error('FRESH_COMPLETE_LESSON_CONTRACT_REQUIRED');
const jobs=await rest('ultimate_build_jobs?id=in.('+ids.join(',')+')');
if(jobs.length!==1)throw Error('EXACT_FRESH_JOBS_REQUIRED');
if(jobs.every(j=>j.payload?.completeLessonImage===expectedSha)){console.log(JSON.stringify({status:'fresh_courses_already_activated'}));process.exit(0);}
const otherLive=await rest('ultimate_build_jobs?select=id&status=eq.running&lease_expires_at=gt.'+encodeURIComponent(new Date().toISOString()));
if(otherLive.some(j=>!ids.includes(j.id)))throw Error('OTHER_ACTIVE_COURSE_LEASES_REQUIRE_REVIEW');
// Owner stopped all three reference jobs. Their old finite executions may
// remain alive while a provider request drains; cancellation frees those slots.
const inventory=read(['run','jobs','list']);
for(const j of inventory.filter(j=>['elevate-course-builder-parallel','elevate-course-builder-repair','elevate-course-builder-overflow'].includes(j.metadata.name))){
 for(const e of read(['run','jobs','executions','list','--job='+j.metadata.name]).filter(e=>!isTerminalExecution(e)))
  google(['run','jobs','executions','cancel',e.metadata.name,'--project='+PROJECT,'--region='+region,'--quiet']);
}
const tasks=1;
let capacity;
for(let i=0;i<12;i++){
 capacity=await inspectRegionalCapacity({region,task:{...task,containers:Array.from({length:tasks},()=>task.containers[0])}});
 if(capacity.fits)break;
 await new Promise(r=>setTimeout(r,5000));
}
console.log(JSON.stringify({kind:'capacity',...capacity}));
if(!capacity.fits)throw Error('APPROVED_REGIONAL_CAPACITY_UNAVAILABLE');
const directory=mkdtempSync(join(tmpdir(),'complete-lessons-'));
try{
 const spec=structuredClone(source.spec);spec.template.spec.taskCount=tasks;spec.template.spec.parallelism=tasks;
 const file=join(directory,'job.json');writeFileSync(file,JSON.stringify({apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name,namespace:PROJECT},spec}),{mode:0o600});
 google(['run','jobs','replace',file,'--project='+PROJECT,'--region='+region,'--quiet']);
 if(read(['run','jobs','describe',name]).spec.template.spec.template.spec.containers[0].image!==task.containers[0].image)throw Error('IMAGE_READBACK_MISMATCH');
 for(const j of jobs){
  const changed=await rest('ultimate_build_jobs?id=eq.'+j.id+'&execution_generation=eq.'+j.execution_generation,'PATCH',{
   status:'queued',execution_generation:j.execution_generation+1,attempts:0,lease_owner:null,lease_expires_at:null,available_at:new Date().toISOString(),
   payload:{...j.payload,nextCompetencyIndex:0,completeLessonImage:expectedSha},last_error:null,updated_at:new Date().toISOString()
  });
  if(changed.length!==1)throw Error('FRESH_JOB_GENERATION_CHANGED');
 }
 google(['run','jobs','execute',name,'--project='+PROJECT,'--region='+region,'--tasks=1','--async','--quiet']);
 const pending=new Set(ids);
 for(let i=0;i<90;i++){
  const rows=await rest('ultimate_build_jobs?select=id,status,lease_owner,heartbeat_at,last_error&id=in.('+ids.join(',')+')');
  for(const row of rows)if(row.status==='running'&&row.lease_owner&&row.heartbeat_at)pending.delete(row.id);
  if(!pending.size){console.log(JSON.stringify({status:'fresh_courses_claimed',jobIds:ids,region,image:task.containers[0].image}));process.exit(0);}
  await new Promise(r=>setTimeout(r,5000));
 }
 throw Error('FRESH_COURSE_CLAIMS_NOT_VERIFIED');
}finally{rmSync(directory,{recursive:true,force:true});}
