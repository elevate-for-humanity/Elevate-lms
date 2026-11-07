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
