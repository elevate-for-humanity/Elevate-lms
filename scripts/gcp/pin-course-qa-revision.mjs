import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {courseWorkerBoundary} from './sync-course-worker-regions.mjs';
const service='elevate-studio-browser',region='us-central1',urlKey='ULTIMATE_LEARNER_RUNTHROUGH_URL';
const jobs=[{name:'elevate-course-builder',region},{name:'elevate-course-builder-parallel',region:'us-east1'}];
const task=job=>job.spec.template.spec.template.spec;
function variable(job,name){const rows=(task(job).containers[0].env??[]).filter(e=>e.name===name);if(rows.length!==1)throw Error('COURSE_QA_CONFIGURATION_UNVERIFIED');return rows[0];}
const traffic=s=>(s.status?.traffic??[]).filter(t=>t.percent>0).map(t=>({revision:t.revisionName,percent:t.percent})).sort((a,b)=>a.revision.localeCompare(b.revision));
/** Pin only synthetic course QA to a verified existing revision. Owner Studio
 * traffic, sessions, workspace, credentials and running executions stay intact. */
export async function pinCourseQaRevision({revision,sha,run=google,request=fetch}){
  if(!/^elevate-studio-browser-\d{5}-[a-z0-9]+$/.test(revision??'')||!/^[a-f0-9]{40}$/.test(sha??''))throw Error('EXACT_COURSE_QA_REVISION_REQUIRED');
  const read=args=>JSON.parse(run([...args,'--project='+PROJECT,'--format=json']));
  const readService=()=>read(['run','services','describe',service,'--region='+region]);
  const readJob=where=>read(['run','jobs','describe',where.name,'--region='+where.region]);
  const before=readService(),candidate=(before.status?.traffic??[]).find(t=>t.revisionName===revision&&t.tag&&t.url);
  if(!candidate||candidate.percent>0)throw Error('ISOLATED_COURSE_QA_CANDIDATE_REQUIRED');
  const resource=read(['run','revisions','describe',revision,'--region='+region]);
  const digest=run(['artifacts','docker','images','describe',`us-central1-docker.pkg.dev/${PROJECT}/elevate/studio-browser:${sha}`,'--project='+PROJECT,'--format=value(image_summary.digest)']);
  if(resource.spec?.containers?.length!==1||resource.spec?.serviceAccountName!==`elevate-studio-runtime@${PROJECT}.iam.gserviceaccount.com`||!/^sha256:[a-f0-9]{64}$/.test(digest)||resource.spec?.containers?.[0]?.image!==`us-central1-docker.pkg.dev/${PROJECT}/elevate/studio-browser@${digest}`)
    throw Error('COURSE_QA_IMAGE_MISMATCH');
  const beforeJobs=jobs.map(where=>readJob(where));
  for(const job of beforeJobs){courseWorkerBoundary(job);if(typeof variable(job,urlKey).value!=='string')throw Error('COURSE_QA_INLINE_ENDPOINT_REQUIRED');}
  const credentials=beforeJobs.map(job=>{const value=variable(job,'ULTIMATE_LEARNER_RUNTHROUGH_SECRET'),ref=value.valueFrom?.secretKeyRef;return value.value??(ref?run(['secrets','versions','access',ref.key||'latest','--secret='+ref.name,'--project='+PROJECT]):'');});
  const credential=credentials[0];
  if(credentials.some(value=>value!==credential))throw Error('COURSE_QA_CREDENTIALS_DIFFER');
  if(typeof credential!=='string'||credential.length<16)throw Error('EXISTING_COURSE_QA_CREDENTIAL_REQUIRED');
  const verify=async base=>{
    const url=new URL(base);if(url.protocol!=='https:'||!url.hostname.endsWith('.run.app')||url.username||url.password||url.port||url.search||url.hash||url.pathname!=='/')throw Error('GOOGLE_COURSE_QA_ENDPOINT_REQUIRED');
    const get=path=>request(new URL(path,url),{redirect:'error',signal:AbortSignal.timeout(20000)});
    const healthResponse=await get('/health'),health=await healthResponse.json();
    if(!healthResponse.ok||!health.ready||health.commit!==sha||health.providerAuthStorage?.persistent!==true)throw Error('COURSE_QA_REVISION_NOT_READY');
    const anonymous=await get('/learner/health');await anonymous.body?.cancel();
    if(anonymous.status!==401)throw Error('COURSE_QA_ANONYMOUS_ACCESS_ALLOWED');
    const auth=await request(new URL('/learner/health',url),{headers:{Authorization:'Bearer '+credential},redirect:'error',signal:AbortSignal.timeout(20000)}),body=await auth.json();
    if(!auth.ok||!body.ready||body.commit!==sha)throw Error('COURSE_QA_EXISTING_CREDENTIAL_REJECTED');
  };
  await verify(candidate.url);
  const tag='course-qa-'+sha.slice(0,12),oldTag=before.status.traffic.find(t=>t.tag===tag);
  if(oldTag&&oldTag.revisionName!==revision)throw Error('COURSE_QA_TAG_CONFLICT');
  if(!isDeepStrictEqual(readService().status.traffic,before.status.traffic)||beforeJobs.some((job,i)=>!isDeepStrictEqual(readJob(jobs[i]).spec,job.spec)))throw Error('COURSE_QA_CONFIGURATION_CHANGED');
  if(!oldTag)run(['run','services','update-traffic',service,'--region='+region,'--project='+PROJECT,'--update-tags='+tag+'='+revision,'--quiet']);
  const pinned=readService(),entry=pinned.status.traffic.find(t=>t.tag===tag&&t.revisionName===revision);
  if(!isDeepStrictEqual(traffic(pinned),traffic(before))||before.status.traffic.some(t=>t.tag&&!pinned.status.traffic.some(p=>p.tag===t.tag&&p.revisionName===t.revisionName))||!entry?.url)throw Error('OWNER_STUDIO_TRAFFIC_READBACK_FAILED');
  await verify(entry.url);
  const endpoint=new URL('/learner/runthrough',entry.url).href,changed=[];
  try{
    for(let i=0;i<jobs.length;i++){
      const where=jobs[i],prior=beforeJobs[i];
      if(!isDeepStrictEqual(readJob(where).spec,prior.spec))throw Error('COURSE_QA_JOB_CHANGED');
      if(variable(prior,urlKey).value===endpoint)continue;
      run(['run','jobs','update',where.name,'--region='+where.region,'--project='+PROJECT,'--update-env-vars='+urlKey+'='+endpoint,'--quiet']);changed.push(i);
      const expected=structuredClone(prior);const value=variable(expected,urlKey);value.value=endpoint;delete value.valueFrom;
      if(!isDeepStrictEqual(readJob(where).spec,expected.spec))throw Error('COURSE_QA_JOB_READBACK_FAILED');
    }
    if(!isDeepStrictEqual(traffic(readService()),traffic(before)))throw Error('OWNER_STUDIO_TRAFFIC_CHANGED');
  }catch(error){
    let rollbackFailed=false;
    for(const i of changed.reverse()){try{
      const current=readJob(jobs[i]);if(variable(current,urlKey).value!==endpoint){rollbackFailed=true;continue;}
      const previous=variable(beforeJobs[i],urlKey);
      run(['run','jobs','update',jobs[i].name,'--region='+jobs[i].region,'--project='+PROJECT,'--update-env-vars='+urlKey+'='+previous.value,'--quiet']);
      if(!isDeepStrictEqual(readJob(jobs[i]).spec,beforeJobs[i].spec))rollbackFailed=true;
    }catch{rollbackFailed=true;}}
    if(rollbackFailed)throw Error('COURSE_QA_ROLLBACK_UNVERIFIED');
    throw error;
  }
  return {revision,commit:sha,endpoint,learnerAuthenticationVerified:true,ownerTrafficPreserved:true,runningExecutionsPreserved:true,jobTemplatesUpdated:changed.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  pinCourseQaRevision({revision:process.env.QA_BROWSER_REVISION,sha:process.env.QA_BROWSER_IMAGE_SHA}).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.code??e.message);process.exitCode=1;});
}
