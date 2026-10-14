import {google,PROJECT} from './runtime-config.mjs';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
const source={name:'elevate-course-builder',region:'us-central1'};
const target={name:'elevate-course-builder-parallel',region:'us-east1'};
const taskOf=job=>job?.spec?.template?.spec?.template?.spec;
function boundary(job){
 const envelope=job?.spec?.template?.spec,task=taskOf(job);
 if(!task||task.containers?.length!==1||task.serviceAccountName!==`elevate-worker-runtime@${PROJECT}.iam.gserviceaccount.com`)
  throw Error('APPROVED_COURSE_WORKER_IDENTITY_REQUIRED');
 const {image,...container}=task.containers[0];
 if(!new RegExp('^us-central1-docker.pkg.dev/'+PROJECT+'/elevate/ultimate-worker@sha256:[a-f0-9]{64}$').test(image??''))
  throw Error('IMMUTABLE_APPROVED_WORKER_IMAGE_REQUIRED');
 return {image,contract:{taskCount:envelope.taskCount,parallelism:envelope.parallelism,...task,containers:[container]}};
}
/** Update only the image on the already approved regional worker. Existing
 * executions, resource limits, environment, identity and leases are preserved. */
export function syncCourseWorkerRegions(run=google){
 const read=where=>JSON.parse(run(['run','jobs','describe',where.name,'--project='+PROJECT,'--region='+where.region,'--format=json']));
 const origin=boundary(read(source)),before=boundary(read(target));
 if(before.image===origin.image)return {changed:false,region:target.region,imageVerified:true};
 run(['run','jobs','update',target.name,'--project='+PROJECT,'--region='+target.region,'--image='+origin.image,'--quiet']);
 const after=boundary(read(target));
 if(after.image!==origin.image||!isDeepStrictEqual(before.contract,after.contract))
  throw Error('REGIONAL_WORKER_IMAGE_ONLY_READBACK_FAILED');
 return {changed:true,region:target.region,imageVerified:true,configurationPreserved:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(syncCourseWorkerRegions()));}
 catch(error){console.error(JSON.stringify({synced:false,reason:error.code??error.message}));process.exitCode=1;}
}
