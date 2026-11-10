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
      expected_tool: 'studio.engineering.execute|openhands.execute',
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

  it('blocks OpenHands branch-only evidence without a reviewable patch and CI', () => {
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
    expect(result.status).toBe('FAIL_BLOCKING');
  });

  it('accepts verified OpenHands changed-PR evidence with completed CI', () => {
    const result = evaluateExecution({
      tool: 'openhands.execute',
      result: {
        github_verification: {
          verified: true,
          repository: 'elevate-for-humanity/Elevate-lms',
          branch: { name: 'fix/openhands-test', sha: '0123456789abcdef' },
          pullRequests: [{
            number: 2541,
            state: 'open',
            draft: false,
            merged: false,
            headSha: '0123456789abcdef',
            headRef: 'fix/openhands-test',
            baseRef: 'main',
            changedFiles: ['lib/devstudio/openhands/runtime.ts'],
            combinedStatus: 'success',
            checkRuns: [{ name: 'CI', status: 'completed', conclusion: 'success' }],
          }],
        },
      },
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


describe('semantic execution failures', () => {
  const snapshot = {
    overall: 'unknown',
    services: {
      database: { status: 'healthy' },
      redis: { status: 'healthy' },
      billing: { status: 'unknown' },
    },
  };

  it('verifies a platform-state read on real service evidence even when a service is unknown', () => {
    // A platform snapshot is evidence of current state, not a pass/fail gate.
    // An unverifiable billing service must not deadlock every plan at step 1.
    expect(evaluateExecution({ tool: 'system.health', result: snapshot }).status).toBe('PASS');
  });

  it('still blocks a platform-state read that reports the platform is down', () => {
    expect(
      evaluateExecution({ tool: 'system.health', result: { ...snapshot, overall: 'down' } }).status,
    ).toBe('FAIL_BLOCKING');
  });

  it('does not verify an unknown platform-state read that returns no service snapshot', () => {
    expect(evaluateExecution({ tool: 'system.health', result: { overall: 'unknown' } }).status).toBe(
      'FAIL_BLOCKING',
    );
  });

  it.each([{ overall: 'unhealthy' }, { status: 'failed' }, { status: 'unavailable' }, { status: 'degraded' }])('rejects %j as verified success', result => {
    expect(evaluateExecution({ tool: 'system.health', result }).status).toBe('FAIL_BLOCKING');
  });
  it.each(['pending', 'queued', 'running', 'awaiting_approval'])('does not verify an unfinished %s operation', status => {
    expect(evaluateExecution({ tool: 'advisory', result: {status}}).status).toBe('REQUIRES_HUMAN_REVIEW');
  });
  it('still accepts a healthy observed result', () => {
    expect(evaluateExecution({ tool: 'system.health', result: {overall: 'healthy', timestamp: new Date().toISOString()}}).status).toBe('PASS');
  });
});
