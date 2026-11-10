import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { evaluateExecution } from '../../lib/platform/orchestration/evaluator';

const verifiedGithub = {
  verified: true,
  repository: 'elevate-for-humanity/Elevate-lms',
  branch: { name: 'fix/example', sha: '1234567890abcdef1234567890abcdef12345678' },
  pullRequests: [{
    number: 2539,
    state: 'open',
    draft: false,
    merged: false,
    headSha: '1234567890abcdef1234567890abcdef12345678',
    headRef: 'fix/example',
    baseRef: 'main',
    changedFiles: ['lib/example.ts'],
    combinedStatus: 'success',
    checkRuns: [{ name: 'CI', status: 'completed', conclusion: 'success' }],
  }],
  reasons: ['Verified branch fix/example at 1234567890ab.'],
};

describe('OpenHands completion evidence contract', () => {
  it('accepts properly wrapped, independently verified GitHub evidence', () => {
    const result = evaluateExecution({
      tool: 'openhands.execute',
      result: { github_verification: verifiedGithub },
      attempts: 1,
      maxAttempts: 3,
    });
    expect(result.status).toBe('PASS');
  });

  it('rejects a preexisting branch without a changed PR', () => {
    const result = evaluateExecution({
      tool: 'openhands.execute',
      result: { github_verification: { ...verifiedGithub, pullRequests: [] } },
      attempts: 1,
      maxAttempts: 3,
    });
    expect(result.status).toBe('FAIL_BLOCKING');
  });

  it('rejects a PR with no completed CI checks or changed files', () => {
    for (const bad of [
      { ...verifiedGithub.pullRequests[0], checkRuns: [] },
      { ...verifiedGithub.pullRequests[0], changedFiles: [] },
      { ...verifiedGithub.pullRequests[0], checkRuns: [{ name: 'CI', status: 'in_progress', conclusion: null }] },
      { ...verifiedGithub.pullRequests[0], checkRuns: [{ name: 'CI', status: 'completed', conclusion: 'failure' }] },
    ]) {
      expect(evaluateExecution({
        tool: 'openhands.execute',
        result: { github_verification: { ...verifiedGithub, pullRequests: [bad] } },
      }).status).toBe('FAIL_BLOCKING');
    }
  });

  it('rejects the raw GitHub evidence shape that previously marked valid runs failed', () => {
    const result = evaluateExecution({
      tool: 'openhands.execute',
      result: verifiedGithub,
      attempts: 1,
      maxAttempts: 3,
    });
    expect(result.status).toBe('FAIL_BLOCKING');
  });

  it('passes the canonical nested evidence shape from runtime to the shared evaluator', () => {
    const source = readFileSync(path.join(process.cwd(), 'lib/devstudio/openhands/runtime.ts'), 'utf8');
    const begin = source.indexOf('function evaluateOpenHandsCompletion(');
    const end = source.indexOf('async function retryOpenHandsTask(', begin);
    expect(begin).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(begin);
    expect(source.slice(begin, end)).toMatch(/result:\s*\{\s*github_verification:\s*github\s*\}/);
  });
});
