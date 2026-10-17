import {google,PROJECT} from './runtime-config.mjs';
import {courseB2Environment} from './deploy-course-job.mjs';
import {inspectRegionalCapacity,isTerminalExecution} from './regional-capacity.mjs';
import {pathToFileURL} from 'node:url';

const region='us-east1',name='elevate-course-builder-repair';
const jobId='a9b85487-5465-4bc0-bed0-9fc3411c4e50';
const buildId='572cca43-6bd6-4a91-b385-a8b576209c4e';
const lessonId='45bbd784-08c2-4b13-9c6f-c00952caa70b';
const competencyId='e8df8cf3-74cf-455b-93dd-8ea6ee732cc8';
const referenceHash='6921ebb2f049e0183fa2f5cfebaa1a9a6e2a8242a672daebbdcb251ca0a96fc2';
const registry=`us-central1-docker.pkg.dev/${PROJECT}/elevate/ultimate-worker`;

function runtimeSpec(spec){
  const copy=structuredClone(spec);
  function visit(value){
    if(!value||typeof value!=='object')return;
    if(value.annotations){
      for(const key of ['client.knative.dev/user-image','run.googleapis.com/client-name','run.googleapis.com/client-version'])
        delete value.annotations[key];
      if(!Object.keys(value.annotations).length)delete value.annotations;
    }
    Object.values(value).forEach(visit);
  }
  visit(copy);return copy;
}

export function previewRuntime(job){
  const task=job.spec?.template?.spec?.template?.spec,container=task?.containers?.[0];
  if(task?.containers?.length!==1 || task.serviceAccountName!==`elevate-worker-runtime@${PROJECT}.iam.gserviceaccount.com`)
    throw Error('OWNER_PREVIEW_EXISTING_IDENTITY_REQUIRED');
  if(container.resources?.limits?.cpu!=='4'||container.resources?.limits?.memory!=='8Gi')
    throw Error('OWNER_PREVIEW_EXISTING_RESOURCES_CHANGED');
  const required=(container.env??[]).filter(e=>/^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|ELEVATE_MEDIA_|S3_)/.test(e.name));
  if(required.some(e=>e.valueFrom))throw Error('OWNER_PREVIEW_INLINE_CONNECTION_UNAVAILABLE');
  const env=Object.fromEntries(required.map(e=>[e.name,e.value]));
  if(env.NEXT_PUBLIC_SUPABASE_URL!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)
    throw Error('OWNER_PREVIEW_EXISTING_DATABASE_REQUIRED');
  const b2=courseB2Environment(env);
  if(b2.ELEVATE_MEDIA_BUCKET!=='elevate-course-media')throw Error('OWNER_PREVIEW_APPROVED_BUCKET_REQUIRED');
  return {task,env,b2};
}

export async function ownerLessonPreview({execute=false,sha,run=google,request=fetch,capacity=inspectRegionalCapacity}={}){
  const scope=['--project='+PROJECT,'--region='+region];
  const read=args=>JSON.parse(run([...args,...scope,'--format=json']));
  const before=read(['run','jobs','describe',name]);
  const {task,env,b2}=previewRuntime(before);
  const overrides={ULTIMATE_OWNER_PREVIEW_JOB_ID:jobId,ULTIMATE_WORKER_ONCE:'true',...b2};
  if(Object.values(overrides).some(v=>/[|\r\n]/.test(v)))throw Error('OWNER_PREVIEW_OVERRIDE_VALUE_INVALID');
  if(read(['run','jobs','executions','list','--job='+name]).some(e=>!isTerminalExecution(e)))
    throw Error('OWNER_PREVIEW_EXISTING_EXECUTION_ACTIVE');
  const headroom=await capacity({region,task,taskCount:1,run,request});
  if(!headroom.fits)throw Error('OWNER_PREVIEW_CAPACITY_UNAVAILABLE');
  async function rest(path,method='GET',body){
    const response=await request(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/'+path,{
      method,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,
        'content-type':'application/json',Prefer:'return=representation'},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000),redirect:'error'});
    if(!response.ok)throw Error('OWNER_PREVIEW_DATABASE_HTTP_'+response.status);
    return response.json();
  }
  const [job]=await rest('ultimate_build_jobs?id=eq.'+jobId);
  const [build]=await rest('ultimate_course_builds?select=id,profile&id=eq.'+buildId);
  if(!job||job.build_id!==buildId||job.status!=='failed'||job.lease_owner||job.lease_expires_at)
    throw Error('OWNER_PREVIEW_JOB_NOT_INACTIVE');
  if(build?.profile?.lessonPresentation!=='approved-premium-v1'||
      build.profile.presentationContract?.approvedReferenceVideo?.sha256!==referenceHash)
    throw Error('OWNER_PREVIEW_APPROVED_FIRST_LESSON_REQUIRED');
  const evidence={region,job:name,jobId,lessonBuildId:lessonId,source:sha??null,
    previousImage:task.containers[0].image,identity:task.serviceAccountName,
    configuredResources:task.containers[0].resources.limits,headroom,storageProvider:'backblaze-b2',
    bucket:b2.ELEVATE_MEDIA_BUCKET,executionStarted:false,releaseHoldChanged:false};
  if(!execute)return evidence;
  if(!/^[a-f0-9]{40}$/.test(sha??''))throw Error('OWNER_PREVIEW_EXACT_SOURCE_REQUIRED');
  const digest=run(['artifacts','docker','images','describe',registry+':owner-preview-'+sha,'--project='+PROJECT,'--format=value(image_summary.digest)']);
  if(!/^sha256:[a-f0-9]{64}$/.test(digest))throw Error('OWNER_PREVIEW_IMMUTABLE_IMAGE_REQUIRED');
  const image=registry+'@'+digest;
  const current=read(['run','jobs','describe',name]);
  if(JSON.stringify(runtimeSpec(current.spec))!==JSON.stringify(runtimeSpec(before.spec)))throw Error('OWNER_PREVIEW_RUNTIME_CHANGED');
  if(read(['run','jobs','executions','list','--job='+name]).some(e=>!isTerminalExecution(e)))
    throw Error('OWNER_PREVIEW_EXISTING_EXECUTION_ACTIVE');
  run(['run','jobs','update',name,...scope,'--image='+image,'--quiet']);
  const deployed=read(['run','jobs','describe',name]);
  const expected=structuredClone(before.spec);expected.template.spec.template.spec.containers[0].image=image;
  if(JSON.stringify(runtimeSpec(deployed.spec))!==JSON.stringify(runtimeSpec(expected)))throw Error('OWNER_PREVIEW_IMAGE_ONLY_READBACK_FAILED');
  // No reset of attempts, generation, checkpoints, ordinary pause, or other jobs.
  const payload={...job.payload,ownerPreview:true,lessonBuildId:lessonId,competencyId,
    checkpointRepair:{lessonBuildId:lessonId,competencyId,fromStep:'teaching_sequence',requestedAt:new Date().toISOString(),requestedBy:'owner-approved-preview'}};
  const changed=await rest('ultimate_build_jobs?id=eq.'+jobId+'&status=eq.failed&execution_generation=eq.'+job.execution_generation+'&attempts=eq.'+job.attempts+'&lease_owner=is.null','PATCH',{
    payload,status:'queued',max_attempts:Math.max(job.max_attempts,job.attempts+1),
    available_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()});
  if(changed.length!==1)throw Error('OWNER_PREVIEW_JOB_CHANGED');
  // CLI values contain existing storage credentials: suppress all raw CLI output.
  run(['run','jobs','execute',name,...scope,'--tasks=1','--update-env-vars=^|^'+Object.entries(overrides).map(([k,v])=>k+'='+v).join('|'),'--async','--quiet']);
  return {...evidence,image,executionStarted:true};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{console.log(JSON.stringify(await ownerLessonPreview({execute:process.env.OWNER_PREVIEW_EXECUTE==='true',sha:process.env.GITHUB_SHA})));}
  catch(error){console.error(JSON.stringify({error:/^(OWNER_PREVIEW_|COURSE_B2_)[A-Z0-9_]+$/.test(error?.message??'')?error.message:'OWNER_PREVIEW_CONTROL_FAILED',code:error.code??null}));process.exitCode=1;}
}
