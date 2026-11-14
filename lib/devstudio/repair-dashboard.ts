const repository = 'elevate-for-humanity/Elevate-lms';
const identifier = /^[A-Za-z0-9_-]{1,128}$/;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const sha = /^[a-f0-9]{40}$/;
const scalar = (value: unknown, pattern: RegExp): string | null =>
  typeof value === 'string' && pattern.test(value) ? value : null;

export function repairTaskId(row: any): string | null {
  return scalar(row.candidate?.openhands_task_id ?? row.candidate?.checkpoint?.taskId, uuid);
}

/** Read-only receipt. Never expose prompts, raw provider payloads or approval reasons. */
export function repairDashboardReceipt(row: any, task: any, actorId: string) {
  const candidate = row.candidate, verification = row.verification;
  const taskId = repairTaskId(row);
  const owned = task && task.id === taskId && task.user_id === actorId &&
    task.tool_name === 'openhands.execute' && (task.tenant_id ?? null) === null;
  const prNumber = verification?.pullRequest?.number;
  const releaseSha = scalar(row.release_sha, sha);
  const workflow = Number.isSafeInteger(row.workflow_run_id) && row.workflow_run_id > 0 ? row.workflow_run_id : null;
  const branch = candidate?.branch?.name ?? candidate?.checkpoint?.branch;
  const changedFiles = Array.isArray(candidate?.changed_files) ? candidate.changed_files.filter((path: unknown) =>
    typeof path === 'string' && path.length <= 300 && /^(?:(?:lib|components|apps|tests|workers|scripts|remotion-src|\.github)\/[A-Za-z0-9_./()[\]@-]+|Dockerfile\.(?:admin|lms|marketing))$/.test(path) &&
    !path.split('/').includes('..')).slice(0, 100) : [];
  const approvalStatus = owned && ['pending','approved','rejected','not_required'].includes(task.approval_status)
    ? task.approval_status : 'unverified';
  const approvalRequired = owned ? task.requires_approval === true || approvalStatus === 'pending' : null;
  const verifiedLive = row.status === 'verified' && Boolean(releaseSha) && verification?.tests === 'passed' &&
    verification?.deployments === 'passed' && verification?.exactRuntimeSha === true &&
    Number.isFinite(Date.parse(verification?.runtimeVerifiedAt ?? '')) &&
    (!row.source_job_id || verification?.courseExecution?.state === 'passed');
  return {
    repairId: row.id, sourceJobId: scalar(row.source_job_id, uuid), status: row.status,
    area: row.source_job_id ? 'Course Builder' : 'Engineering', repository, operation: 'Source repair',
    engine: !candidate || candidate.provider === 'openhands' || candidate.kind === 'openhands-checkpoint' ? 'openhands' : 'internal',
    taskId, conversationId: owned ? scalar(task.tool_output?.conversation_id, identifier) : null,
    approvalStatus, approvalRequired, approvalAuthority: approvalRequired ? 'Authorized human reviewer' : 'Protected GitHub review',
    blockerCode: scalar(row.error_code, /^[A-Z][A-Z0-9_]{0,119}$/),
    riskClassification: 'Unverified — review proposed changes',
    branch: typeof branch === 'string' && /^studio\/[a-zA-Z0-9/_-]+$/.test(branch) ? branch : null,
    changedFiles,
    pullRequest: Number.isSafeInteger(prNumber) && prNumber > 0 ? {number: prNumber, url: `https://github.com/${repository}/pull/${prNumber}`} : null,
    workflowUrl: workflow ? `https://github.com/${repository}/actions/runs/${workflow}` : null,
    releaseSha, verifiedLive, updatedAt: row.updated_at,
  };
}
