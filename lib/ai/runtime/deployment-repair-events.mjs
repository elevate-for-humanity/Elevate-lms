const RELEASE_PATHS = new Set([
  '.github/workflows/deploy-admin.yml',
  '.github/workflows/deploy-google-lms-trigger.yml',
  '.github/workflows/deploy-google-marketing-trigger.yml',
  '.github/workflows/deploy-google-course-worker.yml',
  '.github/workflows/deploy-google-store-runtime.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/integrity-gate.yml',
  '.github/workflows/predeploy-check.yml',
  '.github/workflows/course-factory-authority.yml',
  '.github/workflows/lockfile-check.yml',
  '.github/workflows/registered-apprenticeship-e2e.yml',
  '.github/workflows/verify-paris-production-authorization.yml',
]);
const MAIN_CHECK_PATHS = new Set([
  '.github/workflows/ci.yml',
  '.github/workflows/integrity-gate.yml',
  '.github/workflows/predeploy-check.yml',
  '.github/workflows/course-factory-authority.yml',
  '.github/workflows/lockfile-check.yml',
]);

/** Only the latest execution on current main is actionable. A successful push
 * dispatcher is not execution evidence and cannot conceal a failed release. */
function currentWorkflowExecutions(runs, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha || '')) return [];
  const latest = new Map();
  for (const run of runs) {
    if (run.head_branch !== 'main' || run.head_sha !== sha || !RELEASE_PATHS.has(run.path) || run.conclusion === 'skipped' ||
        !(run.event === 'workflow_dispatch' ||
          (run.path === '.github/workflows/deploy-google-course-worker.yml' && run.event === 'push') ||
          (MAIN_CHECK_PATHS.has(run.path) && ['push','schedule'].includes(run.event)) ||
          (run.path === '.github/workflows/registered-apprenticeship-e2e.yml' && ['push','workflow_run'].includes(run.event)))) continue;
    const previous = latest.get(run.path);
    const time = Date.parse(run.run_started_at || run.created_at) || 0;
    const previousTime = Date.parse(previous?.run_started_at || previous?.created_at) || 0;
    if (!previous || time > previousTime || (time === previousTime && run.id > previous.id)) latest.set(run.path, run);
  }
  return [...latest.values()];
}

export function failedCurrentReleases(runs, sha) {
  return currentWorkflowExecutions(runs,sha).filter(run=>run.status==='completed'&&run.conclusion==='failure');
}

/** A saved goal is only a lookup hint. Authenticate its exact run before using
 * current execution evidence to decide whether it still needs a new worker. */
export function queuedWorkflowRepairTarget(goal) {
  const match=/^Diagnose and correct failed production release ([1-9][0-9]*) at exact main commit ([a-f0-9]{40})\. Workflow: (\.github\/workflows\/[a-z0-9-]+\.yml)\./.exec(goal??'');
  if(!match || !RELEASE_PATHS.has(match[3]) || !Number.isSafeInteger(Number(match[1])))return null;
  return {runId:Number(match[1]),sha:match[2],path:match[3]};
}

export function queuedWorkflowRepairDisposition(target, sourceRun, runs, mainSha) {
  const receipt={sourceRunId:target.runId,currentMainSha:mainSha,verified:false};
  if(sourceRun?.id!==target.runId || sourceRun.head_sha!==target.sha || sourceRun.path!==target.path ||
      sourceRun.head_branch!=='main' || sourceRun.status!=='completed' || sourceRun.conclusion!=='failure' ||
      !currentWorkflowExecutions([sourceRun],target.sha).some(run=>run.id===target.runId)) {
    return {...receipt,state:'invalid-source'};
  }
  const current=currentWorkflowExecutions(runs,mainSha).find(run=>run.path===target.path);
  if(!current || current.status!=='completed' || !['success','failure'].includes(current.conclusion)) {
    return {...receipt,state:'awaiting-current-execution'};
  }
  const evidence={...receipt,currentRunId:current.id,currentConclusion:current.conclusion};
  if(current.conclusion==='success')return {...evidence,state:'superseded-current-success'};
  if(sourceRun.head_sha!==mainSha)return {...evidence,state:'superseded-current-failure'};
  return {...evidence,state:'current-failure'};
}
