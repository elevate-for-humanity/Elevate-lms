import 'server-only';

export type EvaluationStatus = 'PASS' | 'FAIL_RETRYABLE' | 'FAIL_BLOCKING' | 'REQUIRES_HUMAN_REVIEW';

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

  reasons.push('Execution returned a non-empty result with no reported error.');
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
