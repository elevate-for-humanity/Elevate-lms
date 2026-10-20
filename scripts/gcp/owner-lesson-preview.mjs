import {verifyOwnerReferencePhotos} from './verify-owner-reference-photos.mjs';
import {google,PROJECT} from './runtime-config.mjs';
import {resolveOwnerPreviewB2} from './resolve-owner-preview-b2.mjs';
import {inspectRegionalCapacity,isTerminalExecution} from './regional-capacity.mjs';
import {pathToFileURL} from 'node:url';

const region='us-east1',name='elevate-course-builder-repair';
const jobId='a9b85487-5465-4bc0-bed0-9fc3411c4e50';
const buildId='572cca43-6bd6-4a91-b385-a8b576209c4e';
const lessonId='45bbd784-08c2-4b13-9c6f-c00952caa70b';
const competencyId='e8df8cf3-74cf-455b-93dd-8ea6ee732cc8';
const referenceHash='6921ebb2f049e0183fa2f5cfebaa1a9a6e2a8242a672daebbdcb251ca0a96fc2';
const registry=`us-central1-docker.pkg.dev/${PROJECT}/elevate/ultimate-worker`;

export function runtimeSpec(spec){
  const copy=structuredClone(spec);
  function visit(value){
    if(!value||typeof value!=='object')return;
    if(value.labels?.['client.knative.dev/nonce']){
      delete value.labels['client.knative.dev/nonce'];
      if(!Object.keys(value.labels).length)delete value.labels;
    }
    if(value.annotations){
      for(const key of ['client.knative.dev/user-image','run.googleapis.com/client-name','run.googleapis.com/client-version'])
        delete value.annotations[key];
      if(!Object.keys(value.annotations).length)delete value.annotations;
    }
    Object.values(value).forEach(visit);
  }
  visit(copy);
  const ordered=value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'
    ?Object.fromEntries(Object.keys(value).sort().map(key=>[key,ordered(value[key])])):value;
  return ordered(copy);
}

/**
 * Return names of changed fields only; never log embedded environment values.
 * This is diagnostic evidence, not permission to ignore a runtime change.
 */
export function changedRuntimePaths(expected,actual,limit=16){
 const paths=[];
 const walk=(a,b,path)=>{
  if(paths.length>=limit)return;
  if(Object.is(a,b))return;
  if(Array.isArray(a)||Array.isArray(b)){
   if(!Array.isArray(a)||!Array.isArray(b)){paths.push(path||'(root)');return;}
   if(a.length!==b.length)paths.push((path||'(root)')+'.length');
   for(let i=0;i<Math.min(a.length,b.length);i++)walk(a[i],b[i],path+'['+i+']');
   return;
  }
  if(a&&b&&typeof a==='object'&&typeof b==='object'){
   for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
    // Only expose structural field names, never free-form keys from env or annotations.
    if(/^(env|annotations|labels)$/i.test(key)){
     if(JSON.stringify(a[key])!==JSON.stringify(b[key]))paths.push((path?path+'.':'')+key+'[redacted]');
    }else if(/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)){
     walk(a[key],b[key],(path?path+'.':'')+key);
    }else paths.push((path||'(root)')+'[redacted]');
    if(paths.length>=limit)return;
   }
   return;
  }
  paths.push(path||'(root)');
 };
 walk(expected,actual,'');
 return paths.slice(0,limit);
export function runtimeDifferencePaths(before,after,path='spec'){
  if(JSON.stringify(before)===JSON.stringify(after))return [];
  if(before&&after&&typeof before==='object'&&typeof after==='object')
    return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(key=>runtimeDifferencePaths(before[key],after[key],path+'.'+key));
  return [path];
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
  return {task,env};
}

export async function ownerLessonPreview({execute=false,sha,reuseCandidate=false,probeStorage=false,referenceCheck=verifyOwnerReferencePhotos,run=google,request=fetch,capacity=inspectRegionalCapacity}={}){
  const scope=['--project='+PROJECT,'--region='+region];
  const read=args=>JSON.parse(run([...args,...scope,'--format=json']));
  const before=read(['run','jobs','describe',name]);
  const {task,env}=previewRuntime(before);
  const {environment:b2,connectionSource}=await resolveOwnerPreviewB2(env,request);
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
  const requiredSteps=['standards_lock','learning_objectives','prerequisites','teaching_sequence','instructor_script','storyboard','visual_assignment','scene_construction','natural_narration','synchronization','active_teaching','mistakes_and_corrections','assessment_alignment'];
  const steps=await rest('ultimate_lesson_steps?select=step,state&lesson_build_id=eq.'+lessonId);
  if(!requiredSteps.every(step=>steps.some(s=>s.step===step&&s.state==='passed')))
    throw Error('OWNER_PREVIEW_SAVED_RENDER_DEPENDENCIES_REQUIRED');
  const approvedReferencePhotos=await referenceCheck({env,profile:build.profile,lessonBuildId:lessonId,competencyId,request});
  if(execute||probeStorage){
  const probePath='approved-teaching-photo-diagnostics/'+lessonId+'/owner-preview-storage-preflight.json';
  const probe={purpose:'owner-preview-storage-preflight',lessonBuildId:lessonId,source:sha};
  const probeHeaders={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'content-type':'application/json','x-upsert':'true'};
  const uploaded=await request(env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/object/course_videos/'+probePath,{method:'POST',headers:probeHeaders,body:JSON.stringify(probe),redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!uploaded.ok)throw Error('OWNER_PREVIEW_DIAGNOSTIC_UPLOAD_HTTP_'+uploaded.status);
  const checked=await request(env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/object/authenticated/course_videos/'+probePath,{headers:probeHeaders,redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!checked.ok)throw Error('OWNER_PREVIEW_DIAGNOSTIC_READBACK_FAILED');
  const proof=await checked.json();
  if(proof.purpose!==probe.purpose||proof.lessonBuildId!==lessonId||proof.source!==sha)throw Error('OWNER_PREVIEW_DIAGNOSTIC_READBACK_FAILED');
  }
  const evidence={region,job:name,jobId,lessonBuildId:lessonId,source:sha??null,
    previousImage:task.containers[0].image,identity:task.serviceAccountName,
    configuredResources:task.containers[0].resources.limits,headroom,storageProvider:'backblaze-b2',
    bucket:b2.ELEVATE_MEDIA_BUCKET,connectionSource,approvedReferencePhotos,diagnosticStorageVerified:execute||probeStorage,clientNoncePresent:JSON.stringify(before.spec).includes('client.knative.dev/nonce'),executionStarted:false,releaseHoldChanged:false};
  if(!execute)return evidence;
  if(!/^[a-f0-9]{40}$/.test(sha??''))throw Error('OWNER_PREVIEW_EXACT_SOURCE_REQUIRED');
  const imageSource=reuseCandidate?'e53f3f47508b98a479877c2e868e0402d6cb8e7e':sha;
  const digest=run(['artifacts','docker','images','describe',registry+':owner-preview-'+imageSource,'--project='+PROJECT,'--format=value(image_summary.digest)']);
  if(!/^sha256:[a-f0-9]{64}$/.test(digest))throw Error('OWNER_PREVIEW_IMMUTABLE_IMAGE_REQUIRED');
  if(reuseCandidate&&digest!=='sha256:6b3b9a642838b139fe7a9e4592cff5ba7a4e382ebb96dd32336e3f8b2ec68c3d')throw Error('OWNER_PREVIEW_TESTED_CANDIDATE_REQUIRED');
  const image=registry+'@'+digest;
  const current=read(['run','jobs','describe',name]);
  if(JSON.stringify(runtimeSpec(current.spec))!==JSON.stringify(runtimeSpec(before.spec)))throw Error('OWNER_PREVIEW_RUNTIME_CHANGED');
  if(read(['run','jobs','executions','list','--job='+name]).some(e=>!isTerminalExecution(e)))
    throw Error('OWNER_PREVIEW_EXISTING_EXECUTION_ACTIVE');
  if(task.containers[0].image!==image)run(['run','jobs','update',name,...scope,'--image='+image,'--quiet']);
  const deployed=read(['run','jobs','describe',name]);
  const expected=structuredClone(before.spec);expected.template.spec.template.spec.containers[0].image=image;
  if(JSON.stringify(runtimeSpec(deployed.spec))!==JSON.stringify(runtimeSpec(expected))){
    const differences=changedRuntimePaths(runtimeSpec(expected),runtimeSpec(deployed.spec));
    console.error(JSON.stringify({code:'OWNER_PREVIEW_IMAGE_ONLY_READBACK_FAILED',changedPaths:differences}));
    throw Error('OWNER_PREVIEW_IMAGE_ONLY_READBACK_FAILED');
  }
  const changedPaths=runtimeDifferencePaths(runtimeSpec(expected),runtimeSpec(deployed.spec));
  if(changedPaths.length){console.error(JSON.stringify({ownerPreviewReadbackChangedPaths:changedPaths.slice(0,50)}));throw Error('OWNER_PREVIEW_IMAGE_ONLY_READBACK_FAILED');}
  // No reset of attempts, generation, checkpoints, ordinary pause, or other jobs.
  const payload={...job.payload,ownerPreview:true,lessonBuildId:lessonId,competencyId,
    checkpointRepair:{lessonBuildId:lessonId,competencyId,fromStep:'lesson_film_render',requestedAt:new Date().toISOString(),requestedBy:'owner-approved-preview'}};
  const changed=await rest('ultimate_build_jobs?id=eq.'+jobId+'&status=eq.failed&execution_generation=eq.'+job.execution_generation+'&attempts=eq.'+job.attempts+'&lease_owner=is.null','PATCH',{
    payload,status:'queued',max_attempts:Math.max(job.max_attempts,job.attempts+1),
    available_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()});
  if(changed.length!==1)throw Error('OWNER_PREVIEW_JOB_CHANGED');
  // CLI values contain existing storage credentials: suppress all raw CLI output.
  run(['run','jobs','execute',name,...scope,'--tasks=1','--update-env-vars=^|^'+Object.entries(overrides).map(([k,v])=>k+'='+v).join('|'),'--async','--quiet']);
  return {...evidence,image,imageSource,executionStarted:true};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{console.log(JSON.stringify(await ownerLessonPreview({execute:process.env.OWNER_PREVIEW_EXECUTE==='true',sha:process.env.GITHUB_SHA,reuseCandidate:process.env.OWNER_PREVIEW_REUSE_CANDIDATE==='true',probeStorage:process.env.OWNER_PREVIEW_STORAGE_PROBE==='true'})));}
  catch(error){console.error(JSON.stringify({error:/^(OWNER_PREVIEW_|COURSE_B2_)[A-Z0-9_]+$/.test(error?.message??'')?error.message:'OWNER_PREVIEW_CONTROL_FAILED',code:error.code??null}));process.exitCode=1;}
}
