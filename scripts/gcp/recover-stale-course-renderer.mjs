import {google,PROJECT} from './runtime-config.mjs';
import {pathToFileURL} from 'node:url';

/** One-time, fenced transition of the diagnosed old-image execution. Database
 * ownership is never overridden: its existing lease expires before recovery. */
export async function recoverStaleCourseRenderer({run=google,request=fetch,env=process.env}={}) {
  if(env.GITHUB_REPOSITORY!=='elevate-for-humanity/Elevate-lms'||!env.SUPABASE_SERVICE_ROLE_KEY||!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA??''))
    throw Error('RENDER_RECOVERY_AUTHORITY_REQUIRED');
  const target=env.RENDER_RECOVERY_JOB_ID,generation=Number(env.RENDER_RECOVERY_GENERATION);
  if(!/^[a-f0-9-]{36}$/.test(target??'')||!Number.isSafeInteger(generation)||generation<1)
    throw Error('EXPLICIT_RENDER_RECOVERY_TARGET_REQUIRED');
  const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY};
  const readQueue=async()=>{
    const response=await request('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs?status=eq.running&select=id,execution_generation,lease_owner&limit=2',{headers,signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('RENDER_RECOVERY_QUEUE_HTTP_'+response.status);
    const rows=await response.json();if(!Array.isArray(rows))throw Error('RENDER_RECOVERY_QUEUE_INVALID');
    return rows.length===1&&rows[0].id===target&&rows[0].execution_generation===generation&&rows[0].lease_owner?rows[0]:null;
  };
  const before=await readQueue();if(!before)return {state:'target_no_longer_exclusively_active'};
  const repository='us-central1-docker.pkg.dev/'+PROJECT+'/elevate/ultimate-worker';
  let artifact;
  try{artifact=JSON.parse(run(['artifacts','docker','images','describe',repository+':'+env.GITHUB_SHA,'--project='+PROJECT,'--format=json']));}
  catch(error){if(error.code==='not_found')return {state:'awaiting_corrected_worker_image'};throw error;}
  const digest=artifact.image_summary?.digest;
  if(!/^sha256:[a-f0-9]{64}$/.test(digest??''))throw Error('RENDER_RECOVERY_IMAGE_DIGEST_REQUIRED');
  const expected=repository+'@'+digest,active=[];
  for(const [job,region] of [['elevate-course-builder','us-central1'],['elevate-course-builder-parallel','us-east1']]){
    const scope=['--project='+PROJECT,'--region='+region,'--format=json'];
    const config=JSON.parse(run(['run','jobs','describe',job,...scope]));
    const task=config.spec?.template?.spec?.template?.spec;
    if(task?.containers?.[0]?.image!==expected)return {state:'awaiting_corrected_regional_image'};
    if(task.serviceAccountName!==`elevate-worker-runtime@${PROJECT}.iam.gserviceaccount.com`)throw Error('RENDER_RECOVERY_WORKER_IDENTITY_MISMATCH');
    const executions=JSON.parse(run(['run','jobs','executions','list','--job='+job,...scope]));
    if(!Array.isArray(executions))throw Error('RENDER_RECOVERY_EXECUTIONS_INVALID');
    for(const execution of executions){
      const condition=execution.status?.conditions?.find(x=>x.type==='Completed');
      if(!execution.status?.completionTime&&!['True','False'].includes(condition?.status))active.push({execution,region,job});
    }
  }
  if(active.length!==1)return {state:'execution_not_exclusively_identified'};
  const {execution,region,job}=active[0],image=execution.spec?.template?.spec?.containers?.[0]?.image;
  if(!image)throw Error('RENDER_RECOVERY_EXECUTION_IMAGE_REQUIRED');
  if(image===expected)return {state:'corrected_execution_already_active'};
  const name=execution.metadata?.name;
  if(typeof name!=='string'||!name.startsWith(job+'-')||!/^[a-z0-9-]+$/.test(name))throw Error('RENDER_RECOVERY_EXECUTION_NAME_INVALID');
  const current=await readQueue();
  if(!current||current.lease_owner!==before.lease_owner)return {state:'target_advanced_before_transition'};
  run(['run','jobs','executions','cancel',name,'--project='+PROJECT,'--region='+region,'--quiet']);
  return {state:'old_image_cancellation_requested',jobId:target,execution:name,
    recovery:'Existing PARIS coordinator waits for lease expiry and claims saved checkpoints; attempts are not reset.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await recoverStaleCourseRenderer()));}
 catch(error){console.error(JSON.stringify({recovered:false,reason:error.code??error.message}));process.exitCode=1;}
}
