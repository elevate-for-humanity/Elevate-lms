import {pathToFileURL} from 'node:url';
const COURSE='a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
const ROOT='https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs';
export async function resumeRepairedCourseJobs({imageSha,imageDigest,env=process.env,request=fetch,now=new Date()}={}) {
 if(!/^[a-f0-9]{40}$/.test(imageSha??'')||!/^sha256:[a-f0-9]{64}$/.test(imageDigest??''))throw Error('VERIFIED_REPAIR_IMAGE_REQUIRED');
 const token=env.SUPABASE_SERVICE_ROLE_KEY;if(!token)throw Error('DATABASE_AUTH_REQUIRED');
 const headers={apikey:token,Authorization:'Bearer '+token};
 const url=new URL(ROOT);
 url.searchParams.set('select','id,status,execution_generation,lease_expires_at,last_error,monitor,build:ultimate_course_builds!inner(course_id,status,profile)');
 url.searchParams.set('status','eq.failed');url.searchParams.set('build.course_id','eq.'+COURSE);
 const response=await request(url,{headers,signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('REPAIR_RESUME_READ_HTTP_'+response.status);
 const jobs=await response.json();if(!Array.isArray(jobs))throw Error('REPAIR_RESUME_INVENTORY_INVALID');
 const resumed=[];
 for(const job of jobs){
  if(job.status!=='failed'||job.build?.course_id!==COURSE||job.build?.profile?.ownerPaused===true||
   ['published','archived','cancelled'].includes(job.build?.status)||job.monitor?.enabled!==true||
   job.monitor?.lastRepairDeployment?.imageSha===imageSha||
   (job.lease_expires_at && !(Date.parse(job.lease_expires_at)<=now.getTime()))||
   !Number.isSafeInteger(job.execution_generation))continue;
  const error=String(job.last_error??'');
  // New tested code can recover internal defects. Missing evidence, permissions,
  // storage quota and intentional pauses still need their real remedy.
  if(!error.startsWith('ULTIMATE_INTERNAL_REPAIR_REQUIRED:')||
   /OWNER_|AUTHORIZ|LICENSE|SOURCE_GAP|DEPENDENCIES|storage cap exceeded|COURSE_OBJECT_STORAGE|HTTP (401|403)/i.test(error))continue;
  const target=new URL(ROOT);target.searchParams.set('id','eq.'+job.id);
  target.searchParams.set('status','eq.failed');
  target.searchParams.set('execution_generation','eq.'+job.execution_generation);
  target.searchParams.set('or','(lease_expires_at.is.null,lease_expires_at.lte.'+now.toISOString()+')');
  target.searchParams.set('monitor',job.monitor==null?'is.null':'eq.'+JSON.stringify(job.monitor));
  const body={status:'queued',attempts:0,execution_generation:job.execution_generation+1,
   lease_owner:null,lease_expires_at:null,last_error:null,available_at:now.toISOString(),updated_at:now.toISOString(),
   monitor:{...job.monitor,lastRepairDeployment:{imageSha,imageDigest,at:now.toISOString(),previousError:error}}};
  const changed=await request(target,{method:'PATCH',headers:{...headers,'Content-Type':'application/json',Prefer:'return=representation'},
   body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!changed.ok)throw Error('REPAIR_RESUME_WRITE_HTTP_'+changed.status);
  const saved=await changed.json();if(!Array.isArray(saved))throw Error('REPAIR_RESUME_READBACK_INVALID');
  if(saved.length===1&&saved[0].id===job.id&&saved[0].status==='queued'&&saved[0].execution_generation===job.execution_generation+1)resumed.push(job.id);
  else if(saved.length)throw Error('REPAIR_RESUME_READBACK_INVALID');
 }
 return {status:'repair_resume_checked',jobIds:resumed};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {google,PROJECT}=await import('./runtime-config.mjs');
 const sha=process.env.IMAGE_SHA;
 if(!/^[a-f0-9]{40}$/.test(sha??''))throw Error('VERIFIED_REPAIR_IMAGE_REQUIRED');
 const image='us-central1-docker.pkg.dev/'+PROJECT+'/elevate/ultimate-worker';
 const digest=google(['artifacts','docker','images','describe',image+':'+sha,'--project='+PROJECT,'--format=value(image_summary.digest)']).trim();
 for(const [name,region]of [['elevate-course-builder','us-central1'],['elevate-course-builder-parallel','us-east1']]){
  const job=JSON.parse(google(['run','jobs','describe',name,'--project='+PROJECT,'--region='+region,'--format=json']));
  if(job.spec?.template?.spec?.template?.spec?.containers?.[0]?.image!==image+'@'+digest)throw Error('REPAIR_IMAGE_READBACK_MISMATCH');
 }
 console.log(JSON.stringify(await resumeRepairedCourseJobs({imageSha:sha,imageDigest:digest})));
}
