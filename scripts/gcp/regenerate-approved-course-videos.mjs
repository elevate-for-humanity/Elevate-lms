import {createHash,randomUUID} from 'node:crypto';
import {google,PROJECT} from './runtime-config.mjs';
const token=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!token)throw Error('DATABASE_AUTH_REQUIRED');
const base='https://cuxzzpsyufcewtmicszk.supabase.co';
const headers={apikey:token,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'};
async function rest(path,method='GET',body) {
 const r=await fetch(base+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('DATABASE_HTTP_'+r.status+':'+path.split('?')[0]);
 return r.status===204?[]:r.json();
}
const courses=['2c723bfa-8c40-4acc-b961-98d917710ffc','9ca9fb50-7119-46ea-ab81-9b0193c29c31','0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'];
const version='owner-approved-video-2026-10-12.2',assetId='9ae74de2-2fd2-45df-9c54-59c9e3c5c07c';
const storagePath=courses[0]+'/1791848294710-Barber_LMS_Sample.mp4';
const ref=await rest('course_videos?id=eq.'+assetId+'&select=id,status,asset_role,storage_path');
if(ref.length!==1||ref[0].status!=='ready'||ref[0].asset_role!=='reference'||ref[0].storage_path!==storagePath)throw Error('REFERENCE_NOT_READY');
const video=await fetch(base+'/storage/v1/object/authenticated/course_videos/'+storagePath,{headers,signal:AbortSignal.timeout(60000)});
if(!video.ok)throw Error('REFERENCE_DOWNLOAD_FAILED');
const bytes=Buffer.from(await video.arrayBuffer());
if(!bytes.length)throw Error('REFERENCE_EMPTY');
const sha256=createHash('sha256').update(bytes).digest('hex');
const scope=['--project='+PROJECT,'--region=us-central1'];
const worker=JSON.parse(google(['run','jobs','describe','elevate-course-builder',...scope,'--format=json']));
const currentImage=worker.spec.template.spec.template.spec.containers[0].image;
const image=JSON.parse(google(['artifacts','docker','images','describe','us-central1-docker.pkg.dev/'+PROJECT+'/elevate/ultimate-worker:0c9a37369d846d43b1eb7e5ff167a117442119e5','--format=json']));
if(!currentImage.endsWith('@'+image.image_summary.digest))throw Error('NEW_REFERENCE_WORKER_NOT_DEPLOYED');
const planned=[];
for(const courseId of courses) {
 const previous=await rest('ultimate_course_builds?course_id=eq.'+courseId+'&order=created_at.desc&limit=1');
 if(!previous.length)throw Error('SOURCE_BUILD_REQUIRED');
 const existing=await rest('ultimate_course_builds?course_id=eq.'+courseId+'&profile->>referenceRegeneration=eq.'+version+'&order=created_at.desc&limit=1');
 let build=existing[0];
 if(!build){
  const profile={...previous[0].profile,referenceRegeneration:version};
  delete profile.lessonBlueprints;
  delete profile.presentationContract;
  build=(await rest('ultimate_course_builds','POST',{id:randomUUID(),course_id:courseId,profile,status:'initializing',current_step:'standards_lock',findings:[]}))[0];
 }
 planned.push({courseId,build});
}
// Fence previous workers before they can write or release old-reference artifacts.
for(const {courseId,build} of planned){
 const old=await rest('ultimate_course_builds?course_id=eq.'+courseId+'&id=neq.'+build.id+'&status=in.(initializing,queued,running,blocked,built_with_findings)');
 for(const b of old){
  const jobs=await rest('ultimate_build_jobs?build_id=eq.'+b.id+'&status=in.(queued,running)');
  for(const j of jobs)await rest('ultimate_build_jobs?id=eq.'+j.id+'&execution_generation=eq.'+j.execution_generation,'PATCH',{status:'failed',execution_generation:j.execution_generation+1,lease_owner:null,lease_expires_at:null,pending_dependency_resume:null,last_error:'Superseded by owner-approved reference regeneration '+version,updated_at:new Date().toISOString()});
  await rest('ultimate_course_builds?id=eq.'+b.id,'PATCH',{status:'archived',updated_at:new Date().toISOString()});
 }
 const course=(await rest('courses?id=eq.'+courseId+'&select=id,metadata'))[0];
 const brief={...(course.metadata?.approved_lesson_reference??{}),version,applicationStatus:'regeneration_queued',sample:{assetId,bucket:'course_videos',storagePath,sha256,note:'Verified ready owner-approved reference; presentation reference only.'}};
 await rest('courses?id=eq.'+courseId,'PATCH',{metadata:{...course.metadata,approved_lesson_reference:brief},generation_status:'generating',updated_at:new Date().toISOString()});
 const active=await rest('ultimate_build_jobs?build_id=eq.'+build.id+'&status=in.(queued,running)');
 if(!active.length)await rest('ultimate_build_jobs','POST',{build_id:build.id,job_type:'course_build',status:'queued',max_attempts:5,payload:{referenceRegeneration:version}});
 await rest('ultimate_course_builds?id=eq.'+build.id+'&status=eq.initializing','PATCH',{status:'queued',updated_at:new Date().toISOString()});
 console.log(JSON.stringify({courseId,buildId:build.id,referenceAssetId:assetId,referenceSha256:sha256,status:'queued'}));
}
// Previous executions contain only the now-fenced source builds. Cancel to free quota.
for(const [region,name] of [['us-central1','elevate-course-builder'],['us-east1','elevate-course-builder-parallel']]){
 const executions=JSON.parse(google(['run','jobs','executions','list','--job='+name,'--project='+PROJECT,'--region='+region,'--format=json']));
 for(const e of executions){
  const done=e.status?.conditions?.find(c=>c.type==='Completed');
  if(!e.status?.completionTime&&!['True','False'].includes(done?.status))
   google(['run','jobs','executions','cancel',e.metadata.name,'--project='+PROJECT,'--region='+region,'--quiet']);
 }
}
console.log(JSON.stringify({regenerationPrepared:true,courses:planned.length,verifiedReferenceBytes:bytes.length}));
