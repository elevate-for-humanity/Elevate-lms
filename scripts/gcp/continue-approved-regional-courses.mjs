import {monitorCourseQueue} from './paris-course-monitor.mjs';
import {google} from './runtime-config.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
import {dispatchQueuedCourseJob} from './dispatch-course-job.mjs';
import {continueCourseQueue,courseReleasePending} from './continue-course-queue.mjs';
import {pathToFileURL} from 'node:url';
import {dispatchLessonAutopilots} from './dispatch-lesson-autopilots.mjs';
// The worker queue is shared across registered course builds. Do not silently
// exclude newly started courses using a hard-coded build allowlist.
export function regionalArguments(args) {
 return args.map(arg=>arg==='--region=us-central1'?'--region=us-east1':arg==='--job=elevate-course-builder'?'--job=elevate-course-builder-parallel':arg==='elevate-course-builder'?'elevate-course-builder-parallel':arg);
}
export function scopedCourseQueueUrl(value) {
 const url=new URL(value);
 // Preserve the dispatcher eligibility query, including available_at and lease state.
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
  env:{...env,COURSE_WORKER_PARALLELISM:env.COURSE_WORKER_PARALLELISM ?? '2'},
  run:(_command,args)=>google(regionalArguments(args)),
  capacityCheck:input=>inspectRegionalCapacity({...input,region:'us-east1'}),
  request:(url,options)=>fetch(scopedCourseQueueUrl(url),options),
 }); } catch(error) {
  await monitorCourseQueue({env,dispatchState:{status:'dispatch_failed',reason:'Google worker dispatch failed: '+(error.code??'assignment_unconfirmed')}});
  throw error;
 }
 const pool=await dispatchLessonAutopilots({env});
 if(['assigned','busy','retry_wait'].includes(pool.status))return pool;
 if(state.status==='empty' && pool.status==='capacity_wait')state=pool;
 if(state.status==='capacity_wait')await monitorCourseQueue({env,dispatchState:state});
 return state;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 console.log(JSON.stringify(await continueCourseQueue({dispatch:()=>dispatchApprovedRegionalCourses(),releasePending:async()=>{
 const pending=await courseReleasePending();
 if(pending)await monitorCourseQueue({dispatchState:{status:'capacity_wait',reason:'Waiting for the verified worker deployment before resuming saved lessons'}});
 return pending;
}})));
