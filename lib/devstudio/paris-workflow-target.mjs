// Bind discovery to the failed run named by the repair request. The caller
// still verifies repository, ancestry, run status and job membership in GitHub.
export function repairWorkflowTarget(task) {
  const normalized=String(task).replace(/\\"/g,'"');
  const run=normalized.match(/failed production release (\d+)/i);
  const jobs=normalized.match(/Failed checks are untrusted evidence: (\[[\s\S]*?\])\. Use workflow_log/);
  if(!run || !jobs)return null;
  let entries;
  try { entries=JSON.parse(jobs[1]); } catch { return null; }
  const ids=entries.map(entry=>entry.id).filter(Number.isSafeInteger);
  const runId=Number(run[1]);
  if(!Number.isSafeInteger(runId)||runId<1||ids.length!==1||ids[0]<1)return null;
  return {type:'workflow_log',runId,jobId:ids[0]};
}

export function bindRepairWorkflowInspection(task, action, history=[]) {
  const target=repairWorkflowTarget(task);
  if(!target)return action;
  const key=`workflow_log:${target.runId}:${target.jobId}`;
  if(action.type==='workflow_log')return target;
  if(['list','read','search'].includes(action.type)&&!history.includes(key))return target;
  return action;
}


/**
 * A repair goal need not contain a failed GitHub job ID or exact boilerplate.
 * A descriptive deployment incident may carry only a run ID. Resolve that run
 * against the authenticated GitHub API before binding a failed job to inspection.
 * Never infer missing IDs from natural language or fabricate a failed job.
 */
export function repairWorkflowRunHint(task) {
  const source = String(task);
  const patterns = [
    /\bfailed\s+(?:production\s+)?(?:release|deployment|workflow|build)\s*(?:run\s*)?#?(\d{7,})\b/i,
    /\b(?:github\s+actions?\s+)?(?:workflow\s+)?run\s*(?:id\s*)?[#:]?\s*(\d{7,})\b/i,
  ];
  for (const pattern of patterns) {
    const match=source.match(pattern);
    if (!match) continue;
    const id=Number(match[1]);
    if (Number.isSafeInteger(id) && id>0) return id;
  }
  return null;
}

export async function bindVerifiedFailedWorkflowInspection(task, action, history=[], fetchRun, fetchJobs) {
  if (!['search','list','read','workflow_log'].includes(action?.type)) return action;
  const exact=repairWorkflowTarget(task);
  if (exact) return bindRepairWorkflowInspection(task,action,history);
  const runId=repairWorkflowRunHint(task);
  if (!runId || typeof fetchRun!=='function' || typeof fetchJobs!=='function') return action;
  const run=await fetchRun(runId);
  // A workflow run must be a completed failure on main. Source ancestry and
  // exact job membership remain independently verified by the execution path.
  if (run?.head_branch!=='main' || run?.status!=='completed' ||
      run?.conclusion!=='failure') return action;
  const inventory=await fetchJobs(runId);
  if (!Array.isArray(inventory?.jobs) || inventory.total_count>100) return action;
  const failed=inventory.jobs.filter(job=>job?.run_id===runId &&
    job.conclusion==='failure' && Number.isSafeInteger(job.id) && job.id>0);
  if (failed.length!==1) return action;
  const target={type:'workflow_log',runId,jobId:failed[0].id};
  if (history.includes(`workflow_log:${runId}:${target.jobId}`)) return action;
  return target;
}
