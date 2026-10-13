import {google} from './runtime-config.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
import {dispatchQueuedCourseJob} from './dispatch-course-job.mjs';
import {continueCourseQueue,courseReleasePending} from './continue-course-queue.mjs';
import {pathToFileURL} from 'node:url';
const builds=['078529f7-3cb3-4863-8afa-9d6bcaf167dd','d1d4ed9b-d45b-410e-8d89-53e751daa510','0f00cbcc-f79c-469d-84e8-303e2ad025cc'];
export function regionalArguments(args) {
 return args.map(arg=>arg==='--region=us-central1'?'--region=us-east1':arg==='--job=elevate-course-builder'?'--job=elevate-course-builder-parallel':arg==='elevate-course-builder'?'elevate-course-builder-parallel':arg);
}
export function scopedCourseQueueUrl(value) {
 const url=new URL(value);
 if(url.pathname.endsWith('/ultimate_build_jobs'))url.searchParams.set('build_id','in.('+builds.join(',')+')');
 return url;
}
export async function dispatchApprovedRegionalCourses({env=process.env}={}) {
 const image=(name,region)=>JSON.parse(google(['run','jobs','describe',name,'--project=elegant-racer-299721','--region='+region,'--format=json'])).spec.template.spec.template.spec.containers[0].image;
 if(image('elevate-course-builder','us-central1')!==image('elevate-course-builder-parallel','us-east1'))return {status:'capacity_wait',reason:'approved_regional_worker_refresh_required'};
 return dispatchQueuedCourseJob({
  env:{...env,COURSE_WORKER_PARALLELISM:'3'},
  run:(_command,args)=>google(regionalArguments(args)),
  capacityCheck:input=>inspectRegionalCapacity({...input,region:'us-east1'}),
  request:(url,options)=>fetch(scopedCourseQueueUrl(url),options),
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 console.log(JSON.stringify(await continueCourseQueue({dispatch:()=>dispatchApprovedRegionalCourses(),releasePending:()=>courseReleasePending()})));
