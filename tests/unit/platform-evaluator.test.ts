import { describe, expect, it } from 'vitest';
import { evaluateExecution } from '@/lib/platform/orchestration/evaluator';

describe('platform execution evidence', () => {
  it('rejects a read-only OpenHands status result as engineering execution evidence', () => {
    const result = evaluateExecution({
      tool: 'openhands.status',
      result: { success: true, status: 'completed' },
      expectedOutput: 'Repository changes and verification evidence',
      verificationRule:
        'The engineering runtime must return concrete file, test, commit, and deployment evidence requested by the goal.',
      attempts: 1,
      maxAttempts: 1,
    });

    expect(result.status).toBe('FAIL_BLOCKING');
    expect(result.evidence).toMatchObject({
      tool: 'openhands.status',
      expected_tool: 'openhands.execute',
    });
  });

  it('accepts non-empty engineering execution evidence from the required tool', () => {
    const result = evaluateExecution({
      tool: 'openhands.execute',
      result: { repository: 'elevateforhumanity/Elevate-lms', pullRequests: [1123] },
      expectedOutput: 'Repository changes and verification evidence',
      verificationRule:
        'The engineering runtime must return concrete file, test, commit, and deployment evidence requested by the goal.',
      attempts: 1,
      maxAttempts: 1,
    });

    expect(result.status).toBe('PASS');
  });
});
