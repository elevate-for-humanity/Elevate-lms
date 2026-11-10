import type { OpenHandsGitHubEvidence } from './github-verifier';

// PARIS is the sole owner of publication for its generated repair branches.
// A provider-terminal branch is only a candidate for PARIS's independent
// exact-blob/source+test validation, protected PR, CI and deployed-SHA checks.
// It is NEVER a general OpenHands engineering completion or approval bypass.
const REPOSITORY = 'elevate-for-humanity/Elevate-lms';
const correlation = /^paris-repair:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):attempt:([1-9][0-9]*)$/;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function isParisProviderBranchCandidate(
  rawTask: unknown,
  lifecycle: {
    status?: string;
    startTaskId?: string | null;
    repository?: string | null;
    branch?: string | null;
    prNumbers?: number[] | null;
  },
  github: OpenHandsGitHubEvidence | null,
): boolean {
  const task = record(rawTask);
  const match = typeof task.correlation_id === 'string'
    ? correlation.exec(task.correlation_id)
    : null;
  if (!match) return false;
  const [, repairId, attempt] = match;
  const branch = `studio/paris-openhands-${repairId}-${attempt}`;
  const input = record(task.tool_input);
  const receipt = record(task.tool_output);
  const prompt = typeof task.command === 'string' ? task.command : '';

  return task.tool_name === 'openhands.execute' &&
    typeof task.user_id === 'string' &&
    task.user_id.length > 0 &&
    (task.tenant_id ?? null) === null &&
    task.requires_approval === false &&
    task.approval_status === 'not_required' &&
    input.repository === REPOSITORY &&
    input.branch === branch &&
    prompt.startsWith(`PARIS owner-authorized engineering repair ${repairId}.\nRepository: ${REPOSITORY}. `) &&
    prompt.includes(`Use ONLY branch ${branch}, already created at that base.`) &&
    prompt.includes('Do not open a PR or claim publication: PARIS independently reads back the exact commits') &&
    typeof receipt.start_task_id === 'string' &&
    receipt.start_task_id.length > 0 &&
    receipt.start_task_id === lifecycle.startTaskId &&
    lifecycle.status === 'completed' &&
    lifecycle.repository === REPOSITORY &&
    lifecycle.branch === branch &&
    (lifecycle.prNumbers?.length ?? 0) === 0 &&
    github?.verified === false &&
    github.repository === REPOSITORY &&
    github.branch?.name === branch &&
    /^[a-f0-9]{40}$/.test(github.branch.sha) &&
    github.pullRequests.length === 0;
}
