import 'server-only';

export type EvaluationStatus =
  | 'PASS'
  | 'FAIL_RETRYABLE'
  | 'FAIL_BLOCKING'
  | 'REQUIRES_HUMAN_REVIEW';

export type EvaluationInput = {
  expectedOutput?: string;
  verificationRule?: string;
  tool: string;
  result?: unknown;
  error?: string | null;
  attempts?: number;
  maxAttempts?: number;
  approvalRequired?: boolean;
  approvedBy?: string | null;
};

export type EvaluationResult = {
  status: EvaluationStatus;
  reasons: string[];
  evidence: Record<string, unknown>;
};

function hasMeaningfulResult(result: unknown): boolean {
  if (result === null || result === undefined) return false;
  if (typeof result === 'string') return result.trim().length > 0;
  if (Array.isArray(result)) return result.length > 0;
  if (typeof result === 'object') return Object.keys(result as Record<string, unknown>).length > 0;
  return true;
}

function errorLooksRetryable(error: string): boolean {
  const value = error.toLowerCase();
  return [
    'timeout',
    'timed out',
    '429',
    'rate limit',
    'temporarily unavailable',
    '503',
    '502',
    'network',
    'connection reset',
    'circuit open',
  ].some((token) => value.includes(token));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasDurableToolEvidence(tool: string, result: unknown): string | null {
  const record = asRecord(result);
  if (!record) return null;

  if (tool === 'studio.engineering.execute') {
    const branch = asRecord(record.branch);
    const pullRequest = asRecord(record.pull_request ?? record.pullRequest);
    const rawChangedFiles = record.changed_files ?? record.changedFiles;
    const changedFiles = Array.isArray(rawChangedFiles) ? rawChangedFiles : [];
    const repositoryEvidence = Boolean(
      changedFiles.length > 0 &&
      typeof branch?.sha === 'string' &&
      branch.sha.length >= 7 &&
      (typeof pullRequest?.number === 'number' || typeof pullRequest?.url === 'string'),
    );
    return repositoryEvidence
      ? 'Elevate-owned Studio returned a changed branch and pull request for CI verification.'
      : null;
  }

  if (tool === 'openhands.execute') {
    const github = asRecord(record.github_verification);
    const branch = asRecord(github?.branch);
    const pullRequests = Array.isArray(github?.pullRequests) ? github.pullRequests : [];
    const repositoryEvidence = Boolean(
      github?.verified === true &&
      ((typeof branch?.sha === 'string' && branch.sha.length >= 7) || pullRequests.length > 0),
    );
    return repositoryEvidence
      ? 'Verified repository branch or pull request evidence was returned.'
      : null;
  }

  if (tool === 'workflows.runTests') {
    const checks = Array.isArray(record.checks) ? record.checks : [];
    const runId = record.workflow_run_id ?? record.workflowRunId ?? record.run_id ?? record.runId;
    const conclusion = String(record.conclusion ?? record.status ?? '').toLowerCase();
    return runId && checks.length > 0 && ['success', 'completed', 'passed'].includes(conclusion)
      ? 'Completed CI run and check evidence was returned.'
      : null;
  }

  if (tool === 'deployments.autopilot') {
    const deploymentId =
      record.deployment_id ?? record.deploymentId ?? record.run_id ?? record.runId;
    const status = String(record.status ?? record.conclusion ?? '').toLowerCase();
    return deploymentId && ['success', 'completed', 'deployed', 'ready'].includes(status)
      ? 'Deployment identifier and terminal deployment status were returned.'
      : null;
  }

  if (tool === 'browser.execute') {
    const failures = Array.isArray(record.failures) ? record.failures : null;
    const hasArtifact = Boolean(
      record.artifact_id ?? record.artifactId ?? record.session_id ?? record.sessionId,
    );
    return hasArtifact && (record.verified === true || record.clean === true || failures !== null)
      ? 'Durable browser verification evidence was returned.'
      : null;
  }

  return 'Tool does not require a specialized evidence contract.';
}

export function evaluateExecution(input: EvaluationInput): EvaluationResult {
  const reasons: string[] = [];
  const attempts = Math.max(0, Number(input.attempts ?? 0));
  const maxAttempts = Math.max(1, Number(input.maxAttempts ?? 1));

  if (input.approvalRequired && !input.approvedBy) {
    reasons.push('This action requires an authorized human approval before final execution.');
    return {
      status: 'REQUIRES_HUMAN_REVIEW',
      reasons,
      evidence: { tool: input.tool, approval_required: true },
    };
  }

  if (input.error) {
    reasons.push(input.error);
    const retryable = errorLooksRetryable(input.error) && attempts < maxAttempts;
    return {
      status: retryable ? 'FAIL_RETRYABLE' : 'FAIL_BLOCKING',
      reasons,
      evidence: { tool: input.tool, attempts, max_attempts: maxAttempts, error: input.error },
    };
  }

  if (!hasMeaningfulResult(input.result)) {
    reasons.push('The execution returned no verifiable result.');
    return {
      status: attempts < maxAttempts ? 'FAIL_RETRYABLE' : 'FAIL_BLOCKING',
      reasons,
      evidence: { tool: input.tool, attempts, max_attempts: maxAttempts },
    };
  }

  const evidenceContract = hasDurableToolEvidence(input.tool, input.result);
  if (!evidenceContract) {
    reasons.push(
      `${input.tool} returned a response, but it did not include the required durable evidence. Generic success flags are not verification.`,
    );
    return {
      status: 'FAIL_BLOCKING',
      reasons,
      evidence: {
        tool: input.tool,
        expected_output: input.expectedOutput ?? null,
        verification_rule: input.verificationRule ?? null,
      },
    };
  }

  const requiresEngineeringEvidence =
    input.verificationRule?.toLowerCase().includes('engineering runtime') ?? false;
  if (
    requiresEngineeringEvidence &&
    !['studio.engineering.execute', 'openhands.execute'].includes(input.tool)
  ) {
    reasons.push(
      `Engineering verification requires registered repository-mutation evidence; received ${input.tool}.`,
    );
    return {
      status: 'FAIL_BLOCKING',
      reasons,
      evidence: {
        tool: input.tool,
        expected_tool: 'studio.engineering.execute|openhands.execute',
        verification_rule: input.verificationRule ?? null,
      },
    };
  }

  reasons.push(evidenceContract);
  if (input.verificationRule) reasons.push(`Verification rule: ${input.verificationRule}`);

  return {
    status: 'PASS',
    reasons,
    evidence: {
      tool: input.tool,
      expected_output: input.expectedOutput ?? null,
      verification_rule: input.verificationRule ?? null,
      attempts,
      approved_by: input.approvedBy ?? null,
    },
  };
}
