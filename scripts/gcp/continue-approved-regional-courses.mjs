import {monitorCourseQueue} from './paris-course-monitor.mjs';
import {google} from './runtime-config.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
import {dispatchQueuedCourseJob} from './dispatch-course-job.mjs';
import {continueCourseQueue,courseReleasePending} from './continue-course-queue.mjs';
import {pathToFileURL} from 'node:url';
const builds=["d535e31f-10e6-43dd-b60a-e7e5538d764a","b400834e-15e3-4ef0-ae20-33cd9f82e950","572cca43-6bd6-4a91-b385-a8b576209c4e"];
export function regionalArguments(args) {
 return args.map(arg=>arg==='--region=us-central1'?'--region=us-east1':arg==='--job=elevate-course-builder'?'--job=elevate-course-builder-parallel':arg==='elevate-course-builder'?'elevate-course-builder-parallel':arg);
}
export function scopedCourseQueueUrl(value) {
 const url=new URL(value);
 if(url.pathname.endsWith('/ultimate_build_jobs'))url.searchParams.set('and','(or(build_id.in.('+builds.join(',')+'),payload->>requestedBy.not.is.null))');
 return url;
}
export async function dispatchApprovedRegionalCourses({env=process.env}={}) {
 await monitorCourseQueue({env});
 const image=(name,region)=>JSON.parse(google(['run','jobs','describe',name,'--project=elegant-racer-299721','--region='+region,'--format=json'])).spec.template.spec.template.spec.containers[0].image;
 if(image('elevate-course-builder','us-central1')!==image('elevate-course-builder-parallel','us-east1')){
  const state={status:'capacity_wait',reason:'approved_regional_worker_refresh_required'};
  await monitorCourseQueue({env,dispatchState:state});return state;
 }
 let state;
 try { state=await dispatchQueuedCourseJob({
  env:{...env,COURSE_WORKER_PARALLELISM:'3'},
  run:(_command,args)=>google(regionalArguments(args)),
  capacityCheck:input=>inspectRegionalCapacity({...input,region:'us-east1'}),
  request:(url,options)=>fetch(scopedCourseQueueUrl(url),options),
 }); } catch(error) {
  await monitorCourseQueue({env,dispatchState:{status:'dispatch_failed',reason:'Google worker dispatch failed: '+(error.code??'assignment_unconfirmed')}});
  throw error;
 }
 if(state.status==='capacity_wait')await monitorCourseQueue({env,dispatchState:state});
 return state;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 console.log(JSON.stringify(await continueCourseQueue({dispatch:()=>dispatchApprovedRegionalCourses(),releasePending:async()=>{
 const pending=await courseReleasePending();
 if(pending)await monitorCourseQueue({dispatchState:{status:'capacity_wait',reason:'Waiting for the verified worker deployment before resuming saved lessons'}});
 return pending;
}})));
