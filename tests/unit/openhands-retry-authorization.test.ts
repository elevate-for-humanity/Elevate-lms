import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { mayAutoRetryOpenHandsTask } from '../../lib/devstudio/openhands/retry-authorization';

describe('OpenHands retry authorization', () => {
  it('permits an explicitly non-approval-gated engineering attempt', () => {
    expect(mayAutoRetryOpenHandsTask({
      requires_approval: false,
      approval_status: 'not_required',
    })).toBe(true);
  });

  it.each([
    { requires_approval: true, approval_status: 'pending' },
    { requires_approval: true, approval_status: 'approved' },
    { requires_approval: false, approval_status: 'approved' },
    { requires_approval: false, approval_status: 'pending' },
    { requires_approval: false, approval_status: 'rejected' },
    { requires_approval: false, approval_status: null },
    { requires_approval: null, approval_status: 'not_required' },
  ])('never carries a prior approval into a fresh Cloud retry: %j', (input) => {
    expect(mayAutoRetryOpenHandsTask(input)).toBe(false);
  });

  it('gates before a new provider execution and preserves the approval receipt', () => {
    const source = readFileSync(path.join(process.cwd(), 'lib/devstudio/openhands/runtime.ts'), 'utf8');
    const retry = source.slice(source.indexOf('async function retryOpenHandsTask('), source.indexOf('export async function reconcileOpenHandsTasks('));
    expect(retry.indexOf('mayAutoRetryOpenHandsTask(input.task)')).toBeGreaterThanOrEqual(0);
    expect(retry.indexOf('mayAutoRetryOpenHandsTask(input.task)')).toBeLessThan(retry.indexOf('startOpenHandsTask('));
    expect(retry).not.toContain("approval_status: 'approved'");
    expect(retry).not.toContain('approval_reason: null');
    expect(retry).not.toContain('requires_approval: false');
    const claim = source.slice(source.indexOf('export async function reconcileOpenHandsTasks('), source.indexOf('export async function refreshOpenHandsTask('));
    expect(claim).toContain('mayAutoRetryOpenHandsTask(refreshed)');
    expect(claim).toContain(".eq('approval_status', 'not_required')");
    expect(claim).toContain(".eq('requires_approval', false)");
  });
});
