import { pathToFileURL } from 'node:url';
import { google } from './runtime-config.mjs';
import { assertNoActiveExecutions } from './execute-course-job.mjs';

const pinned=/^us-central1-docker\.pkg\.dev\/elegant-racer-299721\/elevate\/ultimate-worker@sha256:[a-f0-9]{64}$/;
function active(execution) {
  try { assertNoActiveExecutions([execution]); return false; }
  catch(error) { if(error.message==='COURSE_JOB_ALREADY_ACTIVE')return true;throw error; }
}
/** Cancellation only. Never updates a job template, lease, attempt or checkpoint. */
export async function recoverExactCourseExecution({name,run=google,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=60}={}) {
  if(!/^elevate-course-builder-[a-z0-9]+$/.test(name || ''))throw Error('EXACT_EXECUTION_REQUIRED');
  const scope=['--project=elegant-racer-299721','--region=us-central1','--format=json'];
  const describe=()=>JSON.parse(run(['run','jobs','executions','describe',name,...scope]));
  const template=JSON.parse(run(['run','jobs','describe','elevate-course-builder',...scope]));
  const templateImage=template.spec?.template?.spec?.template?.spec?.containers?.[0]?.image;
  if(!pinned.test(templateImage || ''))throw Error('GOOGLE_WORKER_TEMPLATE_NOT_PINNED');
  const execution=describe();
  const executionImage=execution.spec?.template?.spec?.containers?.[0]?.image;
  if(!pinned.test(executionImage || ''))throw Error('GOOGLE_EXECUTION_IMAGE_NOT_PINNED');
  const evidence={execution:name,executionImage,templateImage,imageMatches:executionImage===templateImage,checkpointsRetained:true};
  // Historical executions legitimately retain their original image. A terminal
  // execution needs no cancellation and cannot block a newer approved job.
  if(!active(execution))return {...evidence,state:'already_terminal',cancellationRequested:false};
  if(!evidence.imageMatches)throw Error('EXECUTION_IMAGE_MISMATCH');
  const current=describe();
  if(current.spec?.template?.spec?.containers?.[0]?.image!==templateImage)throw Error('EXECUTION_IMAGE_MISMATCH');
  if(!active(current))return {...evidence,state:'already_terminal',cancellationRequested:false};
  const currentTemplate=JSON.parse(run(['run','jobs','describe','elevate-course-builder',...scope]));
  if(currentTemplate.spec?.template?.spec?.template?.spec?.containers?.[0]?.image!==templateImage)
    throw Error('GOOGLE_WORKER_TEMPLATE_CHANGED');
  run(['run','jobs','executions','cancel',name,'--project=elegant-racer-299721','--region=us-central1','--quiet']);
  for(let attempt=0;attempt<attempts;attempt++) {
    if(!active(describe()))return {...evidence,state:'terminal',cancellationRequested:true};
    await delay(5000);
  }
  throw Error('EXECUTION_STOP_NOT_CONFIRMED');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  recoverExactCourseExecution({name:process.env.COURSE_EXECUTION}).then(result=>console.log(JSON.stringify(result))).catch(error=>{
    console.error(JSON.stringify({error:/^[A-Z_]+$/.test(error.message)?error.message:'EXACT_EXECUTION_RECOVERY_FAILED',checkpointsRetained:true}));process.exitCode=1;
  });
}
