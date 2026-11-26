// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('retired OpenHands reconciliation contract', () => {
  it('keeps the retired scheduler endpoint unavailable', () => {
    expect(existsSync('apps/admin/app/api/cron/openhands-reconcile/route.ts')).toBe(false);
  });

  it('preserves exact task scope for historical reconciliation reads', () => {
    const runtime = readFileSync('lib/devstudio/openhands/runtime.ts', 'utf8');
    expect(runtime).toContain("if (taskId) query = query.eq('id', taskId)");
    expect(runtime).toContain('limit(taskId ? 1 :');
  });
});
