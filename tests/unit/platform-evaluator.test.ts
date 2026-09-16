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

  it('rejects a generic success object from a governed runner', () => {
    const result = evaluateExecution({
      tool: 'workflows.runTests',
      result: { ok: true },
      attempts: 1,
      maxAttempts: 1,
    });

    expect(result.status).toBe('FAIL_BLOCKING');
    expect(result.reasons.join(' ')).toContain('Generic success flags are not verification');
  });

  it('accepts independently verified repository evidence from OpenHands', () => {
    const result = evaluateExecution({
      tool: 'openhands.execute',
      result: {
        github_verification: {
          verified: true,
          branch: { name: 'studio-unification', sha: '0123456789abcdef' },
          pullRequests: [],
        },
      },
      expectedOutput: 'Repository changes and verification evidence',
      verificationRule:
        'The engineering runtime must return concrete file, test, commit, and deployment evidence requested by the goal.',
      attempts: 1,
      maxAttempts: 1,
    });

    expect(result.status).toBe('PASS');
  });

  it('requires run identifiers and terminal evidence for CI, deployment, and browser QA', () => {
    expect(
      evaluateExecution({
        tool: 'workflows.runTests',
        result: {
          workflowRunId: 42,
          status: 'completed',
          checks: [{ name: 'test', conclusion: 'success' }],
        },
      }).status,
    ).toBe('PASS');
    expect(
      evaluateExecution({
        tool: 'deployments.autopilot',
        result: { deploymentId: 'deploy-42', status: 'ready' },
      }).status,
    ).toBe('PASS');
    expect(
      evaluateExecution({
        tool: 'browser.execute',
        result: { sessionId: 'browser-42', verified: true, failures: [] },
      }).status,
    ).toBe('PASS');
  });
});
