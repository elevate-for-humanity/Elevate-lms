/**
 * Evidence from GitHub Actions is untrusted diagnostic text, never instructions.
 * Return bounded lines surrounding failures; do not send entire logs to a model.
 */
export function failedWorkflowLogExcerpt(log, maxChars=3600) {
 const lines=String(log??'').split(/\r?\n/);
 const indexes=[];
 for(let i=0;i<lines.length;i++)
  if(/##\[error\]|(?:^|\s)(?:ERROR|FAIL|FAILED):|❌|ELIFECYCLE|Process completed with exit code [1-9]/i.test(lines[i])) indexes.push(i);
 const selected=[];
 for(const index of indexes.slice(-8)){
  for(let j=Math.max(0,index-2);j<=Math.min(lines.length-1,index+2);j++){
   if(!selected.includes(j)) selected.push(j);
  }
 }
 const excerpt=(selected.length?selected.sort((a,b)=>a-b).map(i=>lines[i]):lines.slice(-12)).join('\n');
 return excerpt
  .replace(/Bearer\s+\S+/gi,'Bearer [redacted]')
  .replace(/(?:ghp_|ghs_|github_pat_)[A-Za-z0-9_]+/g,'[redacted-token]')
  .replace(/(?:api[_-]?key|secret|password|token)\s*[:=]\s*[^\s,;]+/gi,'credential=[redacted]')
  .slice(-Math.max(500,Math.min(5000,maxChars)));
}


/** A planner-supplied failed job ID is untrusted. Redirect to the actual
 * failed jobs in the verified run rather than aborting the entire repair.
 * This never treats a successful/skipped job as valid failure evidence. */
export function failedWorkflowJobGuidance(jobs,runId,requestedJobId) {
 const failed=(Array.isArray(jobs)?jobs:[])
   .filter(job=>job?.run_id===runId && job?.conclusion==='failure' && Number.isSafeInteger(job.id))
   .slice(0,12).map(job=>({jobId:job.id,name:String(job.name??'job').slice(0,100)}));
 return 'WORKFLOW_LOG_FAILED_JOB_REQUIRED: requested job '+String(requestedJobId)+
   ' is not a failed job in run '+String(runId)+
   '. Verified failed jobs: '+JSON.stringify(failed)+
   '. Use workflow_log with one exact listed run/job pair; if none, inspect current source.';
}
